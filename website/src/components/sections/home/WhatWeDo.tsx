import React from "react";
import Button from "../../ui/Button";
import SectionHeader from "../../header/SectionHeader";

import {
  IoAnalyticsOutline,
  IoShieldCheckmarkOutline,
  IoRocketOutline,
  IoColorPaletteOutline,
} from "react-icons/io5";

const WhatWeDo: React.FC = () => {
  const cards = [
    {
      icon: <IoAnalyticsOutline className="text-[--primary-color] w-8 h-8" />,
      title: "Financial Planning",
      description:
        "Create smart strategies to secure long-term financial stability.",
    },
    {
      icon: (
        <IoShieldCheckmarkOutline className="text-[--primary-color] w-8 h-8" />
      ),
      title: "Protection Solutions",
      description:
        "Safeguard your income, health, and future goals with insurance.",
    },
    {
      icon: <IoRocketOutline className="text-[--primary-color] w-8 h-8" />,
      title: "Career Growth",
      description: "Opportunities for interns and aspiring financial advisors.",
    },
    {
      icon: (
        <IoColorPaletteOutline className="text-[--primary-color] w-8 h-8" />
      ),
      title: "Marketing & Multimedia",
      description:
        "Support business development with creative and marketing tasks.",
    },
  ];

  return (
    <section className="w-full py-20 px-6 md:px-12 lg:px-20">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-start gap-12">
        <div className="lg:w-1/2">
          <SectionHeader
            subtitle="Our Mission"
            title="What We Do"
            description="TEAM CA provides professional opportunities and financial guidance for aspiring advisors and interns under Pru Life UK Philippines."
            align="left"
            hasButton={true}
            buttonText="Learn More"
            size="lg"
          />
        </div>

        <div className="lg:w-1/2 grid grid-cols-1 sm:grid-cols-2 gap-6">
          {cards.map((card, index) => (
            <div key={index} className=" p-6 space-y-4 flex flex-col">
              <div>{card.icon}</div>
              <h3 className="text-xl font-semibold text-[--primary-color]">
                {card.title}
              </h3>
              <p className="text-gray-600">{card.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhatWeDo;
