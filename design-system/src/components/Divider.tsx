// ponytail: deferred — see docs/dev/adr/0019-ui-architecture-react-spa.md
// 本コンポーネントは Phase III-SPA (UI 全面 React 化) で初使用予定。
// 現在 ui/index.html は手書き HTML/CSS で完結しており、未参照。
import * as React from 'react';
import { cn } from '../cn';

export type DividerProps = React.HTMLAttributes<HTMLHRElement>;

/** 汎用の水平区切り線（セクション間など）。 */
export function Divider({ className, ...rest }: DividerProps) {
  return <hr className={cn('divider', className)} {...rest} />;
}
