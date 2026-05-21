import { useState } from "react";
import SectionHeader from "@/components/header/SectionHeader";
import { ChevronDown } from "lucide-react";

export default function CorporateSolutions() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const solutions = [
    {
      title: "Life Protection Plans",
      description:
        "Secure your employees and their families with comprehensive life insurance solutions tailored for long-term protection and peace of mind.",
    },
    {
      title: "Investment Plans",
      description:
        "Provide strategic investment opportunities that help grow and preserve wealth while supporting future financial goals.",
    },
    {
      title: "Education Savings",
      description:
        "Support educational aspirations through structured savings programs designed for future academic needs.",
    },
    {
      title: "Health Protection",
      description:
        "Offer reliable medical and health coverage solutions that ensure financial protection during emergencies and healthcare needs.",
    },
  ];

  const toggleCard = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="relative w-full min-h-[60vh] text-white bg-[--dark-primary] px-4 sm:px-6 py-14 sm:py-16 overflow-hidden">
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
          title="Corporate Financial Solutions"
          description="Explore our suite of financial services designed to meet your unique needs at every stage of life."
          align="center"
          size="xl"
          containerSize="sm"
          color="yellow"
        />

        {/* CARDS */}
        <div className="mt-14 grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
          {solutions.map((item, index) => {
            const isOpen = openIndex === index;

            return (
              <div
                key={index}
                className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl overflow-hidden transition-all duration-300"
              >
                {/* HEADER */}
                <button
                  onClick={() => toggleCard(index)}
                  className="w-full flex items-center text-left justify-between gap-4 px-4 sm:px-6 py-5 hover:bg-white/5 transition-colors duration-300"
                >
                    <h3 className="text-base xs:text-lg md:text-xl font-semibold">
                    {item.title}
                  </h3>

                  <ChevronDown
                    className={`w-5 h-5 transition-transform duration-300 ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {/* CONTENT */}
                <div
                  className={`grid transition-all duration-500 ease-in-out ${
                    isOpen
                      ? "grid-rows-[1fr] opacity-100"
                      : "grid-rows-[0fr] opacity-0"
                  }`}
                >
                  <div className="overflow-hidden">
                    <div className="px-4 sm:px-6 py-3 text-white/70 text-sm md:text-base leading-relaxed">
                      {item.description}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
