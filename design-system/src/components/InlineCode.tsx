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
