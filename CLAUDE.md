# CLAUDE.md

## 重要な制約

既存の勤怠管理ツール（Vercel 版）には変更を加えないこと。

対象（現在も本番稼働中・参照用に凍結）:
- `api/`（`api/discord.js`, `api/cron.js`）
- `lib/`（`lib/sheets.js`, `lib/discord.js`, `lib/date-utils.js`）
- `vercel.json`

これらはカットオーバー完了まで現状のまま維持する。新規開発は `src/`（Cloudflare Workers 版）側で行う。
