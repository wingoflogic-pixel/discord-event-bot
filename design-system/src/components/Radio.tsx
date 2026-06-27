// ponytail: deferred — see docs/dev/adr/0019-ui-architecture-react-spa.md
// 本コンポーネントは Phase III-SPA (UI 全面 React 化) で初使用予定。
// 現在 ui/index.html は手書き HTML/CSS で完結しており、未参照。
import * as React from 'react';
import { cn } from '../cn';

export interface RadioProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  /** 主ラベル（太字）。 */
  label: React.ReactNode;
  /** 補足説明（ラベル下の薄い行）。 */
  description?: React.ReactNode;
}

/**
 * タイトル＋説明つきのラジオ選択肢。複数を RadioGroup で囲み、同じ name を渡して排他にする。
 */
export const Radio = React.forwardRef<HTMLInputElement, RadioProps>(function Radio(
  { label, description, className, ...rest },
  ref,
) {
  return (
    <label className={cn('radio-option', className)}>
      <input ref={ref} type="radio" {...rest} />
      <span className="radio-mark" />
      <span className="radio-body">
        <span className="radio-title">{label}</span>
        {description != null && <span className="radio-desc">{description}</span>}
      </span>
    </label>
  );
});

export type RadioGroupProps = React.HTMLAttributes<HTMLDivElement>;

/** Radio を縦に並べる入れ物（role="radiogroup"）。子の Radio には同じ name を渡すこと。 */
export const RadioGroup = React.forwardRef<HTMLDivElement, RadioGroupProps>(function RadioGroup(
  { className, children, ...rest },
  ref,
) {
  return (
    <div ref={ref} role="radiogroup" className={cn('radio-group', className)} {...rest}>
      {children}
    </div>
  );
});
