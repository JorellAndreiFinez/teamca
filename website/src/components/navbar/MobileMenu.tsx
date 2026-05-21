import React from "react";

interface MobileMenuProps {
  closeMenu?: () => void;
}

const MobileMenu: React.FC<MobileMenuProps> = ({ closeMenu }) => {
  return (
    <div className="md:hidden flex flex-col bg-[--dark-primary] px-5 py-4 space-y-3 border-b border-[--br-color-default] shadow-2xl">
      <a href="/" onClick={closeMenu}>
        Home
      </a>
      <a href="/about" onClick={closeMenu}>
        About
      </a>
      <a href="/accomplishments" onClick={closeMenu}>
        Accomplishments
      </a>
      <a href="/careers" onClick={closeMenu}>
        Careers
      </a>
      <a href="/services" onClick={closeMenu}>
        Services
      </a>
      <a href="/contact" onClick={closeMenu}>
        Contact
      </a>
    </div>
  );
};

export default MobileMenu;
