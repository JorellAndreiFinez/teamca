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
    title: "Web Development",
    description: "Modern, scalable web applications.",
  },
  {
    icon: LayoutDashboard,
    title: "UI/UX Design",
    description: "Clean and user-focused interfaces.",
  },
  {
    icon: Smartphone,
    title: "Mobile Apps",
    description: "iOS & Android app solutions.",
  },
  {
    icon: Cloud,
    title: "Cloud Services",
    description: "Secure and scalable cloud setup.",
  },
  {
    icon: ShieldCheck,
    title: "Cybersecurity",
    description: "Protecting systems and data.",
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

        {/* Cards */}
        <div className="mt-14 flex flex-wrap gap-6 justify-center">
          {services.map((service, index) => {
            const Icon = service.icon;
            return (
              <div
                key={index}
                className="flex flex-col items-center rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 shadow-md transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:bg-white/10
                  w-full sm:w-full md:flex-1 md:min-w-0"
              >
                {/* Icon */}
                <div className="w-12 h-12 md:w-14 md:h-14 flex items-center justify-center rounded-xl mb-4">
                  <Icon className="w-9 h-9 md:w-10 md:h-10 text-secondary" />
                </div>

                {/* Title */}
                <h3 className="text-lg md:text-xl font-semibold text-center">
                  {service.title}
                </h3>

                {/* Description */}
                <p className="mt-2 text-sm md:text-base text-muted-foreground text-center">
                  {service.description}
                </p>

                {/* Button */}
                <div className="mt-5">
                  <Button variant="secondary">Learn More</Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default WhatWeDo;
