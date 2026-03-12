import React from "react";

const HomeHero: React.FC = () => {
  return (
    <section className="relative w-full min-h-screen overflow-hidden m-0 p-0">
      <img
        src="https://images.pexels.com/photos/6694492/pexels-photo-6694492.jpeg"
        className="absolute inset-0 w-full h-full object-cover"
      />

      <div className="absolute inset-0 bg-black/60"></div>

      <div
        className="absolute inset-0 z-10 pointer-events-none"
        style={{
          background: `
            radial-gradient(circle at top left, rgba(106,52,5,0.95), transparent 75%),
            radial-gradient(circle at bottom right, rgba(210,155,41,0.15), transparent 45%)
          `,
        }}
      ></div>

      <div
        className="
        absolute z-20 font-semibold
        left-6 md:left-10 lg:left-14 xl:left-18
        top-28 sm:top-32 md:top-1/2
        md:-translate-y-1/2
        w-[85%] sm:w-80 md:w-96
        p-3 sm:p-4
        rounded-lg
        "
      >
        <p className="text-lg text-white font-medium leading-relaxed">
          TEAM CA is part of the Black Orcas Summit Life Insurance Agency,
          providing professional opportunities for interns and financial
          advisors under Pru Life UK Philippines.
        </p>
      </div>

      <div className="absolute bottom-10 left-4 md:left-8 lg:left-12 xl:left-14 flex flex-col sm:flex-row items-start sm:items-end gap-6 z-20">
        <h1
          className="font-bold text-[--light-primary-color] leading-none
          text-7xl xs:text-8xl
          tracking-tight
          block sm:hidden"
        >
          TEAM CA
        </h1>
        <div className="bg-[--secondary-color] rounded-2xl p-5 md:p-8 space-y-4 shadow-lg max-w-sm md:max-w-md">
          <p className="text-[--primary-color] text-lg md:text-xl">
            Helping individuals and families secure their financial future
            through smart financial planning and protection.
          </p>

          <div className="flex flex-wrap gap-3 pt-2">
            <a
              href="/services"
              className="bg-white text-black px-5 py-2.5 rounded-md font-semibold hover:bg-gray-200 transition"
            >
              Our Services
            </a>

            <a
              href="/contact"
              className="border border-white text-black px-5 py-2.5 rounded-md hover:bg-white/20 transition"
            >
              Book Consultation
            </a>
          </div>
        </div>

        <h1
          className="font-bold text-[--light-primary-color] leading-none
          text-8xl lg:text-9xl mx-1 
          tracking-tight
          hidden sm:block"
        >
          TEAM CA
        </h1>
      </div>
    </section>
  );
};

export default HomeHero;
