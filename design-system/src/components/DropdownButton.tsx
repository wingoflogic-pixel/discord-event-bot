// ponytail: deferred — see docs/dev/adr/0019-ui-architecture-react-spa.md
// 本コンポーネントは Phase III-SPA (UI 全面 React 化) で初使用予定。
// 現在 ui/index.html は手書き HTML/CSS で完結しており、未参照。
import * as React from 'react';
import { cn } from '../cn';

export interface DropdownButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** 先頭アイコン（任意）。 */
  icon?: React.ReactNode;
  /** メニュー展開中なら true（キャレットが反転）。 */
  open?: boolean;
}

/**
 * アイコン＋現在値＋キャレットの選択トリガ。これ自体はメニューを持たないので、
 * クリックで自前のメニュー/ポップオーバーを開くこと（open でキャレットの向きを制御）。
 */
export const DropdownButton = React.forwardRef<HTMLButtonElement, DropdownButtonProps>(function DropdownButton(
  { icon, open = false, className, children, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      className={cn('dropdown-btn', className)}
      aria-haspopup="listbox"
      aria-expanded={open}
      {...rest}
    >
      {icon != null && <span className="dropdown-btn-icon">{icon}</span>}
      <span className="dropdown-btn-label">{children}</span>
      <span className="dropdown-btn-caret" aria-hidden="true">⌄</span>
    </button>
  );
});
