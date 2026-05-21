import SectionHeader from "@/components/header/SectionHeader";
import { Shield, Users, Lightbulb } from "lucide-react";

export default function WhatWeStandFor() {
  const cards = [
    {
      icon: Shield,
      title: "Building Future-Ready Professionals",
      description:
        "We develop competent, empowered individuals through mentorship and continuous learning.",
    },
    {
      icon: Users,
      title: "Promoting Financial Awareness",
      description:
        "We educate individuals and families about financial literacy and informed decision-making.",
    },
    {
      icon: Lightbulb,
      title: "Ensuring Security & Peace of Mind",
      description:
        "We help families achieve protection and long-term financial security.",
    },
  ];

  return (
    <section className="relative w-full min-h-[60vh] text-white bg-[--dark-primary] px-6 py-16 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <img
          src="/partials/layer-blur.png"
          alt="background"
          className="w-full h-full object-cover"
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">
        <SectionHeader
          title="What We Stand For"
          align="left"
          size="xl"
          color="yellow"
        />

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {cards.map((card, index) => {
            const Icon = card.icon;

            return (
              <div
                key={index}
                className="
                    flex flex-col items-center
                    rounded-2xl
                    border border-white/10
                    bg-white/5 backdrop-blur-xl
                    p-8 md:p-10
                    text-center
                    min-h-[320px]
                    transition-all duration-300
                    hover:-translate-y-2 hover:bg-white/10 hover:shadow-xl
                    "
              >
                {/* Icon */}
                <div className="w-12 h-12 flex items-center justify-center mb-4">
                  <Icon className="w-10 h-10 text-white" />
                </div>

                {/* Title */}
                <h3 className="text-xl font-semibold mb-2">{card.title}</h3>

                {/* Description */}
                <p className="text-white/80 text-sm md:text-base">
                  {card.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
