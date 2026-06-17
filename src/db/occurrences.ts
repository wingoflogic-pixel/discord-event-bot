import type { Occurrence, OccurrenceStatus } from './types';

const COLS = 'id, notification_id, occurrence_date, status, created_at';

/**
 * Occurrence を取得 or 生成。UNIQUE(notification_id, occurrence_date) で upsert。
 * 既存なら（cancelled でも）その行を返す。
 */
export async function getOrCreateOccurrence(
  db: D1Database,
  notificationId: number,
  dateStr: string,
): Promise<Occurrence> {
  const existing = await db
    .prepare(`SELECT ${COLS} FROM occurrences WHERE notification_id = ? AND occurrence_date = ?`)
    .bind(notificationId, dateStr)
    .first<Occurrence>();
  if (existing) return existing;

  const res = await db
    .prepare('INSERT INTO occurrences (notification_id, occurrence_date) VALUES (?, ?)')
    .bind(notificationId, dateStr)
    .run();
  const id = res.meta.last_row_id as number;
  const row = await db
    .prepare(`SELECT ${COLS} FROM occurrences WHERE id = ?`)
    .bind(id)
    .first<Occurrence>();
  return (
    row ?? {
      id,
      notification_id: notificationId,
      occurrence_date: dateStr,
      status: 'scheduled',
      created_at: '',
    }
  );
}

/** 単一 Occurrence 取得（未登録なら null） */
export async function getOccurrence(db: D1Database, id: number): Promise<Occurrence | null> {
  const row = await db
    .prepare(`SELECT ${COLS} FROM occurrences WHERE id = ?`)
    .bind(id)
    .first<Occurrence>();
  return row ?? null;
}

/** Notification の最新の予定回（occurrence_date 最大・status='scheduled'）。無ければ null */
export async function getLatestScheduledOccurrence(
  db: D1Database,
  notificationId: number,
): Promise<Occurrence | null> {
  const row = await db
    .prepare(
      `SELECT ${COLS} FROM occurrences
        WHERE notification_id = ? AND status = 'scheduled'
        ORDER BY occurrence_date DESC LIMIT 1`,
    )
    .bind(notificationId)
    .first<Occurrence>();
  return row ?? null;
}

/** 開催回ステータス更新（'scheduled' / 'cancelled'）。対象が無ければ false */
export async function setOccurrenceStatus(
  db: D1Database,
  id: number,
  status: OccurrenceStatus,
): Promise<boolean> {
  const res = await db
    .prepare('UPDATE occurrences SET status = ? WHERE id = ?')
    .bind(status, id)
    .run();
  return (res.meta.changes ?? 0) > 0;
}

/** 開催日を更新（リスケ）。対象が無ければ false */
export async function updateOccurrenceDate(
  db: D1Database,
  id: number,
  dateStr: string,
): Promise<boolean> {
  const res = await db
    .prepare('UPDATE occurrences SET occurrence_date = ? WHERE id = ?')
    .bind(dateStr, id)
    .run();
  return (res.meta.changes ?? 0) > 0;
}

/** Notification の開催回一覧（新しい順） */
export async function listOccurrencesForNotification(
  db: D1Database,
  notificationId: number,
  limit = 100,
): Promise<Occurrence[]> {
  const { results } = await db
    .prepare(
      `SELECT ${COLS} FROM occurrences
        WHERE notification_id = ?
        ORDER BY occurrence_date DESC LIMIT ?`,
    )
    .bind(notificationId, limit)
    .all<Occurrence>();
  return results;
}
