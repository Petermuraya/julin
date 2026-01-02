import { Helmet } from "react-helmet-async";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Contact from "@/components/Contact";

export default function ContactPage() {
  if (typeof window !== 'undefined') {
    // eslint-disable-next-line no-console
    console.warn('Deprecated: use app/(public)/contact/page.tsx instead of src/pages/Contact.tsx');
  }
  return null;
}
