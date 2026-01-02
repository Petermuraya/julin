"use client";
import { Helmet } from "react-helmet-async";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ContactComponent from "@/components/Contact";

export default function Page() {
  return (
    <>
      <Helmet>
        <title>Contact — Julin Real Estate</title>
        <meta name="description" content="Contact Julin Real Estate for inquiries, listings, and support." />
      </Helmet>

      <div className="min-h-screen">
        <Navbar />
        <main>
          <ContactComponent />
        </main>
        <Footer />
      </div>
    </>
  );
}
