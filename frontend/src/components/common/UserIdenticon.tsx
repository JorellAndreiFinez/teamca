import React from 'react';
import { toSvg } from 'jdenticon';

type UserIdenticonProps = {
  value?: string | number | null;
  size?: number;
  className?: string;
  title?: string;
};

export default function UserIdenticon({
  value,
  size = 40,
  className = '',
  title = 'User avatar',
}: UserIdenticonProps) {
  const [mounted, setMounted] = React.useState(false);
  const resolvedValue = value ? String(value) : 'user';
  const svg = React.useMemo(
    () => toSvg(resolvedValue, size, { padding: 0.08 }),
    [resolvedValue, size],
  );

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <span
        className={`inline-flex items-center justify-center overflow-hidden ${className}`}
        style={{ width: size, height: size }}
        aria-hidden="true"
      />
    );
  }

  return (
    <span
      className={`inline-flex items-center justify-center overflow-hidden ${className}`}
      role="img"
      aria-label={title}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
