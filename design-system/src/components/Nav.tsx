// ponytail: deferred — see docs/dev/adr/0019-ui-architecture-react-spa.md
// 本コンポーネントは Phase III-SPA (UI 全面 React 化) で初使用予定。
// 現在 ui/index.html は手書き HTML/CSS で完結しており、未参照。
import * as React from 'react';
import { cn } from '../cn';

export interface SideNavProps extends React.HTMLAttributes<HTMLElement> {}

/**
 * サイドバーナビゲーション。CSS は `.side .navitem` を要求するため
 * 必ず <nav class="side"> をルートにし、NavItem を子に並べる。
 */
export function SideNav({ className, children, ...rest }: SideNavProps) {
  return (
    <nav className={cn('side', className)} {...rest}>
      {children}
    </nav>
  );
}

export interface NavItemProps extends React.HTMLAttributes<HTMLDivElement> {
  /** 選択中の項目に `.active` を付与。 */
  active?: boolean;
}

/**
 * ナビゲーション項目。`.side .navitem` でスタイルされるため <div class="navitem"> を出す。
 * active 指定時は `.active` を追加して選択状態を表現する。
 */
export const NavItem = React.forwardRef<HTMLDivElement, NavItemProps>(function NavItem(
  { active = false, className, children, ...rest },
  ref,
) {
  return (
    <div ref={ref} className={cn('navitem', active && 'active', className)} {...rest}>
      {children}
    </div>
  );
});
