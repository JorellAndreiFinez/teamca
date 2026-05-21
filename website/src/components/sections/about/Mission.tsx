import SectionHeader from "@/components/header/SectionHeader";

export default function Mission() {
  return (
    <section className="relative w-full min-h-[60vh] text-white bg-[--dark-primary] px-4 sm:px-6 py-14 sm:py-16 overflow-hidden">
      <div className="absolute inset-0">
        <img
          src="/partials/layer-blur.png"
          alt="background"
          className="w-full h-full object-cover"
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">
        <SectionHeader
          title="What is TEAM CA?"
          description="To nurture future financial professionals while empowering Filipino families through education, protection, and long-term financial planning."
          align="center"
          size="xl"
          color="yellow"
        />

        <div className="mt-12 flex justify-center">
          <img
            src="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1400&q=80"
            alt="Team collaboration sample"
            className="w-full max-w-5xl h-[260px] sm:h-[340px] md:h-[420px] object-cover rounded-2xl shadow-lg"
          />
        </div>
      </div>
    </section>
  );
}
