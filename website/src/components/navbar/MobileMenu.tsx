import React from "react";
import { config } from "@/config/env";

interface MobileMenuProps {
  closeMenu?: () => void;
}

const MobileMenu: React.FC<MobileMenuProps> = ({ closeMenu }) => {
  const links = [
    { label: "Home", href: "/" },
    { label: "About", href: "/about" },
    { label: "Accomplishments", href: "/accomplishments" },
    { label: "Careers", href: "/careers" },
    { label: "Services", href: "/services" },
    { label: "Contact", href: "/contact" },
  ];

  return (
    <div className="md:hidden border-b border-[--br-color-default] bg-[--dark-primary]/95 px-4 py-4 shadow-2xl backdrop-blur-xl">
      <div className="rounded-xl border border-white/10 bg-white/[0.04] p-2">
        <div className="grid gap-1">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={closeMenu}
              className="rounded-lg px-4 py-3 text-sm font-medium uppercase tracking-wide text-white/85 transition hover:bg-white/10 hover:text-white"
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="mt-3 border-t border-white/10 pt-3">
          <a
            href={config.frontendUrl}
            onClick={closeMenu}
            className="flex w-full items-center justify-center rounded-lg border-2 border-[--br-color-default] px-4 py-3 text-sm font-bold uppercase tracking-wide text-[--primary-color] transition hover:brightness-110"
            style={{ background: "var(--btn-default)" }}
          >
            Login
          </a>
        </div>
      </div>
    </div>
  );
};

export default MobileMenu;
