// ponytail: deferred — see docs/dev/adr/0019-ui-architecture-react-spa.md
// 本コンポーネントは Phase III-SPA (UI 全面 React 化) で初使用予定。
// 現在 ui/index.html は手書き HTML/CSS で完結しており、未参照。
import * as React from 'react';
import { cn } from '../cn';

export type ServerRailProps = React.HTMLAttributes<HTMLElement>;

/**
 * Discord 風のサーバー切替列。画面最左に縦並びで ServerRailItem を並べる。
 * `.shell` の左に置くと「サーバー一覧 | サイドナビ | メイン」の3カラムになる。
 */
export const ServerRail = React.forwardRef<HTMLElement, ServerRailProps>(function ServerRail(
  { className, children, ...rest },
  ref,
) {
  return (
    <nav ref={ref} className={cn('server-rail', className)} aria-label="サーバー" {...rest}>
      {children}
    </nav>
  );
});

export interface ServerRailItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** 選択中のサーバーに `.active`（左の白インジケータ＋角丸＋blurple）を付与。 */
  active?: boolean;
  /** ツールチップ兼アクセシブル名（サーバー名）。 */
  label?: string;
  /** サーバーアイコン画像URL。未指定なら children（頭文字など）を表示。 */
  src?: string;
}

/**
 * サーバー1件のアイコンボタン。hover / active で円→角丸へモーフィングし、
 * 左端に白いインジケータが伸びる（Discord の挙動）。アイコン画像 src か頭文字を出す。
 */
export const ServerRailItem = React.forwardRef<HTMLButtonElement, ServerRailItemProps>(function ServerRailItem(
  { active = false, label, src, className, children, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      className={cn('server-rail-item', active && 'active', className)}
      title={label}
      aria-label={label}
      aria-current={active ? 'true' : undefined}
      {...rest}
    >
      {src ? <img src={src} alt={label ?? ''} /> : children}
    </button>
  );
});

export type ServerRailDividerProps = React.HTMLAttributes<HTMLDivElement>;

/** サーバー列の区切り線（ホーム群とサーバー群の間など）。 */
export function ServerRailDivider({ className, ...rest }: ServerRailDividerProps) {
  return <div className={cn('server-rail-divider', className)} role="separator" {...rest} />;
}
