import React, { useState } from "react";
import MobileMenu from "./MobileMenu";
import "../../styles/global.css";

const Navbar: React.FC = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  const links = ["Home", "About", "Careers", "Services", "Contact"];

  return (
    <div className="fixed top-0 left-0 w-full z-50">
      <svg
        className="absolute inset-0 w-full h-full -z-10"
        width="1440"
        height="720"
        viewBox="0 0 1440 720"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path stroke="#1D293D" strokeOpacity=".7" d="M-15.227 702.342H1439.7" />
        <circle
          cx="711.819"
          cy="372.562"
          r="308.334"
          stroke="#1D293D"
          strokeOpacity=".7"
        />
        <circle
          cx="16.942"
          cy="20.834"
          r="308.334"
          stroke="#1D293D"
          strokeOpacity=".7"
        />
        <path
          stroke="#1D293D"
          strokeOpacity=".7"
          d="M-15.227 573.66H1439.7M-15.227 164.029H1439.7"
        />
        <circle
          cx="782.595"
          cy="411.166"
          r="308.334"
          stroke="#1D293D"
          strokeOpacity=".7"
        />
      </svg>

      <nav className="flex items-center justify-between w-full py-4 px-6 md:px-16 lg:px-24 xl:px-32 bg-white/90 z-99 text-sm">
        <a href="/" className="flex items-center space-x-3">
          <img
            src="/icons/teamca-white-circle-logo.png"
            alt="Team CA Logo"
            className="w-10 h-10 object-cover"
          />
          <span className="text-2xl font-extrabold tracking-wide">TEAM CA</span>
        </a>

        <div className="hidden md:flex items-center gap-8">
          {links.map((link) => (
            <a
              key={link}
              href={`/${link.toLowerCase()}`}
              className="transition"
            >
              {link}
            </a>
          ))}
        </div>

        <button className="hidden md:block px-6 py-2.5 text-black bg-white hover:bg-slate-200 active:scale-95 transition-all rounded-full">
          Login
        </button>

        <button
          id="open-menu"
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

      {menuOpen && <MobileMenu closeMenu={() => setMenuOpen(false)} />}
    </div>
  );
};

export default Navbar;
