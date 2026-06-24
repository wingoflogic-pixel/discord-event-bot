import * as React from 'react';
import { cn } from '../cn';

export type PillTone = 'neutral' | 'on' | 'off';

export interface PillProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** 色調。neutral は既定（追加 class なし）。on は `.on`、off は `.off` を付与。 */
  tone?: PillTone;
}

/**
 * ステータス用のピル/バッジ。CSS は `.pill` セレクタを要求するため <span> を出す。
 * tone で on/off の色調を class 追加で表現（neutral は素の `.pill`）。
 */
export function Pill({ tone = 'neutral', className, children, ...rest }: PillProps) {
  return (
    <span className={cn('pill', tone !== 'neutral' && tone, className)} {...rest}>
      {children}
    </span>
  );
}
