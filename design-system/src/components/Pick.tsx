// ponytail: deferred — see docs/dev/adr/0019-ui-architecture-react-spa.md
// 本コンポーネントは Phase III-SPA (UI 全面 React 化) で初使用予定。
// 現在 ui/index.html は手書き HTML/CSS で完結しており、未参照。
import * as React from 'react';
import { cn } from '../cn';

export interface PickRowProps extends React.HTMLAttributes<HTMLDivElement> {}

/**
 * 選択候補の 1 行。左右の要素を両端寄せ（`justify-content: space-between`）で並べる。
 * CSS は `.pickrow` セレクタでスタイルされるため <div class="pickrow"> を出す。
 */
export function PickRow({ className, children, ...rest }: PickRowProps) {
  return (
    <div className={cn('pickrow', className)} {...rest}>
      {children}
    </div>
  );
}

export interface SearchBoxProps extends React.HTMLAttributes<HTMLDivElement> {}

/**
 * 検索入力の相対位置ラッパ。`.search`（position: relative）でアイコン等を絶対配置できる。
 * 中身（input など）はそのまま children として配置する。
 */
export function SearchBox({ className, children, ...rest }: SearchBoxProps) {
  return (
    <div className={cn('search', className)} {...rest}>
      {children}
    </div>
  );
}
