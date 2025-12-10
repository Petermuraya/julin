import { Helmet } from "react-helmet-async";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Properties from "@/components/Properties";
import About from "@/components/About";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <>
      <Helmet>
        <title>Julin Real Estate | Buy & Sell Properties in Kenya</title>
        <meta
          name="description"
          content="Julin Real Estate connects buyers and sellers of real estate properties in Kenya. Find your dream home or list your property today."
        />
      </Helmet>
      <div className="min-h-screen">
        <Navbar />
        <main>
          <Hero />
          <Properties />
          <About />
          <Contact />
        </main>
        <Footer />
      </div>
    </>
  );
};

export default Index;
