import { Helmet } from "react-helmet-async";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import About from "@/components/About";

export default function AboutPage() {
  if (typeof window !== 'undefined') {
    // eslint-disable-next-line no-console
    console.warn('Deprecated: use app/(public)/about/page.tsx instead of src/pages/About.tsx');
  }
  return null;
}
