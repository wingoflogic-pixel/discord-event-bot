// ponytail: deferred — see docs/dev/adr/0019-ui-architecture-react-spa.md
// 本コンポーネントは Phase III-SPA (UI 全面 React 化) で初使用予定。
// 現在 ui/index.html は手書き HTML/CSS で完結しており、未参照。
import * as React from 'react';
import { cn } from '../cn';

export interface TopbarProps extends React.HTMLAttributes<HTMLDivElement> {}

/**
 * アプリ上部バー。`.topbar` をレンダーし、左右に要素を配置する器。
 * 中身（ServerBadge やボタン群など）は children で渡す。
 */
export function Topbar({ className, children, ...rest }: TopbarProps) {
  return (
    <div className={cn('topbar', className)} {...rest}>
      {children}
    </div>
  );
}

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {}

/**
 * 角丸スクエアのアバター（`.ava`）。
 * children に頭文字や絵文字など 1 文字程度を渡す。
 */
export function Avatar({ className, children, ...rest }: AvatarProps) {
  return (
    <div className={cn('ava', className)} {...rest}>
      {children}
    </div>
  );
}

export interface ServerBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  /** サーバー名（主表示）。 */
  name: React.ReactNode;
  /** 副題（任意・`.muted` の小さめ表示）。 */
  subtitle?: React.ReactNode;
  /** アバター内に出す頭文字／絵文字。 */
  fallback?: React.ReactNode;
}

/**
 * サーバー識別バッジ（`.srv`）。Avatar と名前ブロックを横並びにする。
 * subtitle を渡すと名前の下に小さめの補足を添える。
 */
export function ServerBadge({ name, subtitle, fallback, className, ...rest }: ServerBadgeProps) {
  return (
    <div className={cn('srv', className)} {...rest}>
      <Avatar>{fallback}</Avatar>
      <div>
        {name}
        {subtitle != null && <div className="muted" style={{ fontSize: 12 }}>{subtitle}</div>}
      </div>
    </div>
  );
}
