import SectionHeader from "@/components/header/SectionHeader";

export default function Recognition() {
  const awards = [
    {
      date: "2021",
      title: "Top 1 Rookie of the Year (Unit)",
      description: null,
    },
    {
      date: "2022",
      title: "Promoted to Associate Unit Manager",
      description: null,
    },
    {
      date: "2023",
      title: "Top 1 Business Builder of the Year (Unit)",
      description: null,
    },
    {
      date: "2021 - 2025",
      title: "Consistent Early Achiever Club Qualifier",
      description: "(Belongs to Top 10% of Financial Advisors Nationwide)",
    },
    {
      date: "2022 - 2025",
      title: "Consistent Million Producers Club Qualifier",
      description: null,
    },

    {
      date: "2025",
      title: "Promoted as Junior Unit Manager",
      description: null,
    },
  ];
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
          title="Awards & Recognition"
          align="center"
          containerSize="sm"
          size="xl"
        />
      </div>

      <div className="mt-14 max-w-5xl mx-auto">
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 md:p-10 shadow-lg">
          {/* TIMELINE */}
          <div className="space-y-8 relative">
            {/* vertical line */}
            <div className="absolute left-3 top-0 bottom-0 w-px bg-white/20" />

            {awards.map((item, index) => (
              <div key={index} className="relative pl-10">
                {/* dot */}
                <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-white/20 border border-white/40" />

                {/* date */}
                <p className="text-2xl sm:text-xl font-bold text-[--secondary-color]  mb-1">
                  {item.date}
                </p>

                {/* title */}
                <h3 className="text-xl font-semibold mb-2">{item.title}</h3>

                {/* description (nullable safe) */}
                {item.description && (
                  <p className="text-white/70 text-sm md:text-base">
                    {item.description}
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* OVERALL DESCRIPTION (NEW) */}
          <div className="mt-10 pt-6 border-t border-white/10 ">
            <p className="text-[--secondary-color] text-base md:text-xl mx-auto leading-relaxed">
              With International Recognitions in Malaysia, South Korea and New
              Zealand <br /> Managing 260+ Clients, 15 Licensed Financial
              Advisors all over the Philippines and counting <br /> Managing
              400M worth of Claims and Counting
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
