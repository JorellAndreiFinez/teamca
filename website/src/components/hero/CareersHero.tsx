import React, { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Button from "@/components/ui/Button";

gsap.registerPlugin(ScrollTrigger);

const CareersHero: React.FC = () => {
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
      className="relative w-full min-h-[60vh] overflow-hidden"
    >
      <img
        src="/partials/circle-gradient-shade.png"
        className="absolute inset-0 w-full h-full object-cover z-0"
      />

      <div
        ref={textRef}
        className="absolute top-40 left-12 md:left-24 lg:left-32 max-w-5xl text-left z-20"
      >
        <h1 className="text-6xl md:text-7xl font-heading text-white mb-4">
          Application Process
        </h1>
        <p className="text-white/90 text-lg md:text-xl mb-12 max-w-3xl">
          We believe our people are our greatest strength. Build a
          purpose-driven career where you help others secure their future, while
          growing your own.
        </p>
        <Button variant="default" className="flex items-center gap-2">
          Apply Now
        </Button>
      </div>
    </section>
  );
};

export default CareersHero;
