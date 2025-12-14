import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Calendar, User, ArrowRight } from "lucide-react";

interface Blog {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  featured_image: string | null;
  author_name: string | null;
  published_at: string | null;
  tags: string[] | null;
  view_count: number | null;
}

const BlogsPage = () => {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string>("");

  useEffect(() => {
    loadBlogs();
  }, []);

  const loadBlogs = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("blogs")
      .select("id, title, slug, excerpt, featured_image, author_name, published_at, tags, view_count")
      .eq("published", true)
      .order("published_at", { ascending: false });

    if (error) {
      console.error("Error loading blogs:", error);
    } else {
      setBlogs(data || []);
    }
    setLoading(false);
  };

  const filteredBlogs = blogs.filter((blog) => {
    const matchesSearch = blog.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         blog.excerpt?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTag = !selectedTag || blog.tags?.includes(selectedTag);
    return matchesSearch && matchesTag;
  });

  const allTags = Array.from(new Set(blogs.flatMap(blog => blog.tags || [])));

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

        {/* Search and Filter Section */}
        <section className="py-8 bg-white border-b">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-3 text-slate-400" size={20} />
                <Input
                  placeholder="Search blog posts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {allTags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={selectedTag === "" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedTag("")}
                  >
                    All
                  </Button>
                  {allTags.map((tag) => (
                    <Button
                      key={tag}
                      variant={selectedTag === tag ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedTag(tag)}
                    >
                      {tag}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Blog Posts Grid */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-lg shadow-md overflow-hidden">
                    <Skeleton className="h-48 w-full" />
                    <div className="p-6">
                      <Skeleton className="h-6 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-full mb-2" />
                      <Skeleton className="h-4 w-2/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredBlogs.length === 0 ? (
              <div className="text-center py-12">
                <h3 className="text-2xl font-semibold text-slate-600 mb-2">No blog posts found</h3>
                <p className="text-slate-500">Try adjusting your search or filter criteria.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredBlogs.map((blog) => (
                  <article key={blog.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                    {blog.featured_image && (
                      <img
                        src={blog.featured_image}
                        alt={blog.title}
                        className="w-full h-48 object-cover"
                      />
                    )}

                    <div className="p-6">
                      <div className="flex items-center gap-4 text-sm text-slate-500 mb-3">
                        {blog.published_at && (
                          <div className="flex items-center gap-1">
                            <Calendar size={16} />
                            {new Date(blog.published_at).toLocaleDateString()}
                          </div>
                        )}
                        {blog.author_name && (
                          <div className="flex items-center gap-1">
                            <User size={16} />
                            {blog.author_name}
                          </div>
                        )}
                      </div>

                      <h2 className="text-xl font-bold text-slate-900 mb-3 line-clamp-2">
                        <Link
                          to={`/blog/${blog.slug}`}
                          className="hover:text-blue-600 transition-colors"
                        >
                          {blog.title}
                        </Link>
                      </h2>

                      {blog.excerpt && (
                        <p className="text-slate-600 mb-4 line-clamp-3">{blog.excerpt}</p>
                      )}

                      <div className="flex items-center justify-between">
                        <div className="flex flex-wrap gap-1">
                          {blog.tags?.slice(0, 2).map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>

                        <Link
                          to={`/blog/${blog.slug}`}
                          className="flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium"
                        >
                          Read More
                          <ArrowRight size={16} />
                        </Link>
                      </div>
                    </div>
                  </article>
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