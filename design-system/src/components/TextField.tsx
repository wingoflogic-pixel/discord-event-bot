import * as React from 'react';
import { cn } from '../cn';

export interface TextFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** バリデーションエラー時 true。`.invalid` を付与。 */
  invalid?: boolean;
  /** ラベル文言（指定時は <label> を前置）。 */
  label?: React.ReactNode;
  /** エラーメッセージ（`.field-error`）。 */
  error?: React.ReactNode;
}

/**
 * 単一行テキスト入力。`input` 要素セレクタでスタイルされるため素の <input> を出す。
 * label / error を渡すと <label> と .field-error を伴うフィールド一式になる。
 */
export const TextField = React.forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  { invalid = false, label, error, className, id, ...rest },
  ref,
) {
  const input = <input ref={ref} id={id} className={cn(invalid && 'invalid', className) || undefined} {...rest} />;
  if (label == null && error == null) return input;
  return (
    <>
      {label != null && <label htmlFor={id}>{label}</label>}
      {input}
      {error != null && <div className="field-error">{error}</div>}
    </>
  );
});
