import React from "react";
import SectionHeader from "../../header/SectionHeader";

// Dummy Data
const testimonialData = [
  {
    name: "Alice Johnson",
    role: "CEO, TechCorp",
    avatar: "https://placehold.co/48x48?text=A",
    quote: "This platform transformed the way we manage our finances!",
  },
  {
    name: "Mark Lee",
    role: "CFO, FinSolutions",
    quote: "A must-have tool for any finance professional.",
  },
  {
    name: "Sophia Kim",
    role: "Entrepreneur",
    avatar: "https://placehold.co/48x48?text=S",
    quote: "User-friendly and highly effective.",
  },
];

type Testimonial = {
  name: string;
  role: string;
  avatar?: string;
  quote: string;
};

type TestimonialsProps = {
  subtitle: string;
  title: string;
  testimonials?: Testimonial[];
};

const Testimonials = () => {
  return (
    <section className="relative py-32">
      <div className="absolute inset-0 bg-[url('https://upload.wikimedia.org/wikipedia/commons/6/65/Map_of_the_Philippines.svg')] bg-cover bg-[center_0%] opacity-20 backdrop-blur-xl"></div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center z-20">
        <SectionHeader
          subtitle="Testimonials"
          title="Partner with Us"
          align="center"
          size="lg"
        />

        <div className="mt-[15rem]"></div>
        <div className="flex flex-wrap justify-center gap-6 ">
          {testimonialData.map((testimonial, idx) => (
            <div
              key={idx}
              className="bg-[--secondary-color] p-6 rounded-xl shadow-lg w-80 hover:shadow-xl transition-shadow duration-300"
            >
              <p className="text-gray-600 mb-4">"{testimonial.quote}"</p>

              <div className="flex items-center gap-4">
                <img
                  src={
                    testimonial.avatar ||
                    "https://placehold.co/48x48?text=Avatar"
                  }
                  alt={testimonial.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div className="text-left">
                  <h4 className="text-gray-900 font-semibold">
                    {testimonial.name}
                  </h4>
                  <p className="text-gray-500 text-sm">{testimonial.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
