import type { Event } from './types';

const COLS = 'id, name, created_at';

/** 全 Event 取得（作成順） */
export async function listEvents(db: D1Database): Promise<Event[]> {
  const { results } = await db
    .prepare(`SELECT ${COLS} FROM events ORDER BY created_at`)
    .all<Event>();
  return results;
}

/** 単一 Event 取得（未登録なら null） */
export async function getEvent(db: D1Database, id: number): Promise<Event | null> {
  const row = await db
    .prepare(`SELECT ${COLS} FROM events WHERE id = ?`)
    .bind(id)
    .first<Event>();
  return row ?? null;
}

/** Event 作成。採番後の行を返す */
export async function createEvent(db: D1Database, name: string): Promise<Event> {
  const res = await db.prepare('INSERT INTO events (name) VALUES (?)').bind(name).run();
  const id = res.meta.last_row_id as number;
  const row = await getEvent(db, id);
  // 直後の取得が null になることは通常ないが、型安全のためフォールバック
  return row ?? { id, name, created_at: '' };
}

/** Event 更新。対象が無ければ false */
export async function updateEvent(
  db: D1Database,
  id: number,
  patch: { name: string },
): Promise<boolean> {
  const res = await db
    .prepare('UPDATE events SET name = ? WHERE id = ?')
    .bind(patch.name, id)
    .run();
  return (res.meta.changes ?? 0) > 0;
}

/**
 * Event 削除。配下の notifications も連鎖削除する。
 * 各 notification は deleteNotification と同様に occurrences / responses / assignments も掃除する。
 */
export async function deleteEvent(db: D1Database, id: number): Promise<boolean> {
  // 配下 notification の occurrences を母集団に responses / assignments を削除
  await db
    .prepare(
      `DELETE FROM responses WHERE occurrence_id IN (
         SELECT o.id FROM occurrences o
         JOIN notifications n ON n.id = o.notification_id
         WHERE n.event_id = ?
       )`,
    )
    .bind(id)
    .run();
  await db
    .prepare(
      `DELETE FROM assignments WHERE occurrence_id IN (
         SELECT o.id FROM occurrences o
         JOIN notifications n ON n.id = o.notification_id
         WHERE n.event_id = ?
       )`,
    )
    .bind(id)
    .run();
  await db
    .prepare(
      `DELETE FROM occurrences WHERE notification_id IN (
         SELECT id FROM notifications WHERE event_id = ?
       )`,
    )
    .bind(id)
    .run();
  await db.prepare('DELETE FROM notifications WHERE event_id = ?').bind(id).run();

  const res = await db.prepare('DELETE FROM events WHERE id = ?').bind(id).run();
  return (res.meta.changes ?? 0) > 0;
}
