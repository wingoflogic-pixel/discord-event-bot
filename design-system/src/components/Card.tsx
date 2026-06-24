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
