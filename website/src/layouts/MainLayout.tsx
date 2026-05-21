import React, { useEffect } from "react";
import { Helmet } from "react-helmet";
import Navbar from "@/components/navbar/Navbar";
import Footer from "@/components/footer/Footer";

interface LayoutProps {
  children: React.ReactNode;
}

const MainLayout = ({ children }: LayoutProps) => {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    }
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      <Helmet>
        <meta name="theme-color" content="#ac1212" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="Team CA" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
        <link rel="manifest" href="/manifest.webmanifest" />
        <link
          rel="apple-touch-icon"
          href="/icons/teamca-white-circle-logo.png"
        />
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
