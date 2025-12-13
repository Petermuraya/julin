import { Helmet } from "react-helmet-async";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import About from "@/components/About";

const AboutPage = () => {
  return (
    <>
      <Helmet>
        <title>About — Julin Real Estate</title>
        <meta
          name="description"
          content="About Julin Real Estate — trusted property listings and verified sellers in Kenya."
        />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://petermuraya.github.io/julin/about" />

        {/* Preconnect and load fonts efficiently */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&family=Great+Vibes&display=swap"
          rel="stylesheet"
        />
      </Helmet>

      <div className="flex flex-col min-h-screen font-sans text-gray-900 bg-gray-50">
        {/* Navbar */}
        <Navbar />

        {/* Main content */}
        <main className="flex-grow pt-28 px-4 sm:px-6 lg:px-20">
          <About />
        </main>

        {/* Footer */}
        <Footer />
      </div>
    </>
  );
};

export default AboutPage;
