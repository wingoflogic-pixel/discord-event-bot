import * as React from 'react';
import { cn } from '../cn';

export interface ListRowProps extends React.HTMLAttributes<HTMLDivElement> {}

/**
 * リスト行。左右の要素を両端寄せ（`justify-content: space-between`）で並べる。
 * CSS は `.listrow` セレクタでスタイルされるため <div class="listrow"> を出す。
 */
export const ListRow = React.forwardRef<HTMLDivElement, ListRowProps>(function ListRow(
  { className, children, ...rest },
  ref,
) {
  return (
    <div ref={ref} className={cn('listrow', className)} {...rest}>
      {children}
    </div>
  );
});
