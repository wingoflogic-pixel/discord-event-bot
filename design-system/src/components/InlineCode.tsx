// ponytail: deferred — see docs/dev/adr/0019-ui-architecture-react-spa.md
// 本コンポーネントは Phase III-SPA (UI 全面 React 化) で初使用予定。
// 現在 ui/index.html は手書き HTML/CSS で完結しており、未参照。
import * as React from 'react';
import { cn } from '../cn';

export interface InlineCodeProps extends React.HTMLAttributes<HTMLElement> {}

/**
 * インラインコード。`code` 要素セレクタでスタイルされるため素の <code> を出す。
 */
export const InlineCode = React.forwardRef<HTMLElement, InlineCodeProps>(function InlineCode(
  { className, children, ...rest },
  ref,
) {
  return (
    <code ref={ref} className={cn(className) || undefined} {...rest}>
      {children}
    </code>
  );
});
