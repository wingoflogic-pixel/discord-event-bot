# src/ をドメイン単位に再構成し、肥大ファイルを分割する

Status: **Proposed**（Phase 8 起票・実装着手は未承認）

`src/admin/index.ts`（833 行）・`src/db/groupings.ts`（618 行）・`src/cron/dailyCheck.ts`（482 行）の 3 ファイルに HTTP ルーティング・バリデーション・ドメインロジック・永続化が混在している。これを **ドメイン単位** で分割し、責務ごとに別ファイルに整理する。

## 文脈

- 単一ファイルが 500 行を超えると、差分レビュー・変更影響の追跡・テスト粒度の判断が難しくなる。Ponytail audit でも **「delete: admin/index.ts 833 / groupings.ts 618 / dailyCheck.ts 482 大型責務混在」** が指摘された。
- バリデーション（`toNotificationInput` / `candidateSlotsOf` / `num` / `parseLimit`）が admin/index.ts に散在しており、新規ハンドラ追加時に重複しやすい。
- `dailyCheck.ts` の cron handler が「募集・未回答リマインド・未定リマインド・ノルマ・締切告知」5 種を同一ファイルで分岐しており、ADR 0013（ペース配信）の境界が読みづらい。

## 決定

### 分割マップ

#### A1: `src/admin/index.ts` → `src/admin/handlers/`
```
src/admin/
├─ index.ts                 … ルーティング dispatcher のみ（~100 行）
├─ middleware/
│   ├─ auth.ts              … ADMIN_TOKEN 検証（C1 で抽出）
│   └─ json.ts              … リクエスト/レスポンス JSON ヘルパ
├─ validation/
│   ├─ notification.ts      … toNotificationInput
│   ├─ candidate.ts         … candidateSlotsOf
│   └─ shared.ts            … num / parseLimit
└─ handlers/
    ├─ notifications.ts
    ├─ segments.ts
    ├─ occurrences.ts
    ├─ groupings.ts
    ├─ assignments.ts
    └─ setup.ts             … /setup/* 系
```
想定削減: 単一ファイル 833 行 → 各 ~100-150 行に分散。重複バリデーション吸収で純 **-180 行程度**。

#### A2: `src/db/groupings.ts` → `src/db/groupings/`
```
src/db/groupings/
├─ index.ts                 … barrel
├─ persistence.ts           … D1 read/write のみ
├─ solver.ts                … グループ分けアルゴリズム（pair constraints 評価・shuffle 配置）
└─ constraints.ts           … pair constraint CRUD
```
想定削減: 単一 618 行 → 3 ファイル合計 ~530 行（純 **-88 行**、solver と persistence の境界整理で重複ヘルパ吸収）。

#### A3: `src/cron/dailyCheck.ts` → `src/cron/`
```
src/cron/
├─ index.ts                 … scheduled() エントリ + 走査ループ
├─ recruit.ts               … 募集投稿（sendRecurringRecruitment / sendCandidateRecruitment）
├─ remind.ts                … 未回答・未定リマインド
├─ quota.ts                 … ノルマ未達アラート
└─ deadline.ts              … 締切告知 + 締切後変更検知
```
想定削減: 単一 482 行 → 5 ファイル合計 ~380 行（純 **-102 行**、共通ヘルパ統合）。

### B1: バリデーション集約
- `src/admin/validation/` で `Notification` / `Occurrence` / `Segment` / `Grouping` の入力検証を一本化
- 各 handler は validated input を受け取る関数として記述（純粋関数化が進む）

### B2: 通知ライフサイクル集約
- 「`@deprecated mention_enabled` 同期」「`requires_response=0` の `assignment_enabled=0 / grouping_enabled=0` 強制」等のドメイン不変項を `src/domain/notificationLifecycle.ts` に集約
- handler / cron / interactions のいずれからも参照

### C1: HTTP middleware 抽出（A1 完了後に判定）
- `src/admin/middleware/{auth,json,cors}.ts` を抽出
- 削減は 30 行程度。A1 と同時着手はせず、A1 後にデルタを観測してから決める

### テスト戦略
- 各 handler ファイルに 1:1 で `tests/admin/handlers/<name>.test.ts` を新規作成
- groupings solver は **unit test**（pair constraints 評価・shuffle 出力の集合一致）
- cron は **integration test**（apply-migrations + handler 直接呼び出し）
- **+460 行のテスト追加** が見込まれる

## 根拠

- **認知負荷削減**: 1 ファイル 500 行以下が現代的な目安。1 関数 / 1 責務に近づける。
- **差分レビュー**: PR 単位で「どのドメインが変わったか」が明確になる。
- **テスト容易性**: handler / solver / persistence を別ファイル化することで、依存注入が要らないテストを書きやすくなる。
- **新規参加コスト**: 将来の AI コーディング含め、ファイル名 → 責務の即時マッピングが取れる。

## トレードオフ

- **ファイル数増**: src/ のファイル数が約 25 → 約 45 へ。初回ナビゲーション増だがエディタの "go to definition" で吸収可。
- **import 経路の修正**: 既存 import を全て書き換える必要。tsc が拾うので機械的だが量はそれなり。
- **テスト総行数 +460**: コード本体は -370 行（A1+A2+A3 純減）だが、テスト追加で **全体 +90〜+160 行**。
- **マイグレーション計画必須**: A1〜C1 を 1 つの PR で進めると差分が暴れる。各 A は別 PR に切る（`docs/refactor/ponytail-src-restructure-plan.md` で Phase 構成）。

## スキーマ影響

- なし（DB スキーマ / migrations / public API いずれも変更しない）

## 工数目安

- A1（admin 分割）: 3–5 人日
- A2（groupings 分割）: 2–3 人日
- A3（dailyCheck 分割）: 2–3 人日
- B1（validation 集約）: 1–2 人日
- B2（lifecycle 集約）: 1 人日
- C1（middleware 抽出）: 1 人日（A1 後判定）
- テスト追加: 3–5 人日

合計 **13–20 人日** 見込み。実装着手は本 ADR 承認後・別セッションで `docs/refactor/ponytail-src-restructure-plan.md` を Phase 構成として進める。
