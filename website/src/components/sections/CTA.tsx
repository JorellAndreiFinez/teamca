// src/components/CTA.tsx
import React from "react";
import SectionHeader from "../header/SectionHeader";

interface CTAProps {
  title: string;
  subtitle?: string;
  contrast?: "light" | "dark";
  buttonText?: string;
  buttonLink?: string;
  bgImage: string;
}

const CTA: React.FC<CTAProps> = ({
  title,
  subtitle,
  contrast = "light",
  buttonText,
  buttonLink,
  bgImage,
}) => {
  const handleClick = () => {
    if (buttonLink) {
      window.location.href = buttonLink;
    }
  };

  return (
    <section className="relative w-full h-[400px] md:h-[500px] flex items-center justify-center">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${bgImage})` }}
      />

      <div
        className="absolute inset-0 z-10 pointer-events-none"
        style={{
          background: `
            radial-gradient(circle at bottom left, rgb(210, 155, 41, 0.2), transparent 20%),
            radial-gradient(circle at top right, rgb(210, 155, 41, 0.2), transparent 20%)
          `,
        }}
      ></div>

      <div className="absolute inset-0 bg-black/90"></div>

      <div className="relative z-10 px-4 text-white max-w-3xl">
        <SectionHeader
          title={title}
          subtitle={subtitle}
          contrast={contrast}
          align="center"
          size="lg"
          hasButton={!!buttonText}
          buttonText={buttonText}
          onButtonClick={handleClick}
        />
      </div>
    </section>
  );
};

export default CTA;
