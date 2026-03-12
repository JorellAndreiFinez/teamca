import React from "react";
import Button from "../ui/Button";

interface SectionHeaderProps {
  subtitle?: string;
  title: string;
  description?: string;
  align?: "left" | "center" | "right" | "hybrid";
  size?: "sm" | "md" | "lg" | "xl";
  hasButton?: boolean;
  buttonText?: string;
  onButtonClick?: () => void;
}

const alignments = {
  left: "text-left items-start mx-0",
  center: "text-center items-center mx-auto",
  right: "text-right items-end ml-auto",
};

const sizes = {
  sm: {
    subtitle: "text-xs",
    title: "text-2xl md:text-3xl",
    description: "text-sm md:text-base",
  },
  md: {
    subtitle: "text-sm",
    title: "text-4xl md:text-5xl",
    description: "text-base md:text-lg",
  },
  lg: {
    subtitle: "text-base",
    title: "text-5xl md:text-6xl lg:text-7xl",
    description: "text-lg md:text-xl",
  },
  xl: {
    subtitle: "text-base",
    title: "text-6xl md:text-6xl lg:text-7xl",
    description: "text-lg md:text-xl",
  },
};

const SectionHeader: React.FC<SectionHeaderProps> = ({
  subtitle,
  title,
  description,
  align = "center",
  size = "md",
  hasButton = false,
  buttonText = "Learn More",
  onButtonClick,
}) => {
  const currentSize = sizes[size];

  if (align === "hybrid") {
    return (
      <div className="w-full">
        {subtitle && (
          <p
            className={`${currentSize.subtitle} uppercase font-semibold tracking-widest text-[--primary-color] mb-4 text-center lg:text-left`}
          >
            {subtitle}
          </p>
        )}

        <div className="flex flex-col lg:flex-row items-start justify-between gap-6">
          <h2
            className={`${currentSize.title} font-bold text-[--light-primary-color] leading-tight lg:w-1/2`}
          >
            {title}
          </h2>

          {description && (
            <p className={`${currentSize.description} text-gray-700 lg:w-1/2`}>
              {description}
            </p>
          )}
        </div>

        {hasButton && (
          <div className="mt-6">
            <Button variant="primary" onClick={onButtonClick}>
              {buttonText}
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`flex flex-col space-y-6 max-w-3xl ${alignments[align]}`}>
      {subtitle && (
        <p
          className={`${currentSize.subtitle} uppercase font-semibold tracking-widest -mb-3 text-[--primary-color]`}
        >
          {subtitle}
        </p>
      )}

      <h2
        className={`${currentSize.title} font-bold text-[--light-primary-color] leading-tight`}
      >
        {title}
      </h2>

      {description && (
        <p className={`${currentSize.description} text-gray-700`}>
          {description}
        </p>
      )}

      {hasButton && (
        <div>
          <Button variant="primary" onClick={onButtonClick}>
            {buttonText}
          </Button>
        </div>
      )}
    </div>
  );
};

export default SectionHeader;
