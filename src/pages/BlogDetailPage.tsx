import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, User, ArrowLeft, Share2, Eye } from "lucide-react";

interface Blog {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  featured_image: string | null;
  author_name: string | null;
  published_at: string | null;
  tags: string[] | null;
  seo_title: string | null;
  seo_description: string | null;
  view_count: number | null;
}

const BlogDetailPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const [blog, setBlog] = useState<Blog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (slug) {
      loadBlog();
    }
  }, [slug]);

  const loadBlog = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from("blogs")
        .select("*")
        .eq("slug", slug)
        .eq("published", true)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          setError("Blog post not found");
        } else {
          throw error;
        }
      } else {
        setBlog(data);

        // Increment view count
        await supabase
          .from("blogs")
          .update({ view_count: (data.view_count || 0) + 1 })
          .eq("id", data.id);
      }
    } catch (err) {
      console.error("Error loading blog:", err);
      setError("Failed to load blog post");
    }

    setLoading(false);
  };

  const shareUrl = window.location.href;
  const shareTitle = blog?.title || "Check out this blog post";

  const shareToFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank');
  };

  const shareToTwitter = () => {
    window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareTitle)}`, '_blank');
  };

  const shareToWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(`${shareTitle} ${shareUrl}`)}`, '_blank');
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-slate-50 py-12">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="mb-8">
              <Skeleton className="h-8 w-32 mb-4" />
              <Skeleton className="h-12 w-full mb-4" />
              <Skeleton className="h-6 w-3/4" />
            </div>
            <Skeleton className="h-64 w-full mb-8" />
            <div className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
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
        <Navbar />
        <main className="min-h-screen bg-slate-50 py-12">
          <div className="container mx-auto px-4 max-w-4xl text-center">
            <h1 className="text-3xl font-bold text-slate-900 mb-4">
              {error || "Blog post not found"}
            </h1>
            <p className="text-slate-600 mb-8">
              The blog post you're looking for doesn't exist or has been removed.
            </p>
            <Link to="/blogs">
              <Button>
                <ArrowLeft className="mr-2" size={16} />
                Back to Blog
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
        <title>{blog.seo_title || blog.title} - Julin Real Estate</title>
        <meta name="description" content={blog.seo_description || blog.excerpt || ""} />
        {blog.featured_image && <meta property="og:image" content={blog.featured_image} />}
        <meta property="og:title" content={blog.seo_title || blog.title} />
        <meta property="og:description" content={blog.seo_description || blog.excerpt || ""} />
        <meta property="og:url" content={shareUrl} />
        <meta name="twitter:card" content="summary_large_image" />
      </Helmet>

      <Navbar />

      <main className="min-h-screen bg-slate-50">
        {/* Breadcrumb */}
        <section className="py-4 bg-white border-b">
          <div className="container mx-auto px-4 max-w-4xl">
            <nav className="flex items-center gap-2 text-sm text-slate-600">
              <Link to="/" className="hover:text-blue-600">Home</Link>
              <span>/</span>
              <Link to="/blogs" className="hover:text-blue-600">Blog</Link>
              <span>/</span>
              <span className="text-slate-900">{blog.title}</span>
            </nav>
          </div>
        </section>

        {/* Article Header */}
        <section className="py-12">
          <div className="container mx-auto px-4 max-w-4xl">
            <Link to="/blogs" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-8">
              <ArrowLeft size={16} />
              Back to Blog
            </Link>

            <div className="flex flex-col lg:flex-row gap-8">
              {/* Main Content */}
              <article className="flex-1">
                <header className="mb-8">
                  <div className="flex items-center gap-4 text-sm text-slate-500 mb-4">
                    {blog.published_at && (
                      <div className="flex items-center gap-1">
                        <Calendar size={16} />
                        {new Date(blog.published_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </div>
                    )}
                    {blog.author_name && (
                      <div className="flex items-center gap-1">
                        <User size={16} />
                        {blog.author_name}
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Eye size={16} />
                      {blog.view_count || 0} views
                    </div>
                  </div>

                  <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                    {blog.title}
                  </h1>

                  {blog.excerpt && (
                    <p className="text-xl text-slate-600 leading-relaxed">
                      {blog.excerpt}
                    </p>
                  )}

                  {blog.tags && blog.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-4">
                      {blog.tags.map((tag) => (
                        <Badge key={tag} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </header>

                {blog.featured_image && (
                  <img
                    src={blog.featured_image}
                    alt={blog.title}
                    className="w-full h-64 md:h-96 object-cover rounded-lg mb-8"
                  />
                )}

                <div
                  className="prose prose-lg max-w-none"
                  dangerouslySetInnerHTML={{ __html: blog.content }}
                />
              </article>

              {/* Sidebar */}
              <aside className="lg:w-80">
                <div className="sticky top-24">
                  {/* Share Section */}
                  <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Share2 size={20} />
                      Share this post
                    </h3>
                    <div className="flex gap-2">
                      <Button
                        onClick={shareToFacebook}
                        variant="outline"
                        size="sm"
                        className="flex-1"
                      >
                        Facebook
                      </Button>
                      <Button
                        onClick={shareToTwitter}
                        variant="outline"
                        size="sm"
                        className="flex-1"
                      >
                        Twitter
                      </Button>
                      <Button
                        onClick={shareToWhatsApp}
                        variant="outline"
                        size="sm"
                        className="flex-1"
                      >
                        WhatsApp
                      </Button>
                    </div>
                  </div>

                  {/* Author Info */}
                  {blog.author_name && (
                    <div className="bg-white rounded-lg shadow-md p-6">
                      <h3 className="text-lg font-semibold mb-4">About the Author</h3>
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                          <User size={24} className="text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{blog.author_name}</p>
                          <p className="text-sm text-slate-600">Real Estate Expert</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </aside>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
};

export default BlogDetailPage;