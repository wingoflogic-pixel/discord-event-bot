import * as React from 'react';
import { cn } from '../cn';

export type ToastTone = 'ok' | 'err';

export interface ToastProps extends React.HTMLAttributes<HTMLDivElement> {
  /** 表示状態。true で `.show` を付与しフェードイン。 */
  open?: boolean;
  /** トーン。ok は既定（追加 class なし）、err は `.err`（danger 背景）。 */
  tone?: ToastTone;
}

/**
 * トースト通知。CSS は `.toast` を要求するため固定配置の <div> をレンダーする。
 * open で `.show`、tone="err" で `.err` を class 追加して表現する。
 */
export function Toast({ open = false, tone = 'ok', className, children, ...rest }: ToastProps) {
  return (
    <div className={cn('toast', open && 'show', tone === 'err' && 'err', className)} {...rest}>
      {children}
    </div>
  );
}
