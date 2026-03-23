import * as React from 'react';

type DivProps = React.HTMLAttributes<HTMLDivElement>;
type CardProps = DivProps & {
  title?: string;
  subtitle?: string;
};

export function Card({ className = '', title, subtitle, children, ...props }: CardProps) {
  return (
    <div className={`rounded-xl border border-gray-200 bg-white shadow-sm ${className}`} {...props}>
      {(title || subtitle) && (
        <div className="border-b border-gray-100 px-6 py-4">
          {title && <h3 className="text-base font-semibold text-gray-900">{title}</h3>}
          {subtitle && <p className="mt-0.5 text-sm text-gray-500">{subtitle}</p>}
        </div>
      )}
      {title || subtitle ? <div className="px-6 py-4">{children}</div> : children}
    </div>
  );
}

export function CardHeader({ className = '', ...props }: DivProps) {
  return <div className={`border-b border-gray-100 px-6 py-4 ${className}`} {...props} />;
}

export function CardTitle({ className = '', ...props }: DivProps) {
  return <h3 className={`text-base font-semibold text-gray-900 ${className}`} {...props} />;
}

export function CardDescription({ className = '', ...props }: DivProps) {
  return <p className={`mt-0.5 text-sm text-gray-500 ${className}`} {...props} />;
}

export function CardContent({ className = '', ...props }: DivProps) {
  return <div className={`px-6 py-4 ${className}`} {...props} />;
}

export default Card;
