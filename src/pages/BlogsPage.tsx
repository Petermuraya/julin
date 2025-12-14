import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { BookOpen, ArrowLeft } from "lucide-react";

const BlogsPage = () => {
  return (
    <>
      <Helmet>
        <title>Blog - Julin Real Estate</title>
        <meta name="description" content="Read our latest blog posts about real estate, property investment, and market insights in Kenya." />
      </Helmet>

      <Navbar />

      <main className="min-h-screen bg-slate-50">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-20">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Real Estate Blog</h1>
            <p className="text-xl text-blue-100 max-w-2xl mx-auto">
              Stay informed with the latest insights, tips, and trends in the Kenyan real estate market
            </p>
          </div>
        </section>

        {/* Coming Soon Section */}
        <section className="py-20">
          <div className="container mx-auto px-4 text-center">
            <div className="mx-auto h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
              <BookOpen className="h-10 w-10 text-primary" />
            </div>
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Blog Posts Coming Soon
            </h2>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              We're working on bringing you valuable real estate insights, market updates, and property tips. Check back soon!
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

export default BlogsPage;
