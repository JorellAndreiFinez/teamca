// website\src\components\navbar\Navbar.tsx

import React, { useState } from "react";
import Button from "../ui/Button";
import MobileMenu from "./MobileMenu";
import "../../styles/global.css";
import { File, LogIn } from "lucide-react";

const Navbar: React.FC = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const links = ["Home", "About", "Services", "Careers"];

  return (
    <div className="fixed top-0 left-0 w-full z-50">
      <nav className="flex items-center justify-between w-full py-4 px-6 md:px-16 lg:px-24 xl:px-32 backdrop-blur-md border-b border-[--br-color-default] text-black">
        <a href="/" className="flex items-center space-x-3">
          <img
            src="/icons/teamca-transparent-logo-1.png"
            alt="Team CA Logo"
            className="w-10 h-10 object-cover"
          />
        </a>

        <div className="hidden md:flex gap-12 justify-center flex-1">
          {links.map((link) => (
            <a
              key={link}
              href={`/${link.toLowerCase()}`}
              className="text-sm font-medium transition hover:text-primary-color"
            >
              {link}
            </a>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-4">
          <Button
            variant="secondary"
            className="flex items-center gap-2 backdrop-blur-md "
          >
            <File className="w-4 h-4" />
            Application Guideline
          </Button>

          <Button variant="default" className="flex items-center gap-2">
            <LogIn className="w-4 h-4" />
            Login
          </Button>
        </div>

        <button
          className="md:hidden active:scale-90 transition"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="26"
            height="26"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M4 5h16" />
            <path d="M4 12h16" />
            <path d="M4 19h16" />
          </svg>
        </button>
      </nav>
    </div>
  );
};

export default Navbar;
