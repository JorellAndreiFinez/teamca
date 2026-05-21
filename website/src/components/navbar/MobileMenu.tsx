import React from "react";

interface MobileMenuProps {
  closeMenu?: () => void;
}

const MobileMenu: React.FC<MobileMenuProps> = ({ closeMenu }) => {
  return (
    <div className="md:hidden flex flex-col bg-black px-6 py-4 space-y-3">
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
