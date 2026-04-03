import { useState } from "react";
import SectionHeader from "../../header/SectionHeader";

const teamData = [
  {
    title: "Ms. Christelle Ann",
    description:
      "Ms. Christelle Ann provides leadership and strategic direction for Team CA, ensuring the organization continues to grow and innovate.",
    image: "/images/home/ms-ann.jpg",
  },
  {
    title: "Financial Advisors",
    description:
      "Our financial advisors guide the organization in maintaining sustainability and responsible financial planning.",
    image: "/images/home/financial-advisors.jpg",
  },
  {
    title: "Interns",
    description:
      "Our interns bring fresh ideas and support ongoing initiatives through collaboration, research, and development.",
    image: "/images/home/interns.jpg",
  },
];

export default function WhoWeAre() {
  const [activeIndex, setActiveIndex] = useState<number | null>(0);

  const handleToggle = (index: number) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  return (
    <section className="py-16 md:py-20 lg:py-24 px-4 md:px-10 lg:px-20">
      <div className="max-w-7xl mx-auto">
        <SectionHeader
          subtitle="About"
          title="Team CA"
          description="Team CA is composed of passionate professionals and interns working together to create innovative solutions. Through collaboration, mentorship, and expertise, the team continuously strives to deliver meaningful impact and growth."
          align="center"
          size="lg"
        />

        <div className="grid md:grid-cols-2 gap-10 lg:gap-14 items-start mt-16">
          <div className="space-y-4">
            {teamData.map((item, index) => (
              <div
                key={index}
                className="border-b pb-4 cursor-pointer select-none"
                onClick={() => handleToggle(index)}
              >
                <h3 className="text-lg sm:text-xl md:text-2xl font-semibold text-gray-900 flex justify-between items-center">
                  {item.title}
                  <span className="ml-2">
                    {activeIndex === index ? "-" : "+"}
                  </span>
                </h3>

                {activeIndex === index && (
                  <p className="text-gray-600 mt-3 text-sm sm:text-base md:text-base transition-all duration-300">
                    {item.description}
                  </p>
                )}
              </div>
            ))}

            <div className="flex flex-wrap justify-center md:justify-start items-center gap-4 sm:gap-6 mt-8 max-w-full">
              <img
                src="/images/home/black-orca.png"
                alt="Black Orca"
                className="h-8 sm:h-10 md:h-12 w-auto object-contain grayscale hover:grayscale-0 transition"
              />
              <img
                src="/images/home/pru-life.png"
                alt="Pru Life"
                className="h-20 sm:h-22 md:h-24 w-auto object-contain grayscale hover:grayscale-0 transition"
              />
              <img
                src="/images/home/maperaang-pilipino.png"
                alt="Maperaang Pilipino"
                className="h-20 w-auto object-contain grayscale hover:grayscale-0 transition"
              />
            </div>
          </div>

          <div className="relative rounded-xl overflow-hidden">
            <img
              src={teamData[activeIndex ?? 0].image}
              alt={teamData[activeIndex ?? 0].title}
              className="w-full h-[400px] sm:h-[420px] md:h-[450px] lg:h-[550px] object-cover bg-right contrast-110 saturate-110"
            />

            {/* <div className="absolute top-4 right-4 z-10">
              <img
                src="/images/home/team-ca.png"
                alt="Team CA Logo"
                className="h-10 sm:h-12 md:h-16 lg:h-20 object-contain"
              />
            </div> */}

            <div className="absolute inset-0 pointer-events-none">
              <div
                className="absolute w-[100px] sm:w-[120px] h-[100px] sm:h-[120px] blur-[60px] -top-10 -left-10"
                style={{ background: "var(--primary-color)" }}
              />
              <div
                className="absolute w-[80px] sm:w-[100px] h-[80px] sm:h-[100px] blur-[50px] -top-20 -left-6"
                style={{ background: "var(--light-primary-color)" }}
              />

              <div
                className="absolute w-[100px] sm:w-[120px] h-[100px] sm:h-[120px] blur-[60px] -bottom-10 -right-10"
                style={{ background: "var(--accent-color)" }}
              />
              <div
                className="absolute w-[80px] sm:w-[100px] h-[80px] sm:h-[100px] blur-[50px] -bottom-20 -right-6"
                style={{ background: "var(--light-primary-color)" }}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
