import * as React from 'react';
import { cn } from '../cn';

export interface SummaryBannerProps extends React.HTMLAttributes<HTMLDivElement> {}

/**
 * アクセント色の要約ストリップ。`.summary` でスタイルされるため <div> をレンダーする。
 * children に要約テキストやアイコンを渡す。
 */
export function SummaryBanner({ className, children, ...rest }: SummaryBannerProps) {
  return (
    <div className={cn('summary', className)} {...rest}>
      {children}
    </div>
  );
}
