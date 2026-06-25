import * as React from 'react';
import { cn } from '../cn';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  /** バリデーションエラー時 true。`.invalid` を付与。 */
  invalid?: boolean;
  /** ラベル文言（指定時は <label> を前置）。 */
  label?: React.ReactNode;
  /** エラーメッセージ（`.field-error`）。 */
  error?: React.ReactNode;
}

/**
 * ドロップダウン選択。`select` 要素セレクタでスタイルされるため素の <select> を出す。
 * children に <option> を渡す。label / error を渡すと <label> と .field-error を伴うフィールド一式になる。
 */
export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { invalid = false, label, error, className, id, children, ...rest },
  ref,
) {
  const select = (
    <select ref={ref} id={id} className={cn(invalid && 'invalid', className) || undefined} {...rest}>
      {children}
    </select>
  );
  if (label == null && error == null) return select;
  return (
    <>
      {label != null && <label htmlFor={id}>{label}</label>}
      {select}
      {error != null && <div className="field-error">{error}</div>}
    </>
  );
});
