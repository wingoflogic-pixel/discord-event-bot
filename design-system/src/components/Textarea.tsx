import * as React from 'react';
import { cn } from '../cn';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** バリデーションエラー時 true。`.invalid` を付与。 */
  invalid?: boolean;
  /** ラベル文言（指定時は <label> を前置）。 */
  label?: React.ReactNode;
  /** エラーメッセージ（`.field-error`）。 */
  error?: React.ReactNode;
}

/**
 * 複数行テキスト入力。`textarea` 要素セレクタでスタイルされるため素の <textarea> を出す。
 * label / error を渡すと <label> と .field-error を伴うフィールド一式になる。
 */
export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { invalid = false, label, error, className, id, ...rest },
  ref,
) {
  const textarea = (
    <textarea ref={ref} id={id} className={cn(invalid && 'invalid', className) || undefined} {...rest} />
  );
  if (label == null && error == null) return textarea;
  return (
    <>
      {label != null && <label htmlFor={id}>{label}</label>}
      {textarea}
      {error != null && <div className="field-error">{error}</div>}
    </>
  );
});
