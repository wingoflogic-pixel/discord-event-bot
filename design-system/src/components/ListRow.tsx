// ponytail: deferred — see docs/dev/adr/0019-ui-architecture-react-spa.md
// 本コンポーネントは Phase III-SPA (UI 全面 React 化) で初使用予定。
// 現在 ui/index.html は手書き HTML/CSS で完結しており、未参照。
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
