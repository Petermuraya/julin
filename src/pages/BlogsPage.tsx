import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, User, Eye, Clock } from "lucide-react";

// Static sample blog data
const sampleBlogs = [
  {
    id: "1",
    slug: "guide-to-buying-land-in-kenya",
    title: "Complete Guide to Buying Land in Kenya",
    excerpt: "Everything you need to know about purchasing land in Kenya, from legal requirements to due diligence steps.",
    featured_image: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800",
    author_name: "Julin Real Estate",
    published_at: "2024-12-01",
    tags: ["Land", "Buying Guide", "Kenya"],
    view_count: 156
  },
  {
    id: "2",
    slug: "top-investment-areas-nairobi-2024",
    title: "Top Investment Areas in Nairobi for 2024",
    excerpt: "Discover the most promising neighborhoods for real estate investment in Nairobi this year.",
    featured_image: "https://images.unsplash.com/photo-1611348586804-61bf6c080437?w=800",
    author_name: "Julin Real Estate",
    published_at: "2024-11-15",
    tags: ["Investment", "Nairobi", "Market Analysis"],
    view_count: 243
  },
  {
    id: "3",
    slug: "understanding-land-titles-kenya",
    title: "Understanding Land Titles in Kenya",
    excerpt: "A comprehensive breakdown of different land title types and what they mean for property owners.",
    featured_image: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800",
    author_name: "Julin Real Estate",
    published_at: "2024-11-01",
    tags: ["Legal", "Land Titles", "Documentation"],
    view_count: 189
  },
  {
    id: "4",
    slug: "benefits-of-owning-property-kenya",
    title: "Benefits of Owning Property in Kenya",
    excerpt: "Why investing in Kenyan real estate is a smart financial decision for your future.",
    featured_image: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800",
    author_name: "Julin Real Estate",
    published_at: "2024-10-20",
    tags: ["Investment", "Benefits", "Property"],
    view_count: 98
  }
];

const BlogsPage = () => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

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
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Real Estate Blog</h1>
            <p className="text-xl text-primary-foreground/80 max-w-2xl mx-auto">
              Stay informed with the latest insights, tips, and trends in the Kenyan real estate market
            </p>
          </div>
        </section>

        {/* Blogs Section */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {sampleBlogs.map((blog) => (
                <Card key={blog.id} className="hover:shadow-lg transition-shadow overflow-hidden">
                  <div className="aspect-video overflow-hidden">
                    <img
                      src={blog.featured_image}
                      alt={blog.title}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <CardHeader className="pb-2">
                    <div className="flex flex-wrap gap-2 mb-2">
                      {blog.tags.slice(0, 2).map((tag) => (
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
                      {blog.excerpt}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                      <div className="flex items-center gap-1">
                        <User size={14} />
                        <span>{blog.author_name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar size={14} />
                        <span>{formatDate(blog.published_at)}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Eye size={14} />
                        <span>{blog.view_count} views</span>
                      </div>
                      <Link to={`/blog/${blog.slug}`}>
                        <Button variant="outline" size="sm">
                          Read More
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
};

export default BlogsPage;
