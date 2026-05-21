import React, { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Button from "@/components/ui/Button";

gsap.registerPlugin(ScrollTrigger);

const ServicesHero: React.FC = () => {
  const textRef = useRef<HTMLDivElement>(null);
  const posterRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const textEl = textRef.current;
    const posterEl = posterRef.current;
    const sectionEl = sectionRef.current;

    if (!textEl || !posterEl || !sectionEl) return;

    const ctx = gsap.context(() => {
      // HERO TEXT
      gsap.from(textEl, {
        y: 60,
        opacity: 0,
        duration: 1,
        ease: "power3.out",
      });

      // TEAM SECTION
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: posterEl,
          start: "top 80%",
          toggleActions: "play reverse play reverse",
        },
      });

      tl.from(posterEl.querySelectorAll(".team-anim"), {
        y: 40,
        opacity: 0,
        scale: 0.98,
        stagger: 0.15,
        duration: 0.9,
        ease: "power3.out",
      });
    }, sectionEl);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative w-full min-h-[540px] sm:min-h-[60vh] overflow-hidden"
    >
      <img
        src="/partials/circle-gradient-shade.png"
        className="absolute inset-0 w-full h-full object-cover z-0"
      />

      <div
        ref={textRef}
        className="absolute top-28 sm:top-36 md:top-40 left-4 sm:left-8 md:left-24 lg:left-32 right-4 max-w-5xl text-left z-20"
      >
        <h1 className="text-[2.35rem] xs:text-5xl md:text-6xl lg:text-7xl font-heading text-white mb-4 leading-tight">
          Services for Your Future
        </h1>
        <p className="text-white/90 text-base sm:text-lg md:text-xl mb-8 sm:mb-12 max-w-3xl">
          From life insurance to retirement planning, we provide personalized
          solutions to help you achieve your financial goals and protect what
          matters most.
        </p>
        <Button variant="default" className="flex items-center gap-2">
          BOOK CONSULTATION
        </Button>
      </div>
    </section>
  );
};

export default ServicesHero;
