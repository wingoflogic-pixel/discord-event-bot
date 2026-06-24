import * as React from 'react';
import { cn } from '../cn';

export type DividerProps = React.HTMLAttributes<HTMLHRElement>;

/** 汎用の水平区切り線（セクション間など）。 */
export function Divider({ className, ...rest }: DividerProps) {
  return <hr className={cn('divider', className)} {...rest} />;
}
