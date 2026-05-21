import SectionHeader from "@/components/header/SectionHeader";

export default function Founder() {
  return (
    <section className="relative w-full min-h-[60vh] text-white px-6 py-16 overflow-hidden">
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
          align="center"
          containerSize="sm"
          size="xl"
          titleParts={[
            { text: "Meet the one who ", color: "yellow" },
            { text: "started it all", color: "white" },
          ]}
        />
      </div>
      <div className="flex justify-center mt-6">
        <div
          style={{
            background: "var(--btn-default)",
            color: "var(--primary-color)",
            textTransform: "uppercase",
            border: "3px solid var(--br-color-default)",
          }}
          className="px-6 py-2 rounded-sm text-sm font-semibold tracking-wider transition-all duration-300 hover:brightness-110"
        >
          Founder of Team CA
        </div>
      </div>

      <div className="mt-4 max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-5 gap-10 items-center">
        <div className="md:col-span-2 flex justify-center md:justify-end">
          <img
            src="/images/about/founder.png"
            alt="Founder"
            className="w-full max-w-sm h-full object-cover"
          />
        </div>

        <div className="md:col-span-3 flex flex-col justify-center text-center md:text-left">
          <h2 className="text-2xl md:text-4xl font-bold text-[--secondary-color]">
            Ms. Christelle Ann de Leon
          </h2>

          <h3 className="text-sm md:text-base text-[--secondary-color] mb-4 font-light">
            Bachelor of Arts in Theater Arts <br /> Major in Direction and
            Performance
          </h3>

          <div className="text-white/70 text-sm md:text-base leading-relaxed max-w-2xl space-y-4">
            <p>
              Christelle’s world revolved around the stage – she worked as a
              production manager, costume designer, performer, and ran her own
              events business. Creativity and color were at the heart of
              everything she did.
            </p>

            <p>
              But when the 2020 pandemic shut down the entertainment industry,
              she needed a new path. She wanted flexible work that wouldn’t dim
              her artistic spirit.
            </p>

            <p>
              Scrolling through Facebook, she saw a post from an old classmate
              featuring a bright, eye-catching keyboard, plus awards and a trip
              to Sydney. That vibrant image was exactly what she’d been
              searching for!
            </p>

            <p>
              Now a mom of two, Christelle thrives with Pru Life UK. She loves
              their focus on financial education, great training, and growth.
              Her passion for art lives on as she helps protect Filipino
              families and build brighter futures.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
