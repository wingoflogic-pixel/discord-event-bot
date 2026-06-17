# セットアップ手順（discord-event-bot / Cloudflare Workers + D1）

自己ホスト型の構築手順。**登録が必要なサービスは Discord と Cloudflare の 2 つだけ**・無料枠で動作します。
データモデルは Event ＞ Notification → Segment ＞ Occurrence（用語は [`CONTEXT.md`](../CONTEXT.md)、設計は [`docs/adr/`](./adr) と [`docs/IMPLEMENTATION-CONTRACT.md`](./IMPLEMENTATION-CONTRACT.md)）。言語=日本語固定 / 時刻=JST固定 / 単一テナント。

## 0. 前提
- Node.js 18 以上
- Cloudflare アカウント（無料で可）
- Discord アプリ（Developer Portal）— Bot Token / Application ID / Public Key

## 1. 取得・インストール
```bash
git clone <this-repo> discord-event-bot
cd discord-event-bot
npm install
npm install -g wrangler        # CLI（未導入の場合）
wrangler login                 # ブラウザで Cloudflare にログイン
```

## 2. D1 データベース作成
```bash
wrangler d1 create choiemu-event-bot-db    # 名前は任意。変える場合は wrangler.toml と package.json の db:migrate スクリプトも合わせる
```
出力された `database_id` を **`wrangler.toml` の `[[d1_databases]]` の `database_id`** に貼り付ける。

## 3. スキーマ適用（マイグレーション）
```bash
npm run db:migrate:remote      # 本番 D1
npm run db:migrate:local       # ローカル開発用 D1（任意）
```
> `migrations/0002_generic_redesign.sql` が現行スキーマ（events / segments / members / segment_members / notifications / occurrences / responses / assignments）。`0001` は旧スキーマで、`0002` が破棄して作り直す。

## 4. シークレット設定
```bash
wrangler secret put DISCORD_PUBLIC_KEY
wrangler secret put DISCORD_APPLICATION_ID
wrangler secret put DISCORD_BOT_TOKEN
wrangler secret put ADMIN_TOKEN        # 管理UI用。例: openssl rand -hex 32 で生成
```
> ⚠️ 旧版にあった `DISCORD_CHANNEL_ID` は**廃止**。投稿チャンネルは Notification ごとに管理 UI で設定する。

## 5. スラッシュコマンド登録
`.env` に `DISCORD_BOT_TOKEN` と `DISCORD_APPLICATION_ID`（テスト時は `DISCORD_GUILD_ID` も）を入れて:
```bash
npm run register-commands
```
登録されるコマンド: `/recruit` `/assign`（ともに `notification_id` 指定）/ `/pause` `/resume`（`user` ＋任意 `segment_id`）/ `/members`（任意 `segment_id`）。

## 6. デプロイ
```bash
npm run deploy
```
出力される URL（例 `https://discord-event-bot.<account>.workers.dev`）を控える。

## 7. Discord 側の設定
- Developer Portal → アプリ → **Interactions Endpoint URL** に `https://<worker-url>/interactions` を設定（保存時に Discord が PING 検証）。
- Bot をサーバーに招待（**`bot` ＋ `applications.commands` の両スコープ**。メッセージ送信・DM 権限）。

## 8. 管理 UI で初期設定
ブラウザで `https://<worker-url>/` を開き `ADMIN_TOKEN` を入力。次の順で作る:
1. **区分**タブ: Segment を作成（例 キャスト / スタッフ）。@メンションする Discord ロールID を任意で紐付け。
2. **イベント**タブ: Event を作成（束ねるグループ。例「土曜定例」）。
3. **通知**タブ: Notification を作成。所属 Event・対象 Segment・投稿チャンネルID・スケジュール（週次/隔週/毎月第N曜→RRULE、または単発日付）・開始時刻・募集/リマインド日数・ノルマ/番号割り当て/メンションのON/OFF を設定。
   - 隔週を使う場合は「基準日（anchor_date）」に**起点となる開催日**を入れると開催週が安定する。
4. **メンバー**タブ: メンバーは募集ボタンへの回答で自動登録され、区分に自動所属する。手動追加は区分タブから。
5. **記録**タブ: 出欠（responses）と、開催回ごとの番号割り当て（assignments）を閲覧。番号割り当ての実行もここ、または Discord の `/assign` から。

## 9. ローカル開発
> ⚠️ **重要（本番事故防止）**: `wrangler dev` はローカルで `.env` も自動読込する（wrangler v4 挙動）。
> 本番 `.env` が同居していると本番チャンネルへ投稿してしまうため、必ず `.dev.vars` を作成し、
> **テスト用アプリ＋ダミーサーバーの値のみ**を入れること（本番値は厳禁）。`.dev.vars` は `.env` より優先される。
```bash
cp .dev.vars.example .dev.vars   # 実値を設定（.dev.vars は gitignore 済み）
npm run db:migrate:local
npm run dev                      # wrangler dev（ローカル D1）
```
Discord インタラクションのローカル検証は cloudflared トンネル経由で、**本番とは別のテスト用 Discord アプリ**の Interaction Endpoint に向ける:
```bash
cloudflared tunnel --url http://localhost:8787
```

## 10. テスト
```bash
npm test          # vitest（D1 / RRULE を含む）
npm run typecheck # 型チェック
```

---

## 補足
- **cron**: `wrangler.toml` の `crons = ["0 12 * * *"]` は **UTC**（JST 21:00 相当）。日次 tick で全 active Notification を評価し、各通知の `recruit_days_before` / `remind_start_days` / `remind_undecided_days` に従って募集・リマインドを出す。通知ごとの時刻は `start_time`。
- **データ移行（旧 Google Sheets から）**: `scripts/migrate-from-sheets.mjs` は**旧スキーマ向けで現行モデルには未対応**（先頭の注意書き参照）。新モデルへ移す場合は作り直しが必要。
- **無料枠**: Workers 10万req/日。DM はチャンネル ID をキャッシュしてサブリクエストを抑制。
- 旧 Vercel 版（`api/` `lib/` `vercel.json`）はカットオーバーまで凍結・不変（[`CLAUDE.md`](../CLAUDE.md)）。
