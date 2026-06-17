# ChoiemuEventBot（汎用イベント出欠Bot）

Discord 上でイベントの出欠を募り、回答状況の集計・未回答リマインド・番号割り当てを行う Bot。
当初は特定コミュニティ「ちょいえむ」専用だったが、任意のコミュニティが自己ホストで使える汎用ツールへ拡張中。1 デプロイ = 1 サーバー（単一テナント）。言語は日本語固定、時刻は JST 固定。

## Language

**Event**:
出欠管理をまとめる最上位のグループ。実世界の催し／プログラム（例: 土曜定例）に対応し、複数の Notification を束ねる。Event 自体はスケジュールや出欠を持たず、整理上の単位にとどまる。
_Avoid_: 定例, program, イベント種別

**Segment（区分）**:
設定可能なメンバー区分（例: キャスト / スタッフ）。コミュニティが自由に定義する。Member が所属し、休止状態（アクティブ / 休止中）は**区分ごと**に持つ。@メンション用の Discord ロールを任意で紐付けられる。
_Avoid_: ロール（Discord のものと紛らわしい）, 役割, カテゴリ

**Notification（通知）**:
1 つの Event の配下にある独立したトラック。対象は 1 つの Segment。投稿チャンネル・スケジュール(RRULE)・募集/リマインド日数・ノルマ設定・番号割り当て設定を所有する。対象者＝その Segment のアクティブな Member。出欠タリーは Notification ごとに分かれる。「単なる配信設定」ではなく出欠管理の単位そのもの。
_Avoid_: track, 配信設定, チャンネル設定

**Occurrence（開催回）**:
ある Notification の 1 回ぶんの開催／募集。日付を持ち、Member の Response が紐づく単位。Notification の募集が走るタイミングで実体（行）として生成される。単発の Notification はちょうど 1 つ持つ。
_Avoid_: instance, session, 回

**Response（回答）**:
ある Occurrence に対して 1 人の Member が示した出欠の意思。値は 参加 / 不参加 / 未定 で固定。
_Avoid_: 出欠記録, attendance（集計結果と紛らわしいため）

**Member**:
出欠管理の対象としてマスタ登録された人物。1 人の Member は複数の Segment に所属しうる。リマインドやノルマ通知の宛先になる。Discord ユーザー一般（User）とは区別する。
_Avoid_: キャスト, cast, スタッフ

**User**:
Discord 上のユーザー一般。Member は「マスタ登録された User」である点で異なる。

**Recruitment（募集）**:
Occurrence の到来前に、Notification の投稿チャンネルへ出欠ボタン付きで投稿される告知。対象 Segment の Discord ロールへの @メンションを伴うことがある。

**Quota（ノルマ）**:
Notification ごとに任意で有効化できる参加間隔の督促。前回「参加」から設定日数を超えた、対象 Segment のアクティブ Member へ DM で参加を促す。既定は無効。
_Avoid_: 義務, obligation

**Assignment（番号割り当て）**:
Notification ごとに任意で有効化できる機能。ある Occurrence で「参加」と回答した Member へ、連番 1..N をランダムに重複なく割り当てる。管理者が手動実行し、既存の番号は維持して新規参加者にのみ空き番号を振る（安定割り当て）。割り当て結果は通知のチャンネルへ一覧で公開投稿する。番号は個室・座席等の外部割り当てに使う。既定は無効。
_Avoid_: 抽選, ロット, キャスト番号（汎用名は Assignment／割り当て番号）
