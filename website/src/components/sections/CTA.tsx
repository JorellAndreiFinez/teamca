// src/components/CTA.tsx
import React from "react";
import SectionHeader from "../header/SectionHeader";

interface CTAProps {
  title: string;
  subtitle?: string;
  buttonText?: string;
  buttonLink?: string;
  bgImage: string;
}

const CTA: React.FC<CTAProps> = ({
  title,
  subtitle,
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

      <div className="absolute inset-0 bg-gradient from-white/70 via-white/40 to-black/50" />

      <div className="relative z-10 px-4 text-white max-w-3xl">
        <SectionHeader
          title={title}
          subtitle={subtitle}
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
