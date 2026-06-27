# Ponytail Phase III-SPA: UI 全面 React 化 実行計画

> 根拠: [ADR 0019](../dev/adr/0019-ui-architecture-react-spa.md) — Proposed
> 状態: **未承認**（本ファイルは Phase 8 起票のみ。実装は別セッションで着手判断）

`ui/index.html`（2,435 行モノリス）を `ui/src/**`（Vite + React 18 + React Router）に置き換え、`design-system/src/components/*.tsx`（29 components・現在 deferred）を現役化する。

## Phase 構成（着手時に Sprint 単位で実行）

### Sprint 1: 基盤（5–7 人日）
- S1-1: Vite + React Router + design-system import の足場を組む（`ui/vite.config.ts` + `ui/index.html` + `ui/src/main.tsx`）
- S1-2: `package.json` に `dev:ui:react` / `build:ui` を追加。Workers ASSETS の配信パスを `/admin/*` に変更
- S1-3: `App.tsx` + `<AuthGate>` + `<Picker>`（既存ロジックを React に翻訳・state は React Context）
- S1-4: Playwright のセットアップ（`tests-e2e/`）。ADMIN_TOKEN 入力 → ピッカー描画の E2E 1 本

### Sprint 2: 通知 / 区分（10–14 人日）
- S2-1: `<Notifications>` 一覧 + ページ遷移
- S2-2: `<NotificationForm>`（最大ページ・複合 form・破棄ガード）
  - `useReducer` で formState（rrule / oneoff / requires_response / deadlines / mention_mode）
  - 破棄ガードは React Router の `useBlocker` で実装
- S2-3: `<Segments>` 一覧 + 作成 / 削除 / メンバー管理
- S2-4: E2E: 通知作成 → 保存 → 編集 → 削除

### Sprint 3: 開催回 / グループ / 番号 / setup + 仕上げ（10–14 人日）
- S3-1: `<Occurrences>` 一覧 + 候補確定 / 解除
- S3-2: `<Grouping>` ボード（sortablejs を `useEffect` で wire）
- S3-3: `<Assignments>` 2 ボタン
- S3-4: `<Setup>` / Discord 接続診断 / コマンド登録
- S3-5: 旧 `ui/index.html` / `design-system/sync-ui.mjs` 撤去
- S3-6: 受け入れ E2E（全ページ巡回） + プレビューデプロイ（staging）

## 検証

- ローカル: `npm test` + Playwright `npm run e2e`
- staging: main push → Workers Builds auto-deploy（既存パイプライン）
- 本番: 本 plan は本番 deploy:cli を含む。実施前にユーザー許可必須

## ロールバック

- Sprint 単位で main にマージする想定。各 Sprint 完了後に `git tag v<ver>-spa-srpN` を打ち、退避可能にしておく
- 全 Sprint 完了までは旧 `ui/index.html` を残し、`/admin/*` で SPA、`/admin-legacy/*` で旧 UI を並走（最終 Sprint で旧版を撤去）

## 中止判断

- Sprint 1 で Vite + Workers ASSETS の組合せに想定外コストが出た場合は中止し、本 plan を Rejected に書き換える
- Sprint 2 完了時点で 14 人日を大幅超過していたら、Sprint 3 着手前に scope 見直し
