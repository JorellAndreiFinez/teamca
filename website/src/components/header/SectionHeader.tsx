// SectionHeader.tsx
import React from "react";

type SectionHeaderProps = {
  title: string;
  description?: string | null;
  align?: "left" | "center" | "right";
  color?: "yellow" | "white";
  size?: "xs" | "sm" | "lg" | "xl";
};

const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  description,
  align = "left",
  color = "white",
  size = "lg",
}) => {
  // Tailwind alignment mapping
  const alignClasses: Record<string, string> = {
    left: "text-left",
    center: "text-center",
    right: "text-right",
  };

  // Tailwind color mapping
  const colorClasses: Record<string, string> = {
    white: "text-[--white-color]",
    yellow: "text-[--secondary-color]",
  };

  // Tailwind size mapping (h2 / p)
  const sizeClasses: Record<string, { h2: string; p: string }> = {
    xs: {
      h2: "text-xl sm:text-2xl lg:text-3xl",
      p: "text-sm sm:text-base lg:text-lg",
    },
    sm: {
      h2: "text-2xl sm:text-3xl lg:text-4xl",
      p: "text-base sm:text-lg lg:text-xl",
    },
    lg: {
      h2: "text-3xl sm:text-4xl lg:text-5xl",
      p: "text-lg sm:text-xl lg:text-2xl",
    },
    xl: {
      h2: "text-4xl sm:text-5xl lg:text-6xl",
      p: "text-xl sm:text-2xl lg:text-3xl",
    },
  };

  const currentSize = sizeClasses[size];

  return (
    <div className={`mb-8 ${alignClasses[align]} max-w-8xl`}>
      <h2
        className={`font-bold my-10 ${colorClasses[color]} ${currentSize.h2}`}
      >
        {title}
      </h2>
      {description && <p className={`mb-5 ${currentSize.p}`}>{description}</p>}
    </div>
  );
};

export default SectionHeader;
