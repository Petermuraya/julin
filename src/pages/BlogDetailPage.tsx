import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BookOpen } from "lucide-react";

const BlogDetailPage = () => {
  return (
    <>
      <Helmet>
        <title>Blog - Julin Real Estate</title>
        <meta name="description" content="Read our latest blog posts about real estate in Kenya." />
      </Helmet>

      <Navbar />

      <main className="min-h-screen bg-slate-50">
        <section className="py-20">
          <div className="container mx-auto px-4 max-w-4xl text-center">
            <div className="mx-auto h-20 w-20 rounded-full bg-blue-100 flex items-center justify-center mb-6">
              <BookOpen className="h-10 w-10 text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 mb-4">
              Blog Coming Soon
            </h1>
            <p className="text-slate-600 mb-8 max-w-md mx-auto">
              We're working on bringing you valuable real estate insights and market updates. Check back soon!
            </p>
            <Link to="/">
              <Button>
                <ArrowLeft className="mr-2" size={16} />
                Back to Home
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
};

export default BlogDetailPage;
