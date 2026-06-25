import * as React from 'react';
import { cn } from '../cn';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
export type ButtonSize = 'md' | 'sm' | 'xs';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** 視覚バリアント。primary は既定（追加 class なし）。 */
  variant?: ButtonVariant;
  /** サイズ。md は既定（追加 class なし）。 */
  size?: ButtonSize;
  /** ローディング表示（スピナー＋操作無効化）。 */
  busy?: boolean;
}

/**
 * ボタン。CSS は `button.btn` を要求するため必ず <button> をレンダーする。
 * バリアント/サイズ/busy は class 追加で表現（多重指定可: `btn xs ghost`）。
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', busy = false, className, children, disabled, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      className={cn('btn', variant !== 'primary' && variant, size !== 'md' && size, busy && 'busy', className)}
      disabled={disabled || busy}
      {...rest}
    >
      {children}
    </button>
  );
});
