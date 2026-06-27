// ponytail: deferred — see docs/dev/adr/0019-ui-architecture-react-spa.md
// 本コンポーネントは Phase III-SPA (UI 全面 React 化) で初使用予定。
// 現在 ui/index.html は手書き HTML/CSS で完結しており、未参照。
import * as React from 'react';
import { cn } from '../cn';

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {}

/**
 * 空状態プレースホルダ。`.empty`（破線枠・中央寄せ）でレンダーする。
 * メッセージ等は children として渡す。
 */
export function EmptyState({ className, children, ...rest }: EmptyStateProps) {
  return (
    <div className={cn('empty', className)} {...rest}>
      {children}
    </div>
  );
}
