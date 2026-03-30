import SectionHeader from "../../header/SectionHeader";

export default function WhoWeAre() {
  return (
    <section className="relative w-full min-h-[50vh] text-white bg-[--dark-primary] px-6 py-16 overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src="/partials/layer-blur.png" // replace with your image
          alt="background"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* 1st Column */}
        <div className="flex flex-col ">
          <div>
            <h1 className="text-5xl md:text-7xl font-bold">What is TEAM CA?</h1>
          </div>

          <div className="flex-grow" />

          <div>
            <button className="px-6 py-3 bg-white text-black font-semibold rounded-xl hover:bg-gray-200 transition">
              Learn More
            </button>
          </div>
        </div>

        {/* 2nd Column */}
        <div className="flex flex-col">
          <p className="text-xl sm:text-2xl text-gray-300 leading-relaxed max-w-xl">
            TEAM CA is part of the Black Orcas Summit Life Insurance Agency,
            providing professional opportunities for interns and financial
            advisors under Pru Life UK Philippines.
          </p>
          <br />
          <p className="text-xl sm:text-2xl text-gray-300 leading-relaxed max-w-xl">
            Pru Life UK is one of the leading life insurance companies in the
            Philippines, with 22 years of excellence in providing relevant and
            innovative life insurance products designed to meet the specific
            needs of the public.
          </p>
        </div>
      </div>
    </section>
  );
}
