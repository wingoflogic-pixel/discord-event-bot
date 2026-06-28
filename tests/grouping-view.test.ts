import { describe, it, expect } from 'vitest';
import { env } from 'cloudflare:test';
import { createSegment } from '../src/db/segments';
import {
  upsertGrouping,
  setGroupMembers,
  getGroupingView,
} from '../src/db/groupings';
import type { Notification } from '../src/db/types';

const db = () => env.DB;
const GUILD = 'g-view';

/**
 * このテストの存在意義（バグ後の再発防止）:
 *
 * 2026-06-28 に、`getGroupingView` の戻り値で `groups[].uuid` が含まれていない不具合
 * を発見。view.groups[i].uuid が undefined のまま管理UIへ流れた結果、グループ列の
 * `data-group-key` / `id="count-..."` が全グループで同一値となり、querySelector が
 * 衝突して counter ズレ／制約違反の誤判定／rename 400／保存後の配置消失といった
 * 一連の症状を引き起こしていた。
 *
 * フィールド一個の欠落が UI 全体を機能不全にする ため、レスポンスの**形状そのもの**を
 * テストで固定化する。
 */
async function insertNotification(segmentId: number): Promise<Notification> {
  const ins = await db()
    .prepare(
      `INSERT INTO notifications (
         guild_id, segment_id, name, channel_id, type, rrule, one_off_date, start_time,
         recruit_days_before, remind_start_days, remind_undecided_days,
         quota_enabled, quota_interval_days, assignment_enabled, mention_enabled, active
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(GUILD, segmentId, 'n', 'c', 'recurring', 'FREQ=WEEKLY;BYDAY=SA',
      null, '21:00', 7, 3, 1, 0, null, 0, 1, 1)
    .run();
  return { id: ins.meta.last_row_id as number } as Notification;
}

async function insertOccurrence(notificationId: number): Promise<number> {
  const r = await db()
    .prepare(
      'INSERT INTO occurrences (notification_id, occurrence_date, start_time, status) VALUES (?, ?, ?, ?)',
    )
    .bind(notificationId, '2026/01/01', '21:00', 'scheduled')
    .run();
  return r.meta.last_row_id as number;
}

describe('getGroupingView レスポンス形状', () => {
  it('groups[] に uuid が必ず含まれる（非空文字列）', async () => {
    const seg = await createSegment(db(), {
      guild_id: GUILD,
      name: 'キャスト',
      mention_role_id: null,
    });
    const n = await insertNotification(seg.id);
    const occId = await insertOccurrence(n.id);
    await upsertGrouping(db(), occId, 3);

    const view = await getGroupingView(db(), occId);

    expect(view.groups.length).toBe(3);
    for (const g of view.groups) {
      expect(typeof g.uuid).toBe('string');
      expect(g.uuid.length).toBeGreaterThan(0);
    }
    // group 同士は互いに別の uuid を持つ
    const uuids = view.groups.map((g) => g.uuid);
    expect(new Set(uuids).size).toBe(uuids.length);
  });

  it('group_count を変更しても残った groups は uuid を保持する', async () => {
    const seg = await createSegment(db(), {
      guild_id: GUILD,
      name: 'キャスト2',
      mention_role_id: null,
    });
    const n = await insertNotification(seg.id);
    const occId = await insertOccurrence(n.id);
    await upsertGrouping(db(), occId, 4);
    const view1 = await getGroupingView(db(), occId);
    const uuidsBefore = view1.groups.map((g) => g.uuid);
    await upsertGrouping(db(), occId, 2);
    const view2 = await getGroupingView(db(), occId);

    expect(view2.groups.length).toBe(2);
    // 残った group の uuid は変更前と一致（uuid が undefined 同士で一致してしまうケースをガード）
    expect(typeof view2.groups[0].uuid).toBe('string');
    expect(view2.groups[0].uuid.length).toBeGreaterThan(0);
    expect(view2.groups[0].uuid).toBe(uuidsBefore[0]);
    expect(view2.groups[1].uuid).toBe(uuidsBefore[1]);
  });

  it('setGroupMembers でメンバーを割り振っても uuid は欠落しない', async () => {
    const seg = await createSegment(db(), {
      guild_id: GUILD,
      name: 'キャスト3',
      mention_role_id: null,
    });
    const n = await insertNotification(seg.id);
    const occId = await insertOccurrence(n.id);
    await upsertGrouping(db(), occId, 2);
    const view1 = await getGroupingView(db(), occId);
    await setGroupMembers(db(), (await db()
      .prepare('SELECT id FROM groupings WHERE occurrence_id = ?')
      .bind(occId)
      .first<{ id: number }>())!.id, [
      { group_id: view1.groups[0].id, user_ids: [] },
      { group_id: view1.groups[1].id, user_ids: [] },
    ]);
    const view2 = await getGroupingView(db(), occId);

    for (const g of view2.groups) {
      expect(typeof g.uuid).toBe('string');
      expect(g.uuid.length).toBeGreaterThan(0);
    }
  });
});
