import * as React from 'react';
import { cn } from '../cn';

export interface TableProps extends React.TableHTMLAttributes<HTMLTableElement> {
  /** true（既定）で `.table-wrap` の <div> に包む。false で素の <table> のみ。 */
  wrap?: boolean;
}

/**
 * データテーブル。CSS は `table`/`th`/`td` の要素セレクタでスタイルされるため素の <table> を出す。
 * wrap が false 以外なら横スクロール用の `.table-wrap` で包む。
 */
export function Table({ wrap = true, className, children, ...rest }: TableProps) {
  const table = (
    <table className={cn(className) || undefined} {...rest}>
      {children}
    </table>
  );
  if (wrap === false) return table;
  return <div className="table-wrap">{table}</div>;
}
