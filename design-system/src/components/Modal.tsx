import * as React from 'react';
import { cn } from '../cn';

export interface ModalProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  /** 開閉状態。false のとき何もレンダーしない。 */
  open: boolean;
  /** 見出し（指定時は <h3> を前置）。 */
  title?: React.ReactNode;
  /** 背景クリック・Escape・各種クローズ操作時のハンドラ。 */
  onClose?: () => void;
  /** フッター領域（`.actions` で右寄せ）。 */
  footer?: React.ReactNode;
}

/**
 * 確認/ダイアログ。open のとき `.backdrop > .modal[role=dialog]` を出す。
 * 背景自体のクリックと Escape キーで onClose を呼ぶ。!open なら null。
 */
export function Modal({ open, title, onClose, footer, className, children, ...rest }: ModalProps) {
  React.useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const onBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose?.();
  };

  return (
    <div className={cn('backdrop', className)} onClick={onBackdropClick} {...rest}>
      <div className="modal" role="dialog" aria-modal="true">
        {title != null && <h3>{title}</h3>}
        {children}
        {footer != null && <div className="actions">{footer}</div>}
      </div>
    </div>
  );
}
