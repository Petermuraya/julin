import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, BookOpen, Calendar, User, Eye, Share2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Blog } from "@/types/blog";

const BlogDetailPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const [blog, setBlog] = useState<Blog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (slug) {
      fetchBlog();
    }
  }, [slug]);

  const fetchBlog = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("blogs")
        .select("*")
        .eq("slug", slug)
        .eq("published", true)
        .single();

      if (error) throw error;

      // Increment view count
      if (data) {
        await supabase
          .from("blogs")
          .update({ view_count: (data.view_count || 0) + 1 })
          .eq("id", data.id);
      }

      setBlog(data);
    } catch (err: any) {
      console.error("Error fetching blog:", err);
      setError(err.message);
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

  const shareBlog = async () => {
    if (navigator.share && blog) {
      try {
        await navigator.share({
          title: blog.title,
          text: blog.excerpt || blog.title,
          url: window.location.href,
        });
      } catch (err) {
        console.log("Error sharing:", err);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      // You could show a toast here
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-slate-50 py-20">
          <div className="container mx-auto px-4">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p>Loading blog post...</p>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (error || !blog) {
    return (
      <>
        <Helmet>
          <title>Blog Not Found - Julin Real Estate</title>
          <meta name="description" content="The blog post you're looking for could not be found." />
        </Helmet>

        <Navbar />

        <main className="min-h-screen bg-slate-50">
          <section className="py-20">
            <div className="container mx-auto px-4 max-w-4xl text-center">
              <div className="mx-auto h-20 w-20 rounded-full bg-red-100 flex items-center justify-center mb-6">
                <BookOpen className="h-10 w-10 text-red-600" />
              </div>
              <h1 className="text-3xl font-bold text-foreground mb-4">
                Blog Post Not Found
              </h1>
              <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                The blog post you're looking for doesn't exist or has been removed.
              </p>
              <Link to="/blogs">
                <Button>
                  <ArrowLeft className="mr-2" size={16} />
                  Back to Blogs
                </Button>
              </Link>
            </div>
          </section>
        </main>

        <Footer />
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>{blog.seo_title || blog.title} - Julin Real Estate</title>
        <meta name="description" content={blog.seo_description || blog.excerpt || "Read our latest blog post about real estate in Kenya."} />
        {blog.seo_keywords && (
          <meta name="keywords" content={blog.seo_keywords.join(", ")} />
        )}
      </Helmet>

      <Navbar />

      <main className="min-h-screen bg-slate-50">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <Link to="/blogs" className="inline-flex items-center text-primary-foreground/80 hover:text-primary-foreground mb-6">
                <ArrowLeft className="mr-2" size={16} />
                Back to Blogs
              </Link>
              <h1 className="text-3xl md:text-4xl font-bold mb-4">{blog.title}</h1>
              {blog.excerpt && (
                <p className="text-xl text-primary-foreground/80 max-w-2xl mx-auto">
                  {blog.excerpt}
                </p>
              )}
            </div>
          </div>
        </section>

        {/* Blog Content */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <article className="max-w-4xl mx-auto">
              {/* Featured Image */}
              {blog.featured_image && (
                <div className="aspect-video rounded-lg overflow-hidden mb-8">
                  <img
                    src={blog.featured_image}
                    alt={blog.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Meta Information */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-8 p-4 bg-white rounded-lg border">
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
                  <span>{(blog.view_count || 0) + 1} views</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={shareBlog}
                  className="ml-auto"
                >
                  <Share2 size={14} className="mr-1" />
                  Share
                </Button>
              </div>

              {/* Tags */}
              {blog.tags && blog.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-8">
                  {blog.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Content */}
              <div
                className="prose prose-lg max-w-none"
                dangerouslySetInnerHTML={{ __html: blog.content }}
              />
            </article>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
};

export default BlogDetailPage;
