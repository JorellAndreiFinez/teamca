// website\src\components\ui\Button.tsx

import React from "react";

type ButtonProps = {
  variant?: "default" | "secondary" | "outline";
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

const Button: React.FC<ButtonProps> = ({
  children,
  variant = "default",
  className = "",
  ...props
}) => {
  const baseClasses =
    "px-6 py-3 rounded-md font-semibold transition inline-block w-auto text-center font-sans";

  let style: React.CSSProperties = {};
  let variantClasses = "";

  switch (variant) {
    case "default":
      style = {
        background: "var(--btn-default)",
        color: "var(--primary-color)",
        textTransform: "uppercase",
        border: "3px solid var(--br-color-default)",
      };
      variantClasses = "hover:brightness-110";
      break;
    case "secondary":
      style = {
        background: "var(--btn-secondary)",
        color: "var(--white-color)",
        textTransform: "uppercase",
        border: "3px solid var(--br-color-secondary)",
      };
      variantClasses = "hover:bg-[var(--light-primary-color)]";
      break;
    case "outline":
      style = {
        borderColor: "var(--primary-color)",
        color: "var(--white-color)",
        borderWidth: 1,
      };
      variantClasses = "hover:bg-[var(--primary-color)] hover:text-white";
      break;
  }

  return (
    <button
      className={`${baseClasses} ${variantClasses} ${className}`}
      style={style}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
