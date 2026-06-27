// ponytail: deferred — see docs/dev/adr/0019-ui-architecture-react-spa.md
// 本コンポーネントは Phase III-SPA (UI 全面 React 化) で初使用予定。
// 現在 ui/index.html は手書き HTML/CSS で完結しており、未参照。
import * as React from 'react';
import { cn } from '../cn';

export type SwitchProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'>;

/**
 * トグルスイッチ（Discord 風）。中身は checkbox なので checked / onChange / disabled が使える。
 * className はラッパ <label> に付与され、残りの props は input に渡る。
 */
export const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(function Switch({ className, ...rest }, ref) {
  return (
    <label className={cn('switch', className)}>
      <input ref={ref} type="checkbox" role="switch" {...rest} />
      <span className="switch-slider" />
    </label>
  );
});
