// ponytail: deferred — see docs/dev/adr/0019-ui-architecture-react-spa.md
// 本コンポーネントは Phase III-SPA (UI 全面 React 化) で初使用予定。
// 現在 ui/index.html は手書き HTML/CSS で完結しており、未参照。
import * as React from 'react';
import { cn } from '../cn';

export interface ShellProps extends React.HTMLAttributes<HTMLDivElement> {}

/** アプリの外枠。`.shell`（サイドバー＋メインの 2 カラムグリッド）。 */
export function Shell({ className, children, ...rest }: ShellProps) {
  return (
    <div className={cn('shell', className)} {...rest}>
      {children}
    </div>
  );
}

export interface MainProps extends React.HTMLAttributes<HTMLElement> {}

/** メイン領域。`main` セレクタでスタイルされるため素の <main> を出す（class なし）。 */
export function Main({ className, children, ...rest }: MainProps) {
  return (
    <main className={cn(className) || undefined} {...rest}>
      {children}
    </main>
  );
}

export interface RowProps extends React.HTMLAttributes<HTMLDivElement> {}

/** 2 カラムグリッド行。`.row`（640px 以下で 1 カラムへ折返し）。 */
export function Row({ className, children, ...rest }: RowProps) {
  return (
    <div className={cn('row', className)} {...rest}>
      {children}
    </div>
  );
}

export interface Row3Props extends React.HTMLAttributes<HTMLDivElement> {}

/** 3 カラムグリッド行。`.row3`（640px 以下で 1 カラムへ折返し）。 */
export function Row3({ className, children, ...rest }: Row3Props) {
  return (
    <div className={cn('row3', className)} {...rest}>
      {children}
    </div>
  );
}

export interface GridCardsProps extends React.HTMLAttributes<HTMLDivElement> {}

/** カードの自動折返しグリッド。`.grid-cards`（最小 230px の auto-fit）。 */
export function GridCards({ className, children, ...rest }: GridCardsProps) {
  return (
    <div className={cn('grid-cards', className)} {...rest}>
      {children}
    </div>
  );
}

export interface ActionsProps extends React.HTMLAttributes<HTMLDivElement> {}

/** ボタン等を横並びにする操作群。`.actions`（折返し可・縦中央揃え）。 */
export function Actions({ className, children, ...rest }: ActionsProps) {
  return (
    <div className={cn('actions', className)} {...rest}>
      {children}
    </div>
  );
}
