import SectionHeader from "../../header/SectionHeader";

export default function WhoWeAre() {
  return (
    <section className="relative w-full min-h-[50vh] text-white bg-[--dark-primary] px-4 sm:px-6 py-14 sm:py-16 overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src="/partials/layer-blur.png"
          alt="background"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Top Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10">
          {/* 1st Column */}
          <div className="flex flex-col">
            <div>
              <h1 className="text-4xl xs:text-5xl md:text-7xl font-bold leading-tight">
                What is TEAM CA?
              </h1>
            </div>

            <div className="flex-grow" />

            <div className="mt-8 md:mt-0">
              <button className="px-6 py-3 bg-white text-black font-semibold rounded-xl hover:bg-gray-200 transition">
                Learn More
              </button>
            </div>
          </div>

          {/* 2nd Column */}
          <div className="flex flex-col">
            <p className="text-base xs:text-lg sm:text-xl lg:text-2xl text-gray-300 leading-relaxed max-w-xl">
              TEAM CA is part of the Black Orcas Summit Life Insurance Agency,
              providing professional opportunities for interns and financial
              advisors under Pru Life UK Philippines.
            </p>
            <br />
            <p className="text-base xs:text-lg sm:text-xl lg:text-2xl text-gray-300 leading-relaxed max-w-xl">
              Pru Life UK is one of the leading life insurance companies in the
              Philippines, with 22 years of excellence in providing relevant and
              innovative life insurance products designed to meet the specific
              needs of the public.
            </p>
          </div>
        </div>

        {/* Affiliations Card (Full Width) */}
        <div className="mt-16 w-full">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 xs:p-6 md:p-8 border border-white/20 shadow-lg">
            <div className="mb-8 flex flex-col gap-2">
              <h2 className="text-base md:text-lg font-semibold text-[--affliation-text] uppercase">
                Affiliations
              </h2>
              <div className="w-full h-0.5 bg-white rounded-full opacity-20" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 items-center justify-items-center">
              <img
                src="/images/home/pru-life.png"
                alt="Affiliation 1"
                className="h-16 xs:h-20 sm:h-24 object-contain"
              />
              <img
                src="/images/home/black-orca.png"
                alt="Affiliation 2"
                className="h-16 xs:h-20 sm:h-24 object-contain"
              />
              <img
                src="/icons/teamca-transparent-logo-1.png"
                alt="Affiliation 3"
                className="h-24 xs:h-32 sm:h-40 object-contain"
              />
              <img
                src="/images/home/maperaang-pilipino.png"
                alt="Affiliation 4"
                className="h-24 xs:h-32 sm:h-40 object-contain"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
