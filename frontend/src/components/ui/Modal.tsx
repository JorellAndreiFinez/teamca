import * as React from 'react';
import { cn } from '../../lib/utils';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function Modal({ open, onClose, title, children, className }: ModalProps) {
  const [isRendered, setIsRendered] = React.useState(open);
  const [isClosing, setIsClosing] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setIsRendered(true);
      setIsClosing(false);
      return;
    }

    if (!isRendered) {
      return;
    }

    setIsClosing(true);
    const timer = window.setTimeout(() => {
      setIsRendered(false);
      setIsClosing(false);
    }, 180);

    return () => {
      window.clearTimeout(timer);
    };
  }, [isRendered, open]);

  if (!isRendered) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[200]">
      <button
        type="button"
        aria-label="Close modal"
        className={cn('fixed inset-0 z-0 bg-slate-900/45', isClosing ? 'modal-backdrop-out' : 'modal-backdrop')}
        onClick={onClose}
      />
      <div className="pointer-events-none fixed inset-0 z-10 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center px-3 py-8 sm:px-4 sm:py-10">
          <div
            className={cn(
              'pointer-events-auto relative w-full max-w-lg max-h-[calc(100dvh-4rem)] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl sm:max-h-[calc(100dvh-6rem)] sm:p-6',
              isClosing ? 'modal-panel-out' : 'modal-panel',
              className,
            )}
          >
            {title && <h3 className="mb-4 text-lg font-semibold text-slate-900">{title}</h3>}
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Modal;