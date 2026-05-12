import React, { useEffect, useRef } from "react";
import Button from "../ui/Button";
import { File } from "lucide-react";
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
      className="relative w-full min-h-[250vh] overflow-hidden"
    >
      <img
        src="/partials/circle-gradient-shade.png"
        className="absolute inset-0 w-full h-full object-cover z-0"
      />

      <div
        ref={textRef}
        className="absolute top-60 left-12 md:left-24 lg:left-32 max-w-5xl text-left z-20"
      >
        <h1 className="text-6xl md:text-7xl font-heading text-white mb-4">
          Services for Your Future
        </h1>
        <p className="text-white/90 text-xl md:text-2xl mb-6 max-w-3xl">
          From life insurance to retirement planning, we provide personalized
          solutions to help you achieve your financial goals and protect what
          matters most.
        </p>
        <Button variant="default" className="flex items-center gap-2">
          <File className="w-4 h-4" />
          BOOK CONSULTATION
        </Button>
      </div>
    </section>
  );
};

export default HomeHero;
