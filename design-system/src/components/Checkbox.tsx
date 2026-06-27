// ponytail: deferred — see docs/dev/adr/0019-ui-architecture-react-spa.md
// 本コンポーネントは Phase III-SPA (UI 全面 React 化) で初使用予定。
// 現在 ui/index.html は手書き HTML/CSS で完結しており、未参照。
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
