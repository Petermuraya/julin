import { Helmet } from "react-helmet-async";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import About from "@/components/About";

const AboutPage = () => {
  return (
    <>
      <Helmet>
        <title>About — Julin Real Estate</title>
        <meta name="description" content="About Julin Real Estate — trusted property listings and verified sellers in Kenya." />
      </Helmet>

      <div className="min-h-screen">
        <Navbar />
        <main className="pt-28">
          <About />
        </main>
        <Footer />
      </div>
    </>
  );
};

export default AboutPage;
