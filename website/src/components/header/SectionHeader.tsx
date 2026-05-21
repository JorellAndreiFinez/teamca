import React from "react";

type SectionHeaderProps = {
  title?: string | null;
  description?: string | null;
  align?: "left" | "center" | "right";
  color?: "yellow" | "white";
  size?: "xs" | "sm" | "lg" | "xl";
  containerSize?: "sm" | "md" | "lg" | "xl" | "full";

  // NEW
  titleParts?: {
    text: string;
    color?: "yellow" | "white";
  }[];
};

const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  description,
  align = "left",
  color = "white",
  size = "lg",
  containerSize = "lg",
  titleParts,
}) => {
  const alignClasses = {
    left: "text-left",
    center: "text-center",
    right: "text-right",
  };

  const colorClasses = {
    white: "text-[--white-color]",
    yellow: "text-[--secondary-color]",
  };

  const sizeClasses = {
    xs: {
      h2: "text-xl sm:text-2xl lg:text-3xl leading-tight",
      p: "text-sm sm:text-base lg:text-lg",
    },
    sm: {
      h2: "text-2xl sm:text-3xl lg:text-4xl leading-tight",
      p: "text-base sm:text-lg lg:text-xl",
    },
    lg: {
      h2: "text-3xl sm:text-4xl lg:text-5xl leading-tight",
      p: "text-base sm:text-xl lg:text-2xl",
    },
    xl: {
      h2: "text-3xl xs:text-4xl sm:text-5xl lg:text-6xl leading-tight",
      p: "text-base sm:text-xl lg:text-xl",
    },
  };

  const containerClasses = {
    sm: "max-w-2xl",
    md: "max-w-4xl",
    lg: "max-w-6xl",
    xl: "max-w-7xl",
    full: "max-w-full",
  };

  const currentSize = sizeClasses[size];

  return (
    <div
      className={`mb-8 mx-auto w-full ${alignClasses[align]} ${containerClasses[containerSize]}`}
    >
      <h2 className={`font-bold my-7 sm:my-10 ${currentSize.h2}`}>
        {titleParts ? (
          titleParts.map((part, i) => (
            <span
              key={i}
              className={
                part.color === "yellow"
                  ? "text-[--secondary-color]"
                  : "text-[--white-color]"
              }
            >
              {part.text}
            </span>
          ))
        ) : (
          <span className={colorClasses[color]}>{title}</span>
        )}
      </h2>

      {description && <p className={`mb-5 ${currentSize.p}`}>{description}</p>}
    </div>
  );
};

export default SectionHeader;
