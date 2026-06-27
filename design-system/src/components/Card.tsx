// ponytail: deferred — see docs/dev/adr/0019-ui-architecture-react-spa.md
// 本コンポーネントは Phase III-SPA (UI 全面 React 化) で初使用予定。
// 現在 ui/index.html は手書き HTML/CSS で完結しており、未参照。
import * as React from 'react';
import { cn } from '../cn';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {}

/**
 * クリック可能なサーフェス。CSS は `.card` を要求するため <div> をレンダーする。
 * onClick など残りの props はルート要素へそのまま渡る。
 */
export const Card = React.forwardRef<HTMLDivElement, CardProps>(function Card(
  { className, children, ...rest },
  ref,
) {
  return (
    <div ref={ref} className={cn('card', className)} {...rest}>
      {children}
    </div>
  );
});
