import * as React from 'react';
import { cn } from '../cn';

export interface SettingRowProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  /** 設定名（左・太字）。 */
  title: React.ReactNode;
  /** 補足説明（左・薄い行）。 */
  description?: React.ReactNode;
  /** 右側のコントロール（Switch / Select / Button など）。children でも可。 */
  control?: React.ReactNode;
}

/**
 * 設定1行。左にタイトル＋説明、右にコントロール。下線で区切る（最終行は線なし）。
 */
export function SettingRow({ title, description, control, className, children, ...rest }: SettingRowProps) {
  const right = control ?? children;
  return (
    <div className={cn('setting-row', className)} {...rest}>
      <div className="setting-row-main">
        <span className="setting-row-title">{title}</span>
        {description != null && <span className="setting-row-desc">{description}</span>}
      </div>
      {right != null && <div className="setting-row-control">{right}</div>}
    </div>
  );
}
