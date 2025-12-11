import { Helmet } from "react-helmet-async";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Contact from "@/components/Contact";

const ContactPage = () => {
  return (
    <>
      <Helmet>
        <title>Contact — Julin Real Estate</title>
        <meta name="description" content="Contact Julin Real Estate for inquiries, listings, and support." />
      </Helmet>

      <div className="min-h-screen">
        <Navbar />
        <main className="pt-28">
          <Contact />
        </main>
        <Footer />
      </div>
    </>
  );
};

export default ContactPage;
