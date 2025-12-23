import { Helmet } from "react-helmet-async";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Properties from "@/components/property/Properties";
import About from "@/components/About";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";
import Reveal from "@/components/ui/Reveal";

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
        <main className="pt-28">
          <Reveal>
            <Hero />
          </Reveal>

          <section className="container mx-auto px-4">
            <Reveal>
              <Properties />
            </Reveal>
          </section>
        </main>
        <Footer />
      </div>
    </>
  );
};

export default Index;
