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
  const resolvedValue = value ? String(value) : 'user';
  const svg = React.useMemo(
    () => toSvg(resolvedValue, size, { padding: 0.08 }),
    [resolvedValue, size],
  );

  return (
    <span
      className={`inline-flex items-center justify-center overflow-hidden ${className}`}
      role="img"
      aria-label={title}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
