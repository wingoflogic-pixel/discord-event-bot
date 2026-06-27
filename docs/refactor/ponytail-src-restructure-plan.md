# Ponytail Phase III-A: src/ ドメイン分割 実行計画

> 根拠: [ADR 0020](../dev/adr/0020-src-restructure-by-domain.md) — Proposed
> 状態: **未承認**（本ファイルは Phase 8 起票のみ。実装は別セッションで着手判断）

`src/admin/index.ts` (833) / `src/db/groupings.ts` (618) / `src/cron/dailyCheck.ts` (482) をドメイン単位で分割し、バリデーション・ドメインロジックを集約する。

## Phase 構成（着手時に順次実行・各 Phase ＝ 1 PR）

### Phase A1: admin 分割（3–5 人日）
1. `src/admin/validation/{notification,candidate,shared}.ts` を切り出し（既存関数の純粋移動）
2. `src/admin/handlers/{notifications,segments,occurrences,groupings,assignments,setup}.ts` に分割。`index.ts` は dispatcher のみ
3. `tests/admin/handlers/*.test.ts` 新規（**+250 行**）
4. typecheck + npm test 全 green
- 期待削減: **本体 -180 行 / テスト +250 行 / 純 +70 行**

### Phase A2: groupings 分割（2–3 人日）
1. `src/db/groupings/{persistence,solver,constraints}.ts` に分割、`index.ts` は barrel
2. solver の純粋関数化（D1 依存を inject 化）
3. `tests/db/groupings/solver.test.ts` 新規（**+120 行**）
- 期待削減: **本体 -88 行 / テスト +120 行 / 純 +32 行**

### Phase A3: dailyCheck 分割（2–3 人日）
1. `src/cron/{recruit,remind,quota,deadline}.ts` に分割、`index.ts` は scheduled handler + 走査ループのみ
2. `tests/cron/{recruit,remind,quota,deadline}.test.ts` 新規（**+90 行**）
- 期待削減: **本体 -102 行 / テスト +90 行 / 純 -12 行**

### Phase B1: バリデーション集約（1–2 人日・A1 後）
- 散在する `toNotificationInput` / `candidateSlotsOf` / `num` / `parseLimit` を `src/admin/validation/` に統合
- 既に A1 で大半は移動済み。追加で `Segment` / `Occurrence` / `Grouping` 入力を集約
- 期待削減: **±0**（純構造改善）

### Phase B2: 通知ライフサイクル集約（1 人日）
- `src/domain/notificationLifecycle.ts` を新設し、以下の不変項を集約:
  - `@deprecated mention_enabled` ↔ `mention_mode` の同期
  - `requires_response=0`（announce-only）→ `assignment_enabled=0` / `grouping_enabled=0` 強制
  - `oneoff` → `requires_response=1` 強制
- handler / cron / interactions / DB layer から参照
- 期待削減: **±0**（純構造改善・将来の不変項追加コスト削減）

### Phase C1: HTTP middleware 抽出（1 人日・A1 後判定）
- `src/admin/middleware/{auth,json}.ts` 抽出
- A1 完了時点で重複量を再評価し、メリットが薄ければスキップ
- 期待削減: **本体 -30 行**

## 検証フロー（各 Phase 共通）

1. `npm run typecheck`
2. `npm test`（テスト数が前 Phase と同じか増えていること）
3. `/ponytail-review` で差分レビュー
4. main マージ → ②staging に auto-deploy（プロダクション動作変更なしの構造変更だが、staging で smoke）
5. 全 Phase 完了後にまとめて 1 回 `npm run deploy:cli`（ユーザー許可必須）

## 順序の根拠

- **A1 を最初に**: handler 分割が一番大きい価値変化（差分レビュー粒度が一気に上がる）
- **A2 → A3 はどちらが先でも可**: 互いに独立
- **B1 / B2 は A* 後**: 分割後の方が集約箇所が見えやすい
- **C1 は A1 デルタ観測後**: middleware の本当の重複量は A1 完了後に判定

## 中止判断

- A1 で typecheck エラーが想定外に多発（>50 件）したら一旦 stash → ADR 0020 を Rejected に書き換える
- B1 / B2 / C1 はメリットが薄ければ個別スキップ可（残りの Phase に影響しない）

## 累計見込み

- 本体: **-400 行**
- テスト: **+460 行**
- 純: **+60 行 / 機能 ±0 / ファイル数 +20**
- 公開 API / Discord 挙動 / DB スキーマ: **すべて変更なし**
