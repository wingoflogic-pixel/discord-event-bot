// ponytail: deferred — see docs/dev/adr/0019-ui-architecture-react-spa.md
// 本コンポーネントは Phase III-SPA (UI 全面 React 化) で初使用予定。
// 現在 ui/index.html は手書き HTML/CSS で完結しており、未参照。
import * as React from 'react';
import { cn } from '../cn';

export interface TimeChipProps extends React.HTMLAttributes<HTMLSpanElement> {}

/**
 * 時刻チップ。`.timechip`（丸ピル）でスタイルされる <span>。
 * 内部に時刻入力やラベルなどを children として収める。
 */
export function TimeChip({ className, children, ...rest }: TimeChipProps) {
  return (
    <span className={cn('timechip', className)} {...rest}>
      {children}
    </span>
  );
}

export interface SlotGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  /** 見出し領域（指定時は `.slotgroup-head` を前置）。 */
  head?: React.ReactNode;
}

/**
 * 単発候補スロットのまとまり。`.slotgroup` でスタイルされる <div>。
 * head を渡すと `.slotgroup-head` を前置し、続けて children を並べる。
 */
export function SlotGroup({ head, className, children, ...rest }: SlotGroupProps) {
  return (
    <div className={cn('slotgroup', className)} {...rest}>
      {head != null && <div className="slotgroup-head">{head}</div>}
      {children}
    </div>
  );
}
