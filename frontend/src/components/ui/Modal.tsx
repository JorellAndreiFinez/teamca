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
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close modal"
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />
      <div className={cn('relative z-10 w-full max-w-lg rounded-lg border border-slate-200 bg-white p-6 shadow-lg', className)}>
        {title && <h3 className="mb-4 text-lg font-semibold text-slate-900">{title}</h3>}
        {children}
      </div>
    </div>
  );
}

export default Modal;