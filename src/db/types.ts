/**
 * D1 行・ドメイン型（汎用リデザイン: Event ＞ Notification → Segment ＞ Occurrence）。
 * 用語の定義は CONTEXT.md、スキーマは migrations/0002_generic_redesign.sql を参照。
 */

/** events: 出欠管理を束ねる最上位グループ */
export interface Event {
  id: number;
  name: string;
  created_at: string;
}

/** segments: 設定可能なメンバー区分（キャスト/スタッフ等） */
export interface Segment {
  id: number;
  name: string;
  /** @メンション用 Discord ロールID / '@everyone' / null */
  mention_role_id: string | null;
  created_at: string;
}

/** members: グローバルな人物マスタ。休止状態は SegmentMembership 側に持つ */
export interface Member {
  user_id: string;
  user_name: string | null;
  display_name: string | null;
  dm_channel_id: string | null;
  created_at: string;
}

/** segment_members: 所属（Member × Segment）＋区分ごとの休止状態 */
export interface SegmentMembership {
  segment_id: number;
  user_id: string;
  /** '' = アクティブ / '休止中' */
  status: string;
  joined_at: string;
}

/** Member に所属ステータスを合成した型（区分メンバー一覧用） */
export interface SegmentMember extends Member {
  /** その区分での所属ステータス。'' = アクティブ / '休止中' */
  status: string;
}

export type NotificationType = 'recurring' | 'oneoff';

/** notifications: Event 配下の独立トラック */
export interface Notification {
  id: number;
  event_id: number;
  segment_id: number;
  name: string;
  channel_id: string;
  type: NotificationType;
  /** recurring 用 RFC5545 RRULE 文字列 */
  rrule: string | null;
  /** oneoff 用 'YYYY/MM/DD' */
  one_off_date: string | null;
  /** recurring の系列基準日 'YYYY/MM/DD'（主に隔週のパリティ決定用。null可） */
  anchor_date: string | null;
  /** 'HH:MM'（JST） */
  start_time: string;
  recruit_days_before: number;
  remind_start_days: number;
  remind_undecided_days: number;
  /** 0/1 */
  quota_enabled: number;
  quota_interval_days: number | null;
  /** 0/1 */
  assignment_enabled: number;
  /** 0/1 対象 Segment の Discord ロールへ @メンションするか */
  mention_enabled: number;
  /** 0/1 */
  active: number;
  created_at: string;
}

export type OccurrenceStatus = 'scheduled' | 'cancelled';

/** occurrences: Notification の 1 開催回 */
export interface Occurrence {
  id: number;
  notification_id: number;
  /** 'YYYY/MM/DD'（JST・ゼロ埋めで辞書順=時系列順） */
  occurrence_date: string;
  status: OccurrenceStatus;
  created_at: string;
}

/** responses: 開催回への 1 Member の回答（旧 event_log） */
export interface Response {
  occurrence_id: number;
  user_id: string;
  user_name: string | null;
  /** 参加 / 不参加 / 未定 */
  status: string;
  updated_at: string;
}

/** assignments: 開催回ごとのユニークな割り当て番号 */
export interface Assignment {
  occurrence_id: number;
  user_id: string;
  number: number;
  assigned_at: string;
}

/** 出欠状況の集計結果（表示名の配列） */
export type EventStatusBuckets = {
  参加: string[];
  不参加: string[];
  未定: string[];
  未回答: string[];
};

/** ノルマ未達メンバー */
export interface QuotaAlert extends Member {
  daysSinceLast: number;
  lastDateStr: string;
}

/** 表示名を解決（display_name > user_name > user_id） */
export function resolveDisplayName(m: Member): string {
  return m.display_name || m.user_name || m.user_id;
}
