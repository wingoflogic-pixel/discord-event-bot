// ponytail: deferred — see docs/dev/adr/0019-ui-architecture-react-spa.md
// 本コンポーネントは Phase III-SPA (UI 全面 React 化) で初使用予定。
// 現在 ui/index.html は手書き HTML/CSS で完結しており、未参照。
import * as React from 'react';
import { cn } from '../cn';

export interface FieldsetProps extends React.FieldsetHTMLAttributes<HTMLFieldSetElement> {
  /** 凡例（指定時のみ <legend> を前置）。 */
  legend?: React.ReactNode;
}

/**
 * 設定をまとめる枠。`fieldset` / `legend` の要素セレクタでスタイルされるため
 * 素の <fieldset>（凡例があれば <legend>）を出す。
 */
export function Fieldset({ legend, className, children, ...rest }: FieldsetProps) {
  return (
    <fieldset className={cn(className) || undefined} {...rest}>
      {legend != null && <legend>{legend}</legend>}
      {children}
    </fieldset>
  );
}
