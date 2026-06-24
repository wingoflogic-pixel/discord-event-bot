import * as React from 'react';
import { cn } from '../cn';

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  /** ラベル文言（チェックボックスの右に表示）。 */
  label: React.ReactNode;
}

/**
 * インラインのチェックボックス＋ラベル。
 * `label.inline` でラベルと入力を横並びにし、`label.inline input` で素の <input> を整える。
 * className は <label> ラッパに付与し、残りの props は <input> に展開する。
 */
export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { label, className, ...rest },
  ref,
) {
  return (
    <label className={cn('inline', className)}>
      <input ref={ref} type="checkbox" {...rest} />
      {label}
    </label>
  );
});
