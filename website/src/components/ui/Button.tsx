import React from "react";

type ButtonProps = {
  variant?: "primary" | "secondary" | "outline";
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

const Button: React.FC<ButtonProps> = ({
  children,
  variant = "primary",
  className = "",
  ...props
}) => {
  const baseClasses =
    "px-6 py-3 rounded-md font-semibold transition inline-block w-auto text-center";

  let variantClasses = "";

  switch (variant) {
    case "primary":
      variantClasses =
        "bg-[--primary-color] text-white hover:bg-[--light-primary-color]";
      break;
    case "secondary":
      variantClasses =
        "bg-[--accent-color] text-white hover:bg-[--light-primary-color]";
      break;
    case "outline":
      variantClasses =
        "border border-[--primary-color] text-[--primary-color] hover:bg-[--primary-color] hover:text-white";
      break;
  }

  return (
    <button
      className={`${baseClasses} ${variantClasses} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
