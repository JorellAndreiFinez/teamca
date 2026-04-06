import SectionHeader from "@/components/header/SectionHeader";
import Button from "@/components/ui/Button";
import React from "react";

const CTA: React.FC = () => {
  return (
    <section className="relative w-full min-h-[60vh] text-white bg-[--dark-primary-2] px-6 py-16 overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src="/partials/layer-blur.png"
          alt="background"
          className="w-full h-full object-cover"
        />
      </div>
      <div className="max-w-5xl mx-auto">
        <SectionHeader
          title="Secure Your Future Today"
          description="Don't leave your family's future to chance. Take action now and build the secure, prosperous life you deserve."
          align="center"
          color="yellow"
          size="xl"
        />
        <div className="flex flex-col sm:flex-row justify-center gap-4 mt-24">
          <Button
            variant="secondary"
            className="flex items-center gap-2 backdrop-blur-md "
          >
            Book Consultation
          </Button>
          <Button
            variant="default"
            className="flex items-center gap-2 backdrop-blur-md "
          >
            Apply Now
          </Button>
        </div>
      </div>
    </section>
  );
};

export default CTA;
