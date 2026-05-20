import React from 'react';

type DivProps = React.HTMLAttributes<HTMLDivElement>;

export interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
}

export function Card({ children, className = '', title, subtitle }: CardProps) {
  return (
    <div className={`bg-white rounded-xl border border-slate-200 shadow-sm ${className}`}>
      {(title || subtitle) && (
        <div className="px-6 py-4 border-b border-slate-100">
          {title && <h3 className="text-base font-semibold text-slate-900">{title}</h3>}
          {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
      )}
      {title || subtitle ? <div className="p-6">{children}</div> : children}
    </div>
  );
}

export function CardHeader({ className = '', ...props }: DivProps) {
  return <div className={`px-6 py-4 border-b border-slate-100 ${className}`} {...props} />;
}

export function CardTitle({ className = '', ...props }: DivProps) {
  return <h3 className={`text-base font-semibold text-slate-900 ${className}`} {...props} />;
}

export function CardDescription({ className = '', ...props }: DivProps) {
  return <p className={`text-sm text-slate-500 mt-0.5 ${className}`} {...props} />;
}

export function CardContent({ className = '', ...props }: DivProps) {
  return <div className={`p-6 ${className}`} {...props} />;
}

export default Card;