# 管理 UI を ui/index.html モノリスから React SPA へ移行する

Status: **Proposed**（Phase 8 起票・実装着手は未承認）

`ui/index.html` （2,435 行）に HTML / CSS / JavaScript・状態管理・API クライアントが全て同居しているモノリスを、Vite + React 18 + React Router で構築する **React SPA** に置き換える。既に `design-system/src/components/*.tsx`（29 ファイル）と `design-system/styles/{tokens,components,app-ui}.css` を持つにもかかわらず、それらは現状未参照（Phase 7 で deferred 注釈を付与済み）。SPA 化により設計資産を回収する。

## 文脈

- `ui/index.html` のフォーム状態管理が手書きで膨張しており、破棄ガード（`formDirty` + `confirmDialog`）や子ページ遷移（`as-page` modal + ハッシュ）が複雑化している。React の宣言的レンダリングで実装量が圧縮できる見込み。
- design-system Phase 1〜3 で **29 React コンポーネント** と shared CSS を整備済み（initial sync from claude.ai/design・projectId 07b48dd4…）。SPA 化はこれらを活用する自然な次ステップとして当初から計画されていた（[[design-system-buildout-plan]]）。
- 保守者（1 名）の認知容量・変更速度の観点で、ui/index.html のさらなる成長は望ましくない（次の機能追加で 3000 行を超える見込み）。
- 配布モデル（[ADR 0011](./0011-distribution-and-update-model.md)）への影響を抑えるため、Cloudflare Workers の ASSETS 配信で SPA をそのまま供給できる構成を前提とする。

## 決定

### スタック
- **Vite 5** + **React 18** + **React Router v6**
- 状態管理: React 本体（`useState` / `useReducer` / `useContext`）のみ。Redux 等は導入しない（YAGNI）
- UI: `design-system/src/components/*` を直接 import
- スタイル: `design-system/styles/{tokens,components,app-ui}.css` を Vite 経由でバンドル
- ドラッグ&ドロップ: 既存 `sortablejs` を流用（react ラッパは導入しない・Sortable をフックで包む）
- E2E: **Playwright**（vitest-pool-workers では実 DOM 観測不可のため別系統で）

### 配信
- `npm run build:ui` で `dist/admin/` に出力 → Workers ASSETS で `/admin/*` 配信
- `ui/index.html` は撤去（旧手書き UI 破棄）
- `sync-ui.mjs` も役割を失うため撤去

### ディレクトリ構成
```
ui/
├─ src/
│  ├─ App.tsx              … React Router + 認証ゲート
│  ├─ pages/
│  │   ├─ Gate.tsx         … ADMIN_TOKEN 入力
│  │   ├─ Picker.tsx       … サーバー選択
│  │   ├─ Notifications.tsx
│  │   ├─ NotificationForm.tsx … 旧 #nDialog
│  │   ├─ Segments.tsx
│  │   ├─ Occurrences.tsx
│  │   ├─ Grouping.tsx
│  │   ├─ Assignments.tsx
│  │   └─ Setup.tsx        … `/setup/*` 系
│  ├─ api/                 … fetch ラッパ（旧 api()）
│  └─ main.tsx
├─ index.html              … Vite エントリ
└─ vite.config.ts
```

## 根拠

- **資産回収**: design-system 29 components を deferred 状態から「現役」に昇格させる。設計コスト（initial sync で投じたもの）を実行に乗せる。
- **状態管理の宣言化**: 破棄ガード・モーダル遷移・楽観更新を React の標準パターンに寄せ、テストしやすくする（React Testing Library + Playwright）。
- **保守性**: ui/index.html の単一ファイル成長を止める。コンポーネント単位の差分レビューが可能になる。
- **配布影響最小**: Workers ASSETS 配信のため、利用者（fork ユーザー）の運用手順は不変。Bot 本体（Workers）の挙動も変わらない。

## トレードオフ

- **依存追加**: React + React-DOM + React Router + Vite + Playwright（dev）= **+11MB gzip 程度**（dev のみ・本番 bundle は React + Router で ~50KB gzip）
- **build 時間**: 現状 `npm run build:sortable` のみ → Vite build が加わり初回数十秒
- **行数**: `ui/index.html` -2,435 / `ui/src/**` 新規 +2,700〜3,050（純 +270〜620 行）
- **学習コスト**: 保守者は React 慣れ済みなので限定的
- **E2E 環境**: Playwright + ローカル wrangler dev の起動を回す必要

## スキーマ影響

- なし

## 工数目安

- Sprint 1（5–7 人日）: Vite setup + App shell + Gate / Picker / 認証層
- Sprint 2（10–14 人日）: Notifications + Segments + NotificationForm（最大ページ）
- Sprint 3（10–14 人日）: Occurrences + Grouping + Assignments + Setup + Playwright E2E

合計 **25–35 人日** 見込み。実装着手は本 ADR 承認後・別セッションで `docs/refactor/ponytail-spa-plan.md` を Phase 構成として進める。
