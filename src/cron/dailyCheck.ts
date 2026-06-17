import type { Env } from '../env';
import type { Member, Notification, Occurrence } from '../db/types';
import { resolveDisplayName } from '../db/types';
import { listActiveNotifications } from '../db/notifications';
import { getOrCreateOccurrence } from '../db/occurrences';
import {
  getResponsesForOccurrence,
  getUndecidedForOccurrence,
  checkQuotaForNotification,
} from '../db/responses';
import { getActiveSegmentMembers, getSegment } from '../db/segments';
import { nextOccurrenceDate } from '../lib/recurrence';
import { getDaysUntil, getJSTNow } from '../lib/date';
import {
  sendChannelMessage,
  sendDirectMessageCached,
  createButtonComponents,
  buildMentionPrefix,
} from '../discord/rest';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const DM_INTERVAL_MS = 300;

/** 'YYYY/MM/DD' の曜日（JST 壁時計）。0=日 → '日' */
const WEEKDAY_LABELS = ['日', '月', '火', '水', '木', '金', '土'];
function weekdayLabel(dateStr: string): string {
  const [y, m, d] = dateStr.split('/').map(Number);
  return WEEKDAY_LABELS[new Date(y, m - 1, d).getDay()];
}

/** [PRD 4.2.1] 募集 */
async function sendRecruitment(
  env: Env,
  n: Notification,
  occ: Occurrence,
): Promise<void> {
  const segment = await getSegment(env.DB, n.segment_id);
  const prefix = segment ? buildMentionPrefix(segment, !!n.mention_enabled) : '';
  const dow = weekdayLabel(occ.occurrence_date);
  const message =
    `${prefix}📅 **イベント募集開始!**\n\n` +
    `日時: **${occ.occurrence_date} (${dow}) ${n.start_time}~**\n\n` +
    `参加状況を下のボタンで回答してください!`;
  const ok = await sendChannelMessage(
    env,
    n.channel_id,
    message,
    createButtonComponents(occ.id),
  );
  console.log(ok ? `✅ [Recruitment] sent (n=${n.id})` : `❌ [Recruitment] failed (n=${n.id})`);
}

/** [PRD 4.2.4] ノルマ確認（個別 DM） */
async function checkQuotaAndNotify(env: Env, n: Notification): Promise<void> {
  const db = env.DB;
  const alerts = await checkQuotaForNotification(db, n);
  if (alerts.length === 0) {
    console.log(`[Quota] all within interval (n=${n.id})`);
    return;
  }

  let sent = 0;
  for (const member of alerts) {
    // checkQuotaForNotification は未参加者を除外して返すため daysSinceLast は常に正値。
    const daysText = `${member.daysSinceLast}日前`;
    const message =
      `📊 **参加間隔の確認**\n\n` +
      `こんにちは、**${resolveDisplayName(member)}** さん！\n` +
      `前回のイベント参加から少し時間が空いているようです（目安: ${n.quota_interval_days}日に1回）。\n\n` +
      `- 最終参加: **${member.lastDateStr}** (${daysText})\n\n` +
      `次回のイベントへの参加をぜひご検討ください！お待ちしています✨`;
    const ok = await sendDirectMessageCached(env, db, member, message);
    if (ok) sent++;
    else console.error(`❌ [Quota] DM failed: ${member.user_name}`);
    await sleep(DM_INTERVAL_MS);
  }
  console.log(`✅ [Quota] sent ${sent}/${alerts.length} (n=${n.id})`);
}

/** [PRD 4.2.2] 未回答リマインド（個別 DM）。対象=区分アクティブメンバー − 既回答 */
async function sendUnansweredReminder(
  env: Env,
  n: Notification,
  occ: Occurrence,
  daysUntil: number,
): Promise<void> {
  const db = env.DB;
  const members = await getActiveSegmentMembers(db, n.segment_id);
  const responses = await getResponsesForOccurrence(db, occ.id);

  const unanswered = members.filter((m) => !responses[m.user_id]);
  if (unanswered.length === 0) {
    console.log(`[Unanswered] all responded (n=${n.id})`);
    return;
  }

  const dayText = daysUntil === 0 ? '今日' : `あと${daysUntil}日`;
  let sent = 0;
  for (const member of unanswered) {
    const message =
      `⏰ **リマインド: ${dayText}のイベント**\n\n` +
      `日時: **${occ.occurrence_date}**\n\n` +
      `まだ回答されていません。下のボタンで参加状況を回答してください!`;
    const ok = await sendDirectMessageCached(
      env,
      db,
      member,
      message,
      createButtonComponents(occ.id),
    );
    if (ok) sent++;
    else console.error(`❌ [Unanswered] DM failed: ${member.user_name}`);
    await sleep(DM_INTERVAL_MS);
  }
  console.log(`✅ [Unanswered] DM sent ${sent}/${unanswered.length} (n=${n.id})`);
}

