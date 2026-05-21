import React, { useEffect, useRef } from "react";
import Button from "@/components/ui/Button";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const HomeHero: React.FC = () => {
  const textRef = useRef<HTMLDivElement>(null);
  const posterRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLDivElement>(null);
  const popImageRef = useRef<HTMLDivElement>(null);
  const bottomImageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!textRef.current || !posterRef.current || !sectionRef.current) return;

    const poster = posterRef.current;
    const posterImg = poster.querySelector("img");
    const bottomImg = bottomImageRef.current;

    // Hero text animation
    gsap.fromTo(
      textRef.current,
      { y: 50, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.8,
        ease: "power3.out",
        scrollTrigger: {
          trigger: textRef.current,
          start: "top 80%",
          toggleActions: "play reverse play reverse",
        },
      },
    );

    // Poster animation
    gsap.set(poster, { yPercent: 800, opacity: 0 });
    if (posterImg)
      gsap.set(posterImg, {
        scale: 1.6,
        willChange: "transform",
        force3D: true,
      });

    gsap.to(poster, {
      yPercent: 0,
      opacity: 1,
      ease: "power3.out",
      scrollTrigger: {
        trigger: textRef.current,
        start: "top bottom",
        end: "bottom top",
        scrub: 1,
      },
    });

    if (posterImg) {
      gsap.to(posterImg, {
        scale: 1,
        ease: "none",
        scrollTrigger: {
          trigger: textRef.current,
          start: "top bottom",
          end: "bottom top",
          scrub: 1,
        },
      });
    }

    // Poster stops above bottom image
    if (poster && bottomImg) {
      ScrollTrigger.create({
        trigger: sectionRef.current,
        start: () =>
          `top+=${textRef.current!.offsetTop + textRef.current!.offsetHeight} bottom`,
        end: "bottom bottom",
        onUpdate: (self) => {
          const bottomImageHeight = bottomImg.offsetHeight;
          if (self.progress >= 1) {
            poster.style.position = "absolute";
            poster.style.bottom = `${bottomImageHeight}px`;
          } else {
            poster.style.position = "fixed";
            poster.style.bottom = "0px";
          }
        },
        scrub: true,
      });
    }

    // Pop-in image animation
    if (popImageRef.current) {
      const pop = popImageRef.current;
      const sectionHeight = sectionRef.current.offsetHeight;

      gsap.set(pop, {
        y: sectionHeight,
        opacity: 1,
        position: "absolute",
        left: "50%",
        xPercent: -50,
        zIndex: 5,
        width: "100%",
      });

      gsap.to(pop, {
        y: -pop.offsetHeight,
        ease: "none",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top bottom",
          end: "bottom top",
          scrub: true,
        },
      });
    }

    // Bottom full-width image animation
    if (bottomImg) {
      const sectionHeight = sectionRef.current.offsetHeight;
      gsap.set(bottomImg, {
        y: sectionHeight + 200,
        opacity: 1,
        position: "absolute",
        left: 0,
        width: "100%",
        zIndex: 4,
      });

      gsap.to(bottomImg, {
        y: 0,
        ease: "power3.out",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top bottom",
          end: "bottom bottom",
          scrub: 1,
        },
      });
    }
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative w-full min-h-[190vh] sm:min-h-[220vh] lg:min-h-[250vh] overflow-hidden"
    >
      <img
        src="/partials/circle-gradient-shade.png"
        className="absolute inset-0 w-full h-full object-cover z-0"
      />

      {/* Hero text */}
      <div
        ref={textRef}
        className="absolute top-28 xs:top-32 sm:top-40 md:top-52 lg:top-60 left-4 xs:left-5 sm:left-8 md:left-24 lg:left-32 right-4 max-w-5xl text-left z-20"
      >
        <h1 className="text-[2.35rem] xs:text-[2.65rem] sm:text-5xl md:text-6xl lg:text-7xl font-heading text-white mb-4 leading-[1.04]">
          At Pru Life UK, we believe that every life is insurable.
        </h1>
        <p className="text-white/90 text-base xs:text-lg sm:text-xl md:text-2xl mb-6 max-w-lg">
          Because love means preparing for their future, no matter what.
        </p>
        <Button variant="default" className="flex items-center gap-2">
          Learn More
        </Button>
      </div>

      {/* Pop-in Image */}
      <div
        ref={popImageRef}
        className="absolute left-1/2 -translate-x-1/2 z-5 w-full"
      >
        <img
          src="/partials/pru-black-agency.png"
          alt="Pop In"
          className="w-full h-auto object-cover"
        />
      </div>

      {/* Poster */}
      <div
        ref={posterRef}
        className="w-full flex justify-center z-10 absolute left-1/2 -translate-x-1/2"
      >
        <img
          src="/partials/team-poster.png"
          alt="Team Poster"
          className="h-full w-full min-w-[620px] sm:min-w-0 object-contain"
        />
      </div>

      {/* Bottom full-width image */}
      <div ref={bottomImageRef} className="absolute bottom-0 left-0 w-full z-4">
        <img
          src="/partials/pru-gallery.png"
          alt="Bottom Banner"
          className="w-full h-auto object-cover"
        />
      </div>
    </section>
  );
};

export default HomeHero;
