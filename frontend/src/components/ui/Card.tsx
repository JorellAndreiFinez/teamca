import * as React from 'react';

<<<<<<< HEAD
<<<<<<< HEAD
const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('rounded-lg border border-slate-200 bg-white text-slate-950 shadow-sm', className)} {...props} />
  )
);
Card.displayName = 'Card';
=======
type DivProps = React.HTMLAttributes<HTMLDivElement>;
type CardProps = DivProps & {
  title?: string;
  subtitle?: string;
};
>>>>>>> 75180937812242ebfb8c998aa2d5b47944bfdfa3

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

<<<<<<< HEAD
export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
=======
interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
}

export default function Card({ children, className = '', title, subtitle }: CardProps) {
  return (
    <div className={`bg-white rounded-xl border border-gray-200 shadow-sm ${className}`}>
      {(title || subtitle) && (
        <div className="px-6 py-4 border-b border-gray-100">
          {title && <h3 className="text-base font-semibold text-gray-900">{title}</h3>}
          {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
        </div>
      )}
      <div className="p-6">{children}</div>
    </div>
  );
}
>>>>>>> f0d231d (feat: implement dashboard with role-based views, sidebar, DTR/tasks/profile pages, and backend mock API)
=======
export default Card;
>>>>>>> 75180937812242ebfb8c998aa2d5b47944bfdfa3
