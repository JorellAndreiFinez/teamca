import React from "react";

const Footer: React.FC = () => {
  return (
    <div className="bg-[--dark-primary]">
      <footer className="bg-[--primary-color] text-gray-200 rounded-t-2xl overflow-hidden shadow-2xl mx-auto max-w-7xl">
        <div className="px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8">
            {/* Column 1 */}
            <div className="lg:col-span-4 flex flex-col">
              <div className="flex items-center mb-4">
                <img
                  src="/icons/teamca-transparent-logo-1.png"
                  alt="Team CA Logo"
                  className="w-12 h-12 mr-3 rounded-full"
                />
                <h3 className="text-xl font-semibold text-[--white-color]">
                  Team CA
                </h3>
              </div>
              <p className="text-[--white-color] text-sm">
                Protecting families and securing futures through professional
                life insurance and financial planning services.
              </p>
            </div>

            {/* Services */}
            <div className="lg:col-span-2">
              <h3 className="text-xl font-semibold mb-4 text-[--white-color]">
                Services
              </h3>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li>
                  <a href="#" className="hover:text-white">
                    Life Insurance
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Financial Planning
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Investment Advice
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Retirement Planning
                  </a>
                </li>
              </ul>
            </div>

            {/* Company */}
            <div className="lg:col-span-3">
              <h3 className="text-xl font-semibold mb-4 text-[--white-color]">
                Company
              </h3>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li>
                  <a href="#" className="hover:text-white">
                    About Us
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Careers
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Press
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Contact
                  </a>
                </li>
              </ul>
            </div>

            {/* Resources */}
            <div className="lg:col-span-3">
              <h3 className="text-xl font-semibold mb-4 text-[--white-color]">
                Resources
              </h3>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li>
                  <a href="#" className="hover:text-white">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Help Center
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Guides
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Privacy Policy
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom */}
          <div className="mt-12 border-t border-gray-700 pt-6 flex flex-col md:flex-row justify-between items-center text-gray-400 text-sm">
            <p>
              &copy; {new Date().getFullYear()} Team CA. All rights reserved.
            </p>

            {/* Socials */}
            <div className="flex space-x-3 mt-4 md:mt-0">
              {["facebook", "tiktok", "instagram", "linkedin"].map((_, i) => (
                <a
                  key={i}
                  href="#"
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition"
                >
                  <span className="text-white text-sm">•</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>

      {/* GOOGLE MAPS FULL WIDTH SECTION */}
      <div className="w-full">
        <iframe
          title="Google Map"
          src="https://www.google.com/maps?q=Quezon+City,+Philippines&output=embed"
          className="w-full h-[350px] border-0"
          loading="lazy"
        ></iframe>
      </div>
    </div>
  );
};

export default Footer;
