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
