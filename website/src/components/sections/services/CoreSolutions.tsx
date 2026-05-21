import SectionHeader from "@/components/header/SectionHeader";

import Button from "@/components/ui/Button";

export default function CoreSolutions() {
  const solutions = [
    {
      title: "Life Protection Plans",
      description:
        "Secure your family's future with tailored life insurance solutions.",
      image:
        "https://images.unsplash.com/photo-1551836022-deb4988cc6c0?auto=format&fit=crop&w=1200&q=80",
    },
    {
      title: "Investment Plans",
      description:
        "Grow your wealth with smart and diversified investment options.",
      image:
        "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=1200&q=80",
    },
    {
      title: "Education Savings",
      description:
        "Prepare for your child’s future with structured savings plans.",
      image:
        "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=1200&q=80",
    },
    {
      title: "Health Protection",
      description: "Comprehensive coverage for medical and emergency needs.",
      image:
        "https://images.unsplash.com/photo-1580281657527-47f249e8f5c4?auto=format&fit=crop&w=1200&q=80",
    },
    {
      title: "Retirement Planning",
      description:
        "Secure your future with long-term retirement financial strategies.",
      image:
        "https://images.unsplash.com/photo-1508385082359-f38ae991e8f2?auto=format&fit=crop&w=1200&q=80",
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
          title="Core Financial Solutions"
          description="Explore our suite of financial services designed to meet your unique needs at every stage of life."
          align="center"
          size="xl"
          containerSize="sm"
          color="yellow"
        />

        {/* GRID */}
        <div className="mt-12 flex justify-center">
          <div className="grid grid-cols-2 gap-4 w-full max-w-3xl">
            {solutions.map((item, index) => {
              const isLastOdd =
                solutions.length % 2 === 1 && index === solutions.length - 1;

              return (
                <div
                  key={index}
                  className={`
                    relative rounded-2xl overflow-hidden group shadow-lg
                    ${isLastOdd ? "col-span-2 h-[250px]" : "aspect-square"}
                  `}
                >
                  {/* IMAGE */}
                  <img
                    src={item.image}
                    alt={item.title}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />

                  {/* GRADIENT */}
                  <img
                    src="/images/services/gradient.png"
                    alt="overlay"
                    className="absolute bottom-0 left-0 w-full h-full object-cover opacity-95"
                  />

                  {/* TEXT */}
                  <div className="absolute bottom-0 left-0 w-full p-5 z-10 flex flex-col gap-2">
                    <h3 className="text-base md:text-lg font-semibold">
                      {item.title}
                    </h3>

                    <p className="text-white/70 text-sm line-clamp-2">
                      {item.description}
                    </p>

                    {/* BUTTON */}
                    <div className="mt-3">
                      <Button variant="default" className="px-4 py-2 text-sm">
                        Learn More
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
