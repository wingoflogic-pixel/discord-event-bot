/**
 * 日付計算ユーティリティ（タイムゾーン: Asia/Tokyo / JST）
 *
 * 重要: Cloudflare Workers のランタイムは常に UTC で動作するため、
 * getJSTNow() が返す Date の getFullYear/getMonth/getDate/getHours/getDay
 * （ローカルゲッター）は JST のカレンダー値になる。旧 lib/date-utils.js と同じ挙動。
 *
 * テスト容易性のため getTargetDate / getDaysUntilEvent は now を引数で受け取れる。
 */

/** 'YYYY/MM/DD' 形式にフォーマット */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}/${month}/${day}`;
}

/** 現在の JST 時刻（UTC ランタイム前提の計算式。旧 getJSTNow を踏襲） */
export function getJSTNow(): Date {
  const now = new Date();
  const jstOffset = 9 * 60 * 60 * 1000; // JST = UTC+9
  return new Date(now.getTime() + now.getTimezoneOffset() * 60 * 1000 + jstOffset);
}

const DAY_MAP: Record<string, number> = {
  SUNDAY: 0,
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
  SATURDAY: 6,
};

/** 次のイベント開催日を計算（旧 getTargetDate） */
export function getTargetDate(
  config: { eventDayOfWeek: string; eventStartTime: string },
  now: Date = getJSTNow(),
): Date {
  const targetDay = DAY_MAP[config.eventDayOfWeek];
  const currentDay = now.getDay();

  const [hours, minutes] = config.eventStartTime.split(':').map(Number);
  const currentTimeInMinutes = now.getHours() * 60 + now.getMinutes();
  const eventTimeInMinutes = hours * 60 + minutes;

  let daysToAdd: number;
  if (currentDay === targetDay) {
    // 開催曜日当日: 開始時刻前なら今日、以降なら来週
    daysToAdd = currentTimeInMinutes < eventTimeInMinutes ? 0 : 7;
  } else {
    daysToAdd = (targetDay - currentDay + 7) % 7;
    if (daysToAdd === 0) daysToAdd = 7; // 安全策（論理上ここには来ない）
  }

  const targetDate = new Date(now);
  targetDate.setDate(now.getDate() + daysToAdd);
  targetDate.setHours(hours, minutes, 0, 0);
  return targetDate;
}

/** イベントまでの日数（旧 getDaysUntilEvent）。日付のみで比較 */
export function getDaysUntilEvent(targetDate: Date, now: Date = getJSTNow()): number {
  const target = new Date(targetDate);
  target.setHours(0, 0, 0, 0);
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  return Math.floor((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * 'YYYY/MM/DD' を JST 壁時計の Date として解釈する。
 *
 * new Date(y, m-1, d) はローカルタイムゾーン基準で Date を構築する。
 * UTC ランタイム前提では getJSTNow() のローカルゲッターが JST 値を返すのと整合し、
 * ここで作る Date のローカルゲッター（getFullYear 等）も JST カレンダー値になる。
 * 不正形式の場合は Invalid Date を返す。
 */
export function parseJSTDate(s: string): Date {
  const [year, month, day] = s.split('/').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * 'YYYY/MM/DD' と今日(JST)との日数差。
 * 内部で parseJSTDate により JST 壁時計の Date に変換し、getDaysUntilEvent で比較する。
 */
export function getDaysUntil(dateStr: string, now: Date = getJSTNow()): number {
  return getDaysUntilEvent(parseJSTDate(dateStr), now);
}
