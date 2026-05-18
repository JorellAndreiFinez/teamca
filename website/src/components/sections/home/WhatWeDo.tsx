import React from "react";
import Button from "@/components/ui/Button";
import {
  Code,
  LayoutDashboard,
  Smartphone,
  Cloud,
  ShieldCheck,
} from "lucide-react";
import SectionHeader from "@/components/header/SectionHeader";

const services = [
  {
    icon: Code,
    title: "Financial Planning",
    description:
      "Take control of your financial future with a plan built just for you.",
  },
  {
    icon: LayoutDashboard,
    title: "Life Insurance ",
    description:
      "Secure your future and your family’s with protection you can trust.",
  },
  {
    icon: Smartphone,
    title: "Investment Planning",
    description:
      "Start growing your wealth with confidence through smart, guided strategies.",
  },
  {
    icon: Cloud,
    title: "Retirement Planning",
    description:
      "Build the retirement you deserve and enjoy life without financial worries.",
  },
  {
    icon: ShieldCheck,
    title: "Education Planning",
    description:
      "Achieve educational goals with a flexible plan designed for the future.",
  },
];

const WhatWeDo: React.FC = () => {
  return (
    <section className="w-full py-20 px-6 md:px-12 lg:px-20 bg-gradient-to-b from-background to-muted/40">
      <div className="max-w-7xl mx-auto text-center">
        <SectionHeader
          title="Our Services"
          description="We provide high-quality digital solutions to help businesses grow,
          innovate, and scale efficiently."
          align="center"
          color="yellow"
        />

        <div className="mt-14 flex justify-center">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 w-full max-w-7xl">
            {services.map((service, index) => {
              const Icon = service.icon;

              return (
                <div
                  key={index}
                  className="
            flex flex-col text-center
            rounded-2xl border border-white/10
            bg-white/5 backdrop-blur-xl
            p-5 shadow-md transition-all duration-300
            hover:-translate-y-2 hover:bg-white/10 hover:shadow-xl
            w-full h-full
          "
                >
                  {/* ICON (fixed alignment block) */}
                  <div className="flex justify-center mb-3">
                    <div className="w-11 h-11 flex items-center justify-center rounded-xl">
                      <Icon className="w-7 h-7 text-secondary" />
                    </div>
                  </div>

                  {/* TITLE (fixed height feel) */}
                  <h3 className="text-base font-semibold leading-snug min-h-[40px] flex items-center justify-center">
                    {service.title}
                  </h3>

                  {/* DESCRIPTION (flex area to equalize height) */}
                  <p className="mt-2 text-xs sm:text-sm text-white/70 line-clamp-3 flex-1 flex items-start justify-center">
                    {service.description}
                  </p>

                  {/* BUTTON (always bottom aligned) */}
                  <div className="mt-auto pt-4">
                    <Button variant="secondary" className="w-full">
                      Learn More
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default WhatWeDo;
