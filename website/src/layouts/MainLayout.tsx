import React from "react";
import { Helmet } from "react-helmet";
import Navbar from "../components/navbar/Navbar";
import Footer from "../components/footer/Footer";

interface LayoutProps {
  children: React.ReactNode;
}

const MainLayout = ({ children }: LayoutProps) => {
  return (
    <div className="flex flex-col min-h-screen">
      <Helmet>
        <link
          rel="icon"
          type="image/png"
          href="/icons/teamca-white-circle-logo.png"
        />
      </Helmet>

      <Navbar />

      {/* FIX HERE */}
      <main className="flex flex-col flex-grow">{children}</main>

      <Footer />
    </div>
  );
};

export default MainLayout;
