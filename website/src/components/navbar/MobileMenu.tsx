import React from "react";

const MobileMenu: React.FC = () => {
  return (
    <div className="md:hidden flex flex-col bg-black px-6 py-4 space-y-3">
      <a href="/">Home</a>
      <a href="/about">About</a>
      <a href="/accomplishments">Accomplishments</a>
      <a href="/careers">Careers</a>
      <a href="/services">Services</a>
      <a href="/contact">Contact</a>
    </div>
  );
};

export default MobileMenu;