# CLAUDE.md

## 重要な制約

既存の勤怠管理ツール（Vercel 版）には変更を加えないこと。

対象（現在も本番稼働中・参照用に凍結）:
- `api/`（`api/discord.js`, `api/cron.js`）
- `lib/`（`lib/sheets.js`, `lib/discord.js`, `lib/date-utils.js`）
- `vercel.json`

これらはカットオーバー完了まで現状のまま維持する。新規開発は `src/`（Cloudflare Workers 版）側で行う。

## 本番 Choiemu チャンネルへの操作

本番 Choiemu サーバー／チャンネルに影響が及びうる操作は、実行前に必ずユーザーへ明示的に許可を取ること。

特に以下は本番へ到達しうるため要注意:
- `wrangler dev` / `wrangler dev --test-scheduled`（v4 は `.env` を自動読込し、本番 `DISCORD_BOT_TOKEN` / `DISCORD_CHANNEL_ID` が使われると本番チャンネルへ投稿する）
- 本番 Discord アプリのトークン・チャンネルID・Interaction Endpoint を伴う実行・設定変更
- 本番 Discord へのメッセージ送信・DM・スラッシュコマンド登録

ローカル検証は `.dev.vars`（テスト用アプリ＋ダミーサーバーの値のみ）が存在する前提で行う。本番値が混入する恐れがある場合は実行しない。
