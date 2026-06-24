# /design-sync 引き継ぎメモ（初回同期・ターミナルCLIで実行すること）

> **全体計画（最終ゴール・Phase 1–5・Discord 参考の再設計フロー）は `../design-system/PLAN.md` を必ず参照。**
> このメモは「今すぐの同期」に絞った補足。

このリポジトリの `/design-sync` は **ターミナルCLIの `claude` セッションで実行**してください。
デスクトップアプリは OAuth 系コマンド（`/design-login`・`/login`）をブロックするため、同期を完了できません。

## 同期対象（重要）
- **同期するのは `design-system/` サブパッケージのみ**。リポジトリ root は Cloudflare Worker の
  Discord Bot（`discord-event-bot`）であり、**同期対象ではない**。
- 形（shape）: **package**（Storybook なし）。
- パッケージ: `design-system/`（npm パッケージ `@eventbot/design-system`）。
  - ビルド: `cd design-system && npm install && npm run build` → `dist/index.js`（ESM）＋ `dist/*.d.ts`。
  - スタイル（styles.css 相当）: `design-system/styles/index.css`（`tokens.css` + `components.css` を @import）。
  - 公開グローバル名の候補: `EventBotDS`。
  - エントリ barrel: `design-system/src/index.ts`（31 export）。

## 中身（現状＝Phase 1–2 完了）
- 28 コンポーネント / 31 export（cn 含む）。Form / Display / Overlay(Modal) / Surface / Layout / Nav / Topbar / App固有。
- 共有CSSコア `design-system/styles/` が**唯一の真実**。React コンポーネントは同じ CSS class を出力する。
- これは「現状の見た目」を忠実にコード化したライブラリ。**この後 claude.ai/design 上でデザインエージェントが
  Discord（https://discord.com/channels/@me）を参考にスタイリッシュへ再設計**する想定（だから現状の見た目で同期してよい）。

## 留意
- 設計言語は「CSS クラス + `var(--*)` トークン」。新しい色・余白は直書きせず token を使う。
- 既存の静的UI（`ui/index.html`）は将来この React 層へ移行予定（Phase 5）。今回の同期対象ではない。
