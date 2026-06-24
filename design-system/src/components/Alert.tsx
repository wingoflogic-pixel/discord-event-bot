import * as React from 'react';
import { cn } from '../cn';

export type AlertTone = 'info' | 'warn' | 'danger' | 'ok';

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  /** 配色。info（既定・blurple）/ warn / danger / ok。 */
  tone?: AlertTone;
  /** 先頭アイコン（任意）。 */
  icon?: React.ReactNode;
}

/**
 * 情報/警告のコールアウト（枠＋淡い背景）。注意書きや補足の表示に。
 */
export function Alert({ tone = 'info', icon, className, children, ...rest }: AlertProps) {
  return (
    <div role="note" className={cn('alert', tone !== 'info' && tone, className)} {...rest}>
      {icon != null && <span className="alert-icon">{icon}</span>}
      <div>{children}</div>
    </div>
  );
}
