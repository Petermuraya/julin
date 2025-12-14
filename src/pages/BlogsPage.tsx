import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, ArrowLeft, Calendar, User, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Blog } from "@/types/blog";

const BlogsPage = () => {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBlogs();
  }, []);

  const fetchBlogs = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("blogs")
        .select("*")
        .eq("published", true)
        .order("published_at", { ascending: false });

      if (error) {
        // Check if the error is because the table doesn't exist
        if (error.message.includes('relation "public.blogs" does not exist')) {
          setError("The blogs feature is not yet set up. Please contact the administrator to create the blogs table.");
        } else {
          setError(error.message);
        }
        return;
      }
      setBlogs(data || []);
    } catch (err: any) {
      console.error("Error fetching blogs:", err);
      if (err.message.includes('blogs')) {
        setError("The blogs feature is not yet available. Please check back later.");
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-slate-50 py-20">
          <div className="container mx-auto px-4">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p>Loading blogs...</p>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (error) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-slate-50 py-20">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Error Loading Blogs</h1>
            <p className="text-muted-foreground mb-8">{error}</p>
            <Link to="/">
              <Button>
                <ArrowLeft className="mr-2" size={16} />
                Back to Home
              </Button>
            </Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Blog - Julin Real Estate</title>
        <meta name="description" content="Read our latest blog posts about real estate, property investment, and market insights in Kenya." />
      </Helmet>

      <Navbar />

      <main className="min-h-screen bg-slate-50">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground py-20">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Real Estate Blog</h1>
            <p className="text-xl text-primary-foreground/80 max-w-2xl mx-auto">
              Stay informed with the latest insights, tips, and trends in the Kenyan real estate market
            </p>
          </div>
        </section>

        {/* Blogs Section */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            {blogs.length === 0 ? (
              <div className="text-center">
                <div className="mx-auto h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                  <BookOpen className="h-10 w-10 text-primary" />
                </div>
                <h2 className="text-3xl font-bold text-foreground mb-4">
                  No Blog Posts Yet
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
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {blogs.map((blog) => (
                  <Card key={blog.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      {blog.featured_image && (
                        <div className="aspect-video rounded-lg overflow-hidden mb-4">
                          <img
                            src={blog.featured_image}
                            alt={blog.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <CardTitle className="line-clamp-2">
                        <Link to={`/blog/${blog.slug}`} className="hover:text-primary transition-colors">
                          {blog.title}
                        </Link>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {blog.excerpt && (
                        <p className="text-muted-foreground mb-4 line-clamp-3">
                          {blog.excerpt}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                        {blog.author_name && (
                          <div className="flex items-center gap-1">
                            <User size={14} />
                            <span>{blog.author_name}</span>
                          </div>
                        )}
                        {blog.published_at && (
                          <div className="flex items-center gap-1">
                            <Calendar size={14} />
                            <span>{formatDate(blog.published_at)}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Eye size={14} />
                          <span>{blog.view_count} views</span>
                        </div>
                      </div>
                      {blog.tags && blog.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {blog.tags.slice(0, 3).map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                      <Link to={`/blog/${blog.slug}`}>
                        <Button variant="outline" className="w-full">
                          Read More
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
};

export default BlogsPage;