/** [PRD 4.2.3] 未定者リマインド（個別 DM）。休止者は除外 */
async function sendUndecidedReminder(
  env: Env,
  n: Notification,
  occ: Occurrence,
): Promise<void> {
  const db = env.DB;
  const undecided = await getUndecidedForOccurrence(db, occ.id);
  if (undecided.length === 0) {
    console.log(`[Undecided] none (n=${n.id})`);
    return;
  }

  // 休止者を除外するため、区分のアクティブメンバーを母集団とする。
  const activeMembers = await getActiveSegmentMembers(db, n.segment_id);
  const activeById = new Map(activeMembers.map((m) => [m.user_id, m]));

  const targets: Member[] = [];
  for (const u of undecided) {
    // 区分でアクティブな未定者のみ対象（休止・未所属はスキップ）
    const active = activeById.get(u.userId);
    if (active) targets.push(active);
  }
  if (targets.length === 0) {
    console.log(`[Undecided] no active targets (n=${n.id})`);
    return;
  }

  let sent = 0;
  for (const member of targets) {
    const message =
      `❓ **未定者へのリマインド**\n\n` +
      `日時: **${occ.occurrence_date}**\n\n` +
      `現在「未定」で回答されています。下のボタンで参加/不参加を確定してください!`;
    const ok = await sendDirectMessageCached(
      env,
      db,
      member,
      message,
      createButtonComponents(occ.id),
    );
    if (ok) sent++;
    else console.error(`❌ [Undecided] DM failed: ${member.user_name}`);
    await sleep(DM_INTERVAL_MS);
  }
  console.log(`✅ [Undecided] DM sent ${sent}/${targets.length} (n=${n.id})`);
}

/**
 * [PRD 4.2] 日次メインチェック（旧 mainDailyCheck）。
 * active な Notification をすべてループし、それぞれの次回開催日と daysUntil から
 * 募集 & ノルマ / 未回答リマインド / 未定リマインドを判定・実行する。
 */
export async function mainDailyCheck(env: Env): Promise<void> {
  console.log('=== mainDailyCheck START ===');
  const db = env.DB;
  const notifications = await listActiveNotifications(db);
  console.log(`Active notifications: ${notifications.length}`);

  for (const n of notifications) {
    const target = nextOccurrenceDate(n);
    if (!target) {
      console.log(`[n=${n.id}] no next occurrence, skip`);
      continue;
    }
    const daysUntil = getDaysUntil(target);
    console.log(`[n=${n.id}] Target: ${target}, daysUntil: ${daysUntil}`);

    // 募集 & ノルマ確認（募集開始日に同時実行）
    if (daysUntil === n.recruit_days_before) {
      const occ = await getOrCreateOccurrence(db, n.id, target);
      if (occ.status === 'cancelled') {
        console.log(`[n=${n.id}] occurrence cancelled, skip recruitment`);
      } else {
        await sendRecruitment(env, n, occ);
        if (n.quota_enabled) {
          await checkQuotaAndNotify(env, n);
        }
      }
    }

    // 未回答リマインド
    if (daysUntil >= 0 && daysUntil <= n.remind_start_days) {
      let proceed = true;
      if (daysUntil === 0) {
        // 当日は開始時刻前のみ（現挙動を踏襲。cron が開始時刻と同時の場合は実質 no-op）
        const now = getJSTNow();
        const [h, m] = n.start_time.split(':').map(Number);
        proceed = now.getHours() * 60 + now.getMinutes() < h * 60 + m;
      }
      if (proceed) {
        const occ = await getOrCreateOccurrence(db, n.id, target);
        if (occ.status === 'cancelled') {
          console.log(`[n=${n.id}] occurrence cancelled, skip unanswered reminder`);
        } else {
          await sendUnansweredReminder(env, n, occ, daysUntil);
        }
      }
    }

    // 未定者リマインド
    if (daysUntil === n.remind_undecided_days) {
      const occ = await getOrCreateOccurrence(db, n.id, target);
      if (occ.status === 'cancelled') {
        console.log(`[n=${n.id}] occurrence cancelled, skip undecided reminder`);
      } else {
        await sendUndecidedReminder(env, n, occ);
      }
    }
  }

  console.log('=== mainDailyCheck END ===');
}
