# 管理UI デザインシステム刷新 — 全体計画と引き継ぎ

> このファイルは Claude Code（CLI セッション）への引き継ぎ書。会話で合意した計画の全体像・
> 現在地・次にやることを1枚にまとめたもの。まず最初にこれと `../.design-sync/NOTES.md` を読むこと。

## 最終ゴール

`discord-event-bot` の **管理UI（`ui/index.html`）をスタイリッシュに刷新**する。
手段は **claude.ai/design のデザインエージェント**。**Discord アプリ（https://discord.com/channels/@me）の
UI を視覚リファレンス**にして、自分たちの実コンポーネントで管理UIを再設計し、その成果を実装へ反映する。

ポイント: デザインシステムをゼロから作るのではなく、**既存の管理UIの設計言語を取り出して正式化し
（Phase 1–2 完了済み）、それを claude.ai/design 上で Discord 風に再スキンする**という流れ。
自分たちのコンポーネントが土台、Discord は「目指す見た目」。

## 全体ループ（目指す姿）

```
リポジトリの React コンポーネント = デザインシステム本体（真実の源）
   │  (1) /design-sync で同期
   ▼
claude.ai/design  ──(2) デザインエージェントが Discord を参考にスタイリッシュ再設計──┐
   │                                                                              │
   └──────────────── (3) 設計を取り込み、管理UIの実装へ反映 ◀────────────────────────┘
```

## 技術方針（確定事項）

- **共有CSSコア** = `design-system/styles/{tokens,components,index}.css`。`ui/index.html` の
  インライン `<style>` から**値を一切変えずに**抽出した、見た目の**単一の真実**。
- **コンポーネント層 = React**（「がっつり」採用＝React を UI の真実の源にする方針）。
  esbuild で `dist/` を生成、`window.EventBotDS.*` 公開、`.d.ts` 同梱。
- **スコープ** = 管理UI（`ui/index.html`）＋ 配布ガイド `setup.html`。**Storybook なし**。
- **配信モデル** = 管理UI は最終的に**クライアントレンダリングの React SPA** を
  Cloudflare Worker の `ASSETS` で静的配信（Bot ランタイム＝`src/`・Discord連携には無影響）。
- **同期・設計の対象は `design-system/` サブパッケージのみ**。リポジトリ root は
  Cloudflare Worker（`discord-event-bot`）であり、**対象外**。

## フェーズと現在地

| # | フェーズ | 状態 | 担当 |
|---|---|---|---|
| 1 | 共有CSSコア抽出 | ✅ 完了（352宣言を完全一致で検証） | CC |
| 2 | React 部品ライブラリ＋ビルド | ✅ 完了（28コンポーネント/31 export・型0エラー・ビルド成功・import検証） | CC |
| 3 | `/design-sync` で claude.ai/design へ同期 | ⏳ **いまここ**（CLI で実行。デスクトップアプリは認証不可のため） | CC（CLI）|
| 4 | デザインエージェントが Discord 参考に再設計 | ⏳ Phase 3 後 | **ユーザー**（claude.ai/design 上）|
| 5 | 管理UI＋setup を React SPA 化・配信統合 | ⏳ Phase 4 の成果待ち | CC（本番デプロイのみ要許可）|

## いま CLI でやること（Phase 3）

1. `/login`（サブスク付きアカウント）で design アクセスを取得。
2. `/design-sync` を実行 → `design-system/`（package 形）を claude.ai/design に**新規プロジェクトとして同期**。
   - `../.design-sync/NOTES.md` の指示に従う（**`design-system/` だけ・現状の見た目で同期**）。
   - 完了すると `https://claude.ai/design/p/……` の URL が出る。

## Phase 3 の後（参考。CLI/Claude が今すぐやる工程ではない）

- **Phase 4（ユーザー / claude.ai/design 上）**: 同期された実コンポーネントを使い、Discord の見た目
  （左サイドバー、ダークパネル、accent = blurple `#5865f2`、角丸、余白感、ホバー等）を参考に、
  デザインエージェントへ「Discord 風にスタイリッシュな管理UIを」と指示して設計を作る。
  → ここで生まれる新スタイルが、共有CSSコア／コンポーネントの**見た目更新**として戻ってくる。
- **Phase 5（CC が実装）**: Phase 4 の設計を
  (a) `design-system/` のトークン/コンポーネントへ反映し、
  (b) `ui/index.html`（および `setup.html`）を React SPA 化して移植。
  既存の管理ロジック（`/api/admin` 連携・フォーム/表/モーダル）も移す。
  最後に `wrangler deploy` 前のUIビルドを配信フローへ配線（**本番到達＝要明示許可**）。

## 守るべき制約（このリポジトリ固有）

- **本番 Choiemu に到達しうる操作（`wrangler dev` / `npm run deploy:cli` 等）は実行前に必ずユーザー許可**。
- 配信は2リポジトリ構成（非公開 `event-master-bot` ＋ 公開 fork `discord-event-bot`）。
  `design-system/` は製品コードなので公開 fork 側に含めてよい。
- `main` 直コミット禁止＝ブランチを切る。`migrations/` の既存ファイルは編集禁止（新連番のみ追加）。
- 詳細ルールは `.claude/rules/dev-and-release.md` と `CLAUDE.md`。

## 成果物の現状（ディスク上に存在）

- `design-system/`：共有CSSコア（`styles/`）＋ React 28コンポーネント（`src/`）＋ ビルド設定。
  `cd design-system && npm install && npm run build` で `dist/` 生成。詳細は `design-system/README.md`。
- 本番・root・`ui/index.html`・`setup.html` は**未変更・未コミット**。
