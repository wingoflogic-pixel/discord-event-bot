// ponytail: deferred — see docs/dev/adr/0019-ui-architecture-react-spa.md
// 本コンポーネントは Phase III-SPA (UI 全面 React 化) で初使用予定。
// 現在 ui/index.html は手書き HTML/CSS で完結しており、未参照。
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
