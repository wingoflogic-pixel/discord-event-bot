import { describe, it, expect } from 'vitest';
import { env } from 'cloudflare:test';
import { addMember } from '../src/db/members';
import {
  createSegment,
  addSegmentMember,
  setSegmentMemberStatus,
  getActiveSegmentMembers,
} from '../src/db/segments';
import { upsertResponse, getStatusBuckets, checkQuotaForNotification } from '../src/db/responses';
import { assignNumbers, getAssignments } from '../src/db/assignments';
import type { Notification } from '../src/db/types';

const db = () => env.DB;

// --- テスト用の最小フィクスチャ ---
// Event 廃止後、Notification は guild_id で Server に直結する（ADR 0005）。
const GUILD = 'g1';

/** notifications に 1 行入れて Notification を返す（必要列のみ over で上書き） */
async function insertNotification(
  guildId: string,
  segmentId: number,
  over: Partial<Notification> = {},
): Promise<Notification> {
  const n: Notification = {
    id: 0,
    uuid: '00000000-0000-0000-0000-000000000001',
    guild_id: guildId,
    segment_id: segmentId,
    name: 'テスト通知',
    channel_id: 'c1',
    type: 'recurring',
    rrule: 'FREQ=WEEKLY;BYDAY=SA',
    one_off_date: null,
    anchor_date: null,
    start_time: '21:00',
    duration_minutes: null,
    recruit_days_before: 7,
    remind_start_days: 3,
    remind_undecided_days: 1,
    quota_enabled: 0,
    quota_interval_days: null,
    assignment_enabled: 0,
    grouping_enabled: 0,
    mention_enabled: 1,
    mention_mode: 'role',
    requires_response: 1,
    message_title: 'テスト通知',
    message_body: null,
    active: 1,
    decided_occurrence_id: null,
    response_deadline_hours: null,
    change_alert_channel_id: null,
    send_hour: 21,
    created_at: '',
    ...over,
  };
  const res = await db()
    .prepare(
      `INSERT INTO notifications (
         guild_id, segment_id, name, channel_id, type, rrule, one_off_date, start_time,
         recruit_days_before, remind_start_days, remind_undecided_days,
         quota_enabled, quota_interval_days, assignment_enabled, mention_enabled, active
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      n.guild_id,
      n.segment_id,
      n.name,
      n.channel_id,
      n.type,
      n.rrule,
      n.one_off_date,
      n.start_time,
      n.recruit_days_before,
      n.remind_start_days,
      n.remind_undecided_days,
      n.quota_enabled,
      n.quota_interval_days,
      n.assignment_enabled,
      n.mention_enabled,
      n.active,
    )
    .run();
  n.id = res.meta.last_row_id as number;
  return n;
}

/** occurrences に 1 行入れて id を返す */
async function insertOccurrence(
  notificationId: number,
  dateStr: string,
  status: 'scheduled' | 'cancelled' = 'scheduled',
  startTime = '',
): Promise<number> {
  const res = await db()
    .prepare(
      'INSERT INTO occurrences (notification_id, occurrence_date, start_time, status) VALUES (?, ?, ?, ?)',
    )
    .bind(notificationId, dateStr, startTime, status)
    .run();
  return res.meta.last_row_id as number;
}

describe('segment members（アクティブ集計）', () => {
  it('getActiveSegmentMembers は status="" のみを返す', async () => {
    const seg = await createSegment(db(), { guild_id: 'g1', name: 'キャスト', mention_role_id: null });
    await addMember(db(), 'u1', 'n1', 'D1');
    await addMember(db(), 'u2', 'n2', 'D2');
    await addMember(db(), 'u3', 'n3', 'D3');
    await addSegmentMember(db(), seg.id, 'u1');
    await addSegmentMember(db(), seg.id, 'u2');
    await addSegmentMember(db(), seg.id, 'u3');
    await setSegmentMemberStatus(db(), seg.id, 'u3', '休止中');

    const active = await getActiveSegmentMembers(db(), seg.id);
    expect(active.map((m) => m.user_id).sort()).toEqual(['u1', 'u2']);
  });

  it('getStatusBuckets は区分アクティブメンバーを母集団に集計し休止者を除外・未回答を補完', async () => {
    const seg = await createSegment(db(), { guild_id: 'g1', name: 'キャスト', mention_role_id: null });
    const n = await insertNotification(GUILD, seg.id);
    const occId = await insertOccurrence(n.id, '2025/01/04');

    await addMember(db(), 'u1', 'n1', 'D1');
    await addMember(db(), 'u2', 'n2', 'D2');
    await addMember(db(), 'u3', 'n3', 'D3');
    await addMember(db(), 'u4', 'n4', 'D4'); // 区分外 → 母集団に含まれない
    await addSegmentMember(db(), seg.id, 'u1');
    await addSegmentMember(db(), seg.id, 'u2');
    await addSegmentMember(db(), seg.id, 'u3');
    await setSegmentMemberStatus(db(), seg.id, 'u3', '休止中'); // 除外対象

    await upsertResponse(db(), occId, 'u1', 'n1', '参加');
    await upsertResponse(db(), occId, 'u3', 'n3', '参加'); // 休止者の回答は無視される
    await upsertResponse(db(), occId, 'u4', 'n4', '参加'); // 区分外の回答も無視される

    const buckets = await getStatusBuckets(db(), occId, seg.id);
    expect(buckets.参加).toEqual(['D1']);
    expect(buckets.未回答).toEqual(['D2']); // u2 は未回答, u3 は休止で除外, u4 は区分外
    expect(buckets.不参加).toEqual([]);
    expect(buckets.未定).toEqual([]);
  });
});

describe('checkQuotaForNotification', () => {
  it('quota 無効なら空配列', async () => {
    const seg = await createSegment(db(), { guild_id: 'g1', name: 'キャスト', mention_role_id: null });
    const n = await insertNotification(GUILD, seg.id, {
      quota_enabled: 0,
      quota_interval_days: 30,
    });
    expect(await checkQuotaForNotification(db(), n)).toEqual([]);
  });

  it('最終参加日から interval を超えたアクティブメンバーのみ返す（未参加者は除外）', async () => {
    const seg = await createSegment(db(), { guild_id: 'g1', name: 'キャスト', mention_role_id: null });
    const n = await insertNotification(GUILD, seg.id, {
      quota_enabled: 1,
      quota_interval_days: 30,
    });

    await addMember(db(), 'u1', 'n1', 'D1');
    await addMember(db(), 'u2', 'n2', 'D2');
    await addMember(db(), 'u3', 'n3', 'D3'); // 未参加 → 対象外
    await addSegmentMember(db(), seg.id, 'u1');
    await addSegmentMember(db(), seg.id, 'u2');
    await addSegmentMember(db(), seg.id, 'u3');

    const occOld = await insertOccurrence(n.id, '2025/01/01'); // 古い回
    const occNew = await insertOccurrence(n.id, '2025/03/01'); // 直近の回
    await upsertResponse(db(), occOld, 'u1', 'n1', '参加'); // u1 の最終参加 = 2025/01/01
    await upsertResponse(db(), occNew, 'u2', 'n2', '参加'); // u2 の最終参加 = 2025/03/01

    const now = new Date(Date.UTC(2025, 2, 15, 12, 0)); // 2025/03/15 JST 相当
    const alerts = await checkQuotaForNotification(db(), n, now);
    const ids = alerts.map((a) => a.user_id);
    expect(ids).toContain('u1'); // 約73日経過 > 30
    expect(ids).not.toContain('u2'); // 14日経過 ≤ 30
    expect(ids).not.toContain('u3'); // 未参加
  });

  it('休止メンバーは対象外', async () => {
    const seg = await createSegment(db(), { guild_id: 'g1', name: 'キャスト', mention_role_id: null });
    const n = await insertNotification(GUILD, seg.id, {
      quota_enabled: 1,
      quota_interval_days: 30,
    });
    await addMember(db(), 'u1', 'n1', 'D1');
    await addSegmentMember(db(), seg.id, 'u1');
    await setSegmentMemberStatus(db(), seg.id, 'u1', '休止中');
    const occ = await insertOccurrence(n.id, '2025/01/01');
    await upsertResponse(db(), occ, 'u1', 'n1', '参加');

    const now = new Date(Date.UTC(2025, 2, 15, 12, 0));
    expect(await checkQuotaForNotification(db(), n, now)).toEqual([]);
  });
});

describe('assignNumbers（ADR 0018: 2 モード・全振り直し）', () => {
  /** その occurrence で「参加」と回答した member を用意（順次 upsert で updated_at に差を付ける） */
  async function setupParticipants(occId: number, userIds: string[]) {
    for (const uid of userIds) {
      await addMember(db(), uid, `name_${uid}`, `Disp_${uid}`);
      await upsertResponse(db(), occId, uid, `name_${uid}`, '参加');
    }
  }

  it("mode='first-come': 参加者全員に 1..N を回答時刻の早い順で振る", async () => {
    const seg = await createSegment(db(), { guild_id: 'g1', name: 'キャスト', mention_role_id: null });
    const n = await insertNotification(GUILD, seg.id);
    const occId = await insertOccurrence(n.id, '2025/01/04');
    // 1 つずつ間隔を空けて updated_at に差を付ける
    await setupParticipants(occId, ['u_third']);
    await new Promise((r) => setTimeout(r, 5));
    await setupParticipants(occId, ['u_first']);
    await new Promise((r) => setTimeout(r, 5));
    await setupParticipants(occId, ['u_second']);
    // 各人の最終回答時刻に再差を付けるため、希望順に再 upsert
    await new Promise((r) => setTimeout(r, 5));
    await upsertResponse(db(), occId, 'u_first', 'name_u_first', '参加');
    await new Promise((r) => setTimeout(r, 5));
    await upsertResponse(db(), occId, 'u_second', 'name_u_second', '参加');
    await new Promise((r) => setTimeout(r, 5));
    await upsertResponse(db(), occId, 'u_third', 'name_u_third', '参加');

    const { assigned, all } = await assignNumbers(db(), occId, 'first-come');
    expect(assigned).toHaveLength(3);
    expect(all).toHaveLength(3);
    // 早い順: u_first → u_second → u_third
    expect(all.map((a) => a.user_id)).toEqual(['u_first', 'u_second', 'u_third']);
    expect(all.map((a) => a.number)).toEqual([1, 2, 3]);
    expect(all.every((a) => a.name.startsWith('Disp_'))).toBe(true);
  });

  it("mode='first-come': 同一 updated_at は user_id 昇順でタイブレーク", async () => {
    const seg = await createSegment(db(), { guild_id: 'g1', name: 'キャスト', mention_role_id: null });
    const n = await insertNotification(GUILD, seg.id);
    const occId = await insertOccurrence(n.id, '2025/01/04');
    // 同タイミングで upsert（updated_at が同一秒に揃いやすい）
    await addMember(db(), 'u_b', 'b', 'B');
    await addMember(db(), 'u_a', 'a', 'A');
    const sameTs = new Date().toISOString();
    await db()
      .prepare(
        `INSERT INTO responses (occurrence_id, user_id, user_name, status, updated_at, post_deadline_change)
         VALUES (?, 'u_b', 'b', '参加', ?, 0), (?, 'u_a', 'a', '参加', ?, 0)`,
      )
      .bind(occId, sameTs, occId, sameTs)
      .run();

    const { all } = await assignNumbers(db(), occId, 'first-come');
    expect(all.map((a) => a.user_id)).toEqual(['u_a', 'u_b']);
    expect(all.map((a) => a.number)).toEqual([1, 2]);
  });

  it("mode='random': 1..N の重複なし番号で参加者全員に振る", async () => {
    const seg = await createSegment(db(), { guild_id: 'g1', name: 'キャスト', mention_role_id: null });
    const n = await insertNotification(GUILD, seg.id);
    const occId = await insertOccurrence(n.id, '2025/01/04');
    await setupParticipants(occId, ['u1', 'u2', 'u3', 'u4', 'u5']);

    const { assigned, all } = await assignNumbers(db(), occId, 'random');
    expect(assigned).toHaveLength(5);
    expect(all.map((a) => a.number)).toEqual([1, 2, 3, 4, 5]);
    expect(new Set(all.map((a) => a.user_id)).size).toBe(5);
  });

  it('再実行は既存番号を破棄して 1..N を振り直す（ADR 0018: 安定割り当て破棄）', async () => {
    const seg = await createSegment(db(), { guild_id: 'g1', name: 'キャスト', mention_role_id: null });
    const n = await insertNotification(GUILD, seg.id);
    const occId = await insertOccurrence(n.id, '2025/01/04');
    await setupParticipants(occId, ['u1', 'u2']);

    const first = await assignNumbers(db(), occId, 'first-come');
    expect(first.all.map((a) => a.number)).toEqual([1, 2]);

    // 新規 u3 を追加し、u3 が先に回答した状態を作るため updated_at を上書き
    await setupParticipants(occId, ['u3']);
    await new Promise((r) => setTimeout(r, 5));
    await upsertResponse(db(), occId, 'u1', 'name_u1', '参加');
    await upsertResponse(db(), occId, 'u2', 'name_u2', '参加');

    const second = await assignNumbers(db(), occId, 'first-come');
    // 全員振り直し: u3 (最古) → u1 → u2 の順
    expect(second.all.map((a) => a.user_id)).toEqual(['u3', 'u1', 'u2']);
    expect(second.all.map((a) => a.number)).toEqual([1, 2, 3]);
    // assignments テーブルにも 3 行のみ（重複なし）
    const list = await getAssignments(db(), occId);
    expect(list.map((a) => a.number)).toEqual([1, 2, 3]);
  });

  it('不参加・未定は採番対象外', async () => {
    const seg = await createSegment(db(), { guild_id: 'g1', name: 'キャスト', mention_role_id: null });
    const n = await insertNotification(GUILD, seg.id);
    const occId = await insertOccurrence(n.id, '2025/01/04');
    await addMember(db(), 'u1', 'n1', 'D1');
    await addMember(db(), 'u2', 'n2', 'D2');
    await addMember(db(), 'u3', 'n3', 'D3');
    await upsertResponse(db(), occId, 'u1', 'n1', '参加');
    await upsertResponse(db(), occId, 'u2', 'n2', '不参加');
    await upsertResponse(db(), occId, 'u3', 'n3', '未定');

    const { all } = await assignNumbers(db(), occId, 'first-come');
    expect(all.map((a) => a.user_id)).toEqual(['u1']);
    expect(all[0].number).toBe(1);
  });
});
