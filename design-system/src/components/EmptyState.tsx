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
