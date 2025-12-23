import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, User, Eye } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Reveal from "@/components/ui/Reveal";

type Blog = {
  id: string;
  slug: string;
  title: string;
  excerpt?: string | null;
  featured_image?: string | null;
  author_name?: string | null;
  published_at?: string | null;
  tags?: string[] | null;
  view_count?: number | null;
};

const BlogsPage = () => {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  useEffect(() => {
    let mounted = true;
    const fetchBlogs = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error } = await supabase
          .from("blogs")
          .select("id, slug, title, excerpt, featured_image, author_name, published_at, tags, view_count")
          .order("published_at", { ascending: false })
          .limit(12);

        if (error) throw error;
        if (!mounted) return;
        setBlogs(((data as unknown) as Blog[]) || []);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        setError(msg || "Failed to load blog posts");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchBlogs();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <>
      <Helmet>
        <title>Blog - Julin Real Estate</title>
        <meta name="description" content="Read our latest blog posts about real estate, property investment, and market insights in Kenya." />
      </Helmet>

      <Navbar />

      <main className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground py-20">
          <div className="container mx-auto px-4 text-center">
            <Reveal>
              <h1 className="text-4xl md:text-5xl font-bold mb-4">Real Estate Blog</h1>
              <p className="text-xl text-primary-foreground/80 max-w-2xl mx-auto">
                Stay informed with the latest insights, tips, and trends in the Kenyan real estate market
              </p>
            </Reveal>
          </div>
        </section>

        {/* Blogs Section */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {loading ? (
                <div className="col-span-3 text-center py-12">Loading blogs…</div>
              ) : error ? (
                <div className="col-span-3 text-center py-12 text-red-500">{error}</div>
              ) : (
                blogs.map((blog, idx) => (
                  <Reveal key={blog.id} delay={idx * 0.04}>
                    <Card className="hover:shadow-lg transition-shadow overflow-hidden">
                      <div className="aspect-video overflow-hidden">
                        <img
                          src={blog.featured_image || "/placeholder.svg"}
                          alt={blog.title}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      <CardHeader className="pb-2">
                        <div className="flex flex-wrap gap-2 mb-2">
                          {(blog.tags || []).slice(0, 2).map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                        <CardTitle className="line-clamp-2">
                          <Link to={`/blog/${blog.slug}`} className="hover:text-primary transition-colors">
                            {blog.title}
                          </Link>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground mb-4 line-clamp-3">
                          {blog.excerpt || ""}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                          <div className="flex items-center gap-1">
                            <User size={14} />
                            <span>{blog.author_name || "Julin Real Estate"}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar size={14} />
                            <span>{formatDate(blog.published_at)}</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Eye size={14} />
                            <span>{blog.view_count ?? 0} views</span>
                          </div>
                          <Link to={`/blog/${blog.slug}`}>
                            <Button variant="outline" size="sm">
                              Read More
                            </Button>
                          </Link>
                        </div>
                      </CardContent>
                    </Card>
                  </Reveal>
                ))
              )}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
};

export default BlogsPage;
