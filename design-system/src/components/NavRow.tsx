import * as React from 'react';
import { cn } from '../cn';

export interface NavRowProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  /** 行のタイトル（太字）。 */
  title: React.ReactNode;
  /** 補足説明（薄い行）。 */
  description?: React.ReactNode;
  /** 先頭アイコン（任意）。 */
  icon?: React.ReactNode;
  /** 末尾のシェブロンを出すか（既定 true）。 */
  chevron?: boolean;
}

/**
 * 別画面へ遷移する行。アイコン＋タイトル＋説明＋末尾シェブロン。onClick で遷移させる。
 */
export const NavRow = React.forwardRef<HTMLDivElement, NavRowProps>(function NavRow(
  { title, description, icon, chevron = true, className, ...rest },
  ref,
) {
  return (
    <div ref={ref} role="button" tabIndex={0} className={cn('nav-row', className)} {...rest}>
      {icon != null && <span className="nav-row-icon">{icon}</span>}
      <span className="nav-row-main">
        <span className="nav-row-title">{title}</span>
        {description != null && <span className="nav-row-desc">{description}</span>}
      </span>
      {chevron && (
        <span className="nav-row-chevron" aria-hidden="true">
          ›
        </span>
      )}
    </div>
  );
});
