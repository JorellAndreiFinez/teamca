import React, { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const AboutHero: React.FC = () => {
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

      // TEAM POSTER
      gsap.from(posterEl.querySelectorAll(".team-anim"), {
        y: 40,
        opacity: 0,
        scale: 0.98,
        stagger: 0.15,
        duration: 0.9,
        ease: "power3.out",
        scrollTrigger: {
          trigger: posterEl,
          start: "top 85%",
          toggleActions: "play reverse play reverse",
        },
      });
    }, sectionEl);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative w-full min-h-screen overflow-hidden flex flex-col"
    >
      {/* BG */}
      <img
        src="/partials/circle-gradient-shade.png"
        className="absolute inset-0 w-full h-full object-cover z-0"
      />

      {/* CONTENT */}
      <div className="relative z-20 flex flex-col flex-1">
        {/* HERO TEXT */}
        <div
          ref={textRef}
          className="
            pt-32
            px-6
            md:px-12
            lg:px-24
            max-w-6xl
          "
        >
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-heading text-white mb-4 leading-tight">
            Meet the Team CA
          </h1>

          <p className="text-white/90 text-sm sm:text-base md:text-lg max-w-3xl">
            Team CA is a dynamic and purpose-driven group operating under the
            Black Orcas Summit Life Insurance Agency, proudly affiliated with
            Pru Life UK Philippines—one of the most trusted organizations in the
            life insurance industry.
          </p>
        </div>

        {/* PUSHES POSTER TO BOTTOM */}
        <div className="mt-auto">
          <div ref={posterRef} className="w-full flex justify-center">
            <div className="team-anim w-full">
              <img
                src="/partials/team-poster.png"
                alt="Team CA Poster"
                className="
                  w-full
                  object-contain
                  object-bottom
                "
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutHero;
