// ponytail: deferred — see docs/dev/adr/0019-ui-architecture-react-spa.md
// 本コンポーネントは Phase III-SPA (UI 全面 React 化) で初使用予定。
// 現在 ui/index.html は手書き HTML/CSS で完結しており、未参照。
import * as React from 'react';
import { cn } from '../cn';

export type SubTabsProps = React.HTMLAttributes<HTMLDivElement>;

/** 設定ページ内の縦サブタブの入れ物（role="tablist"）。中に SubTab を並べる。 */
export const SubTabs = React.forwardRef<HTMLDivElement, SubTabsProps>(function SubTabs(
  { className, children, ...rest },
  ref,
) {
  return (
    <div ref={ref} role="tablist" aria-orientation="vertical" className={cn('subtabs', className)} {...rest}>
      {children}
    </div>
  );
});

export interface SubTabProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** 選択中なら `.active`（左の accent バー＋ハイライト）。 */
  active?: boolean;
}

/** 縦サブタブの1項目。onClick でペインを切り替える。 */
export const SubTab = React.forwardRef<HTMLButtonElement, SubTabProps>(function SubTab(
  { active = false, className, children, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      role="tab"
      aria-selected={active}
      className={cn('subtab', active && 'active', className)}
      {...rest}
    >
      {children}
    </button>
  );
});
