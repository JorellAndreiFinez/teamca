import { useState, useRef, useEffect } from "react";
import SectionHeader from "../../header/SectionHeader";

const teamData = [
  {
    title: "Ms. Christelle Ann",
    description:
      "Ms. Christelle Ann provides leadership and strategic direction for Team CA, ensuring the organization continues to grow and innovate.",
    images: [
      "https://placehold.co/800x500?text=Christelle+1",
      "https://placehold.co/800x500?text=Christelle+2",
      "https://placehold.co/800x500?text=Christelle+3",
    ],
  },
  {
    title: "Financial Advisors",
    description:
      "Our financial advisors guide the organization in maintaining sustainability and responsible financial planning.",
    images: [
      "https://placehold.co/800x500?text=Advisor+1",
      "https://placehold.co/800x500?text=Advisor+2",
      "https://placehold.co/800x500?text=Advisor+3",
    ],
  },
  {
    title: "Interns",
    description:
      "Our interns bring fresh ideas and support ongoing initiatives through collaboration, research, and development.",
    images: [
      "https://placehold.co/800x500?text=Intern+1",
      "https://placehold.co/800x500?text=Intern+2",
      "https://placehold.co/800x500?text=Intern+3",
    ],
  },
];

export default function WhoWeAre() {
  const [activeIndex, setActiveIndex] = useState(0);
  const galleryRef = useRef<HTMLDivElement>(null);

  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);

  // Scroll to the second image initially
  useEffect(() => {
    if (galleryRef.current) {
      const container = galleryRef.current;
      const children = container.children;
      if (children.length > 1) {
        const secondImage = children[1] as HTMLElement;
        container.scrollTo({
          left: secondImage.offsetLeft - container.clientWidth / 4,
        });
      }
    }
  }, [activeIndex]);

  const onMouseDown = (e: React.MouseEvent) => {
    if (!galleryRef.current) return;
    isDragging.current = true;
    startX.current = e.pageX - galleryRef.current.offsetLeft;
    scrollLeft.current = galleryRef.current.scrollLeft;
  };

  const onMouseLeave = () => (isDragging.current = false);
  const onMouseUp = () => (isDragging.current = false);
  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current || !galleryRef.current) return;
    e.preventDefault();
    const x = e.pageX - galleryRef.current.offsetLeft;
    const walk = (x - startX.current) * 2;
    galleryRef.current.scrollLeft = scrollLeft.current - walk;
  };

  const onTouchStart = (e: React.TouchEvent) => {
    if (!galleryRef.current) return;
    isDragging.current = true;
    startX.current = e.touches[0].pageX - galleryRef.current.offsetLeft;
    scrollLeft.current = galleryRef.current.scrollLeft;
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current || !galleryRef.current) return;
    const x = e.touches[0].pageX - galleryRef.current.offsetLeft;
    const walk = (x - startX.current) * 2;
    galleryRef.current.scrollLeft = scrollLeft.current - walk;
  };
  const onTouchEnd = () => (isDragging.current = false);

  return (
    <section className="py-24 px-6 md:px-12 lg:px-20">
      <div className="max-w-7xl mx-auto">
        <SectionHeader
          subtitle="About"
          title="Team CA"
          description="Team CA is composed of passionate professionals and interns working together to create innovative solutions. Through collaboration, mentorship, and expertise, the team continuously strives to deliver meaningful impact and growth."
          align="center"
          size="lg"
        />

        <div className="grid lg:grid-cols-2 gap-12 items-start mt-20">
          <div className="space-y-4">
            {teamData.map((item, index) => (
              <div
                key={index}
                className="border-b pb-4 cursor-pointer"
                onClick={() => setActiveIndex(index)}
              >
                <h3 className="text-xl font-semibold text-gray-900 flex justify-between">
                  {item.title}
                  <span>{activeIndex === index ? "-" : "+"}</span>
                </h3>
                {activeIndex === index && (
                  <p className="text-gray-600 mt-3">{item.description}</p>
                )}
              </div>
            ))}
          </div>

          <div
            ref={galleryRef}
            className="flex gap-6 overflow-x-hidden select-none cursor-grab"
            onMouseDown={onMouseDown}
            onMouseLeave={onMouseLeave}
            onMouseUp={onMouseUp}
            onMouseMove={onMouseMove}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            {teamData[activeIndex].images.map((img, idx) => (
              <div
                key={idx}
                className="flex-shrink-0 w-[85%] md:w-[75%] lg:w-[65%] rounded-xl overflow-hidden snap-center"
              >
                <img
                  src={img}
                  alt={`team-${idx}`}
                  className="w-full h-[420px] object-cover rounded-xl shadow-lg"
                  draggable={false}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
