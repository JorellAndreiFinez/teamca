import React, { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import SectionHeader from "@/components/header/SectionHeader";

const testimonialsData = [
  {
    image: "https://randomuser.me/api/portraits/women/1.jpg",
    message: "This product transformed our workflow completely!",
    name: "Jane Doe",
    location: "New York, USA",
    label: "Highly Recommended",
  },
  {
    image: "https://randomuser.me/api/portraits/men/2.jpg",
    message: "Amazing experience with the team, very professional.",
    name: "John Smith",
    location: "London, UK",
    label: "Professional Service",
  },
  {
    image: "https://randomuser.me/api/portraits/women/3.jpg",
    message: "Helped our business grow 3x in 6 months!",
    name: "Alice Johnson",
    location: "Sydney, Australia",
    label: "Growth Partner",
  },
  {
    image: "https://randomuser.me/api/portraits/men/4.jpg",
    message: "The support is unmatched and super friendly.",
    name: "Bob Brown",
    location: "Toronto, Canada",
    label: "Excellent Support",
  },
  {
    image: "https://randomuser.me/api/portraits/women/5.jpg",
    message: "Highly intuitive design and seamless experience.",
    name: "Clara Lee",
    location: "San Francisco, USA",
    label: "User Friendly",
  },
  {
    image: "https://randomuser.me/api/portraits/men/6.jpg",
    message: "Our clients love the results we delivered using this.",
    name: "David Kim",
    location: "Seoul, South Korea",
    label: "Client Favorite",
  },
];

const Testimonials = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  // Group 3 testimonials per slide
  const slides = [];
  for (let i = 0; i < testimonialsData.length; i += 3) {
    slides.push(testimonialsData.slice(i, i + 3));
  }

  const handlePrev = () => {
    setCurrentSlide((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="w-full max-w-4xl mx-auto py-12 px-4 overflow-hidden">
      <SectionHeader
        title="What Our Clients Say"
        align="center"
        color="yellow"
      />

      {/* Carousel */}
      <div className="overflow-hidden">
        {slides.map((slide, index) => (
          <div
            key={index}
            className={`flex flex-col md:flex-row gap-5 md:gap-6 transition-transform duration-500 ${
              index === currentSlide ? "flex" : "hidden"
            }`}
          >
            {slide.map((testimonial, i) => (
              <div
                key={i}
                style={{ background: "var(--br-color-card)" }}
                className="flex-1 w-full md:w-1/3 rounded-2xl p-[3px]"
              >
                <div
                  style={{ background: "var(--card-bg-color-primary)" }}
                  className="h-full w-full rounded-2xl backdrop-blur-lg p-5 sm:p-7 lg:p-9 shadow-lg flex flex-col items-start text-left"
                >
                  <img
                    src={testimonial.image}
                    alt={testimonial.name}
                    className="w-20 h-20 rounded-full mb-4 object-cover border-2 border-white"
                  />
                  <p className="text-gray-800 mb-4">{testimonial.message}</p>
                  <hr className="w-1/2 border-gray-300 mb-4" />
                  <h3 className="font-semibold">{testimonial.name}</h3>
                  <span className="text-sm text-gray-600">
                    {testimonial.location}
                  </span>
                  <span className="mt-2 inline-block bg-[var(--secondary-color)] text-[var(--primary-color)] text-xs px-3 py-1 rounded font-semibold uppercase border-solid border-[3px] border-[var(--br-color-default)] w-full">
                    {testimonial.label}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      <div className="flex justify-center items-center mt-6 space-x-4">
        <button
          onClick={handlePrev}
          className="p-2 bg-gray-200 rounded-full hover:bg-gray-300"
        >
          <ChevronLeft className="w-5 h-5 text-gray-700" />
        </button>

        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`rounded-full transition-all duration-300 ${
              currentSlide === index
                ? "w-12 h-3 bg-[--secondary-color]"
                : "w-3 h-3 bg-[--pagination-color]"
            }`}
          />
        ))}

        <button
          onClick={handleNext}
          className="p-2 bg-gray-200 rounded-full hover:bg-gray-300"
        >
          <ChevronRight className="w-5 h-5 text-gray-700" />
        </button>
      </div>
    </div>
  );
};

export default Testimonials;
