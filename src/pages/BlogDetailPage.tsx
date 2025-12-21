import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, BookOpen, Calendar, User, Eye, Share2 } from "lucide-react";

// Static sample blog data
const sampleBlogs: Record<string, {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  featured_image: string;
  author_name: string;
  published_at: string;
  tags: string[];
  view_count: number;
  seo_title: string;
  seo_description: string;
}> = {
  "guide-to-buying-land-in-kenya": {
    id: "1",
    title: "Complete Guide to Buying Land in Kenya",
    excerpt: "Everything you need to know about purchasing land in Kenya, from legal requirements to due diligence steps.",
    content: `<h2>Introduction</h2>
<p>Buying land in Kenya is one of the most significant investments you can make. Whether you're looking to build your dream home, start a farming venture, or make a strategic investment, understanding the process is crucial.</p>

<h2>Step 1: Conduct a Land Search</h2>
<p>Before purchasing any land, conduct a thorough search at the Ministry of Lands. This will reveal:</p>
<ul>
<li>The registered owner of the land</li>
<li>Any existing encumbrances or charges</li>
<li>The size and boundaries of the property</li>
</ul>

<h2>Step 2: Verify the Title Deed</h2>
<p>Ensure the seller has a valid title deed. In Kenya, there are several types of titles:</p>
<ul>
<li><strong>Freehold:</strong> Absolute ownership with no time limit</li>
<li><strong>Leasehold:</strong> Ownership for a specified period (usually 99 years)</li>
<li><strong>Sectional Titles:</strong> For apartments and units in buildings</li>
</ul>

<h2>Step 3: Physical Verification</h2>
<p>Always visit the land physically to:</p>
<ul>
<li>Confirm the boundaries match the title deed</li>
<li>Check for any disputes or unauthorized occupation</li>
<li>Assess accessibility and infrastructure</li>
</ul>

<h2>Step 4: Engage a Lawyer</h2>
<p>A qualified lawyer will help with:</p>
<ul>
<li>Drafting the sale agreement</li>
<li>Conducting due diligence</li>
<li>Handling the transfer process</li>
</ul>

<h2>Step 5: Pay Stamp Duty and Register</h2>
<p>After completing the sale:</p>
<ul>
<li>Pay stamp duty (4% in urban areas, 2% in rural areas)</li>
<li>Register the transfer at the Lands Registry</li>
</ul>

<h2>Conclusion</h2>
<p>Buying land in Kenya requires careful planning and due diligence. Work with reputable agents like Julin Real Estate to ensure a smooth transaction.</p>`,
    featured_image: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1200",
    author_name: "Julin Real Estate",
    published_at: "2024-12-01",
    tags: ["Land", "Buying Guide", "Kenya"],
    view_count: 156,
    seo_title: "Complete Guide to Buying Land in Kenya | Julin Real Estate",
    seo_description: "Learn everything about buying land in Kenya - from legal requirements to due diligence steps. Expert guide from Julin Real Estate."
  },
  "top-investment-areas-nairobi-2024": {
    id: "2",
    title: "Top Investment Areas in Nairobi for 2024",
    excerpt: "Discover the most promising neighborhoods for real estate investment in Nairobi this year.",
    content: `<h2>Introduction</h2>
<p>Nairobi's real estate market continues to evolve, with certain areas showing exceptional growth potential. Here are the top investment areas for 2024.</p>

<h2>1. Ruaka</h2>
<p>Ruaka has transformed from a quiet suburb to a bustling residential area:</p>
<ul>
<li>Close proximity to major shopping centers</li>
<li>Excellent road infrastructure</li>
<li>Growing demand for rental properties</li>
</ul>

<h2>2. Kiambu Road Corridor</h2>
<p>The areas along Kiambu Road offer:</p>
<ul>
<li>Access to quality schools</li>
<li>Serene environment</li>
<li>Appreciating land values</li>
</ul>

<h2>3. Syokimau</h2>
<p>With the SGR terminus nearby:</p>
<ul>
<li>Industrial and commercial growth</li>
<li>Affordable land prices</li>
<li>Infrastructure development</li>
</ul>

<h2>4. Konza Technopolis</h2>
<p>The "Silicon Savannah" is attracting:</p>
<ul>
<li>Tech companies and startups</li>
<li>Long-term investment potential</li>
<li>Government-backed development</li>
</ul>

<h2>Investment Tips</h2>
<ul>
<li>Research thoroughly before investing</li>
<li>Consider infrastructure development plans</li>
<li>Work with reputable real estate agents</li>
</ul>

<h2>Conclusion</h2>
<p>These areas present excellent opportunities for investors looking to capitalize on Nairobi's growth trajectory.</p>`,
    featured_image: "https://images.unsplash.com/photo-1611348586804-61bf6c080437?w=1200",
    author_name: "Julin Real Estate",
    published_at: "2024-11-15",
    tags: ["Investment", "Nairobi", "Market Analysis"],
    view_count: 243,
    seo_title: "Top Investment Areas in Nairobi 2024 | Julin Real Estate",
    seo_description: "Discover the most promising neighborhoods for real estate investment in Nairobi. Expert market analysis from Julin Real Estate."
  },
  "understanding-land-titles-kenya": {
    id: "3",
    title: "Understanding Land Titles in Kenya",
    excerpt: "A comprehensive breakdown of different land title types and what they mean for property owners.",
    content: `<h2>Introduction</h2>
<p>Understanding land titles is essential for any property transaction in Kenya. This guide breaks down the different types of titles you'll encounter.</p>

<h2>Types of Land Tenure</h2>

<h3>1. Freehold</h3>
<ul>
<li>Absolute ownership of land</li>
<li>No time restrictions</li>
<li>Can be passed on through inheritance</li>
<li>Highest form of land ownership</li>
</ul>

<h3>2. Leasehold</h3>
<ul>
<li>Ownership for a specific period (usually 99 years)</li>
<li>Land reverts to government after lease expires</li>
<li>Can be renewed upon expiration</li>
<li>Common in urban areas</li>
</ul>

<h3>3. Community Land</h3>
<ul>
<li>Held collectively by a community</li>
<li>Registered under community name</li>
<li>Protected under Community Land Act 2016</li>
</ul>

<h2>Title Deed Components</h2>
<p>A valid title deed contains:</p>
<ul>
<li>Land reference number</li>
<li>Registered owner's details</li>
<li>Size of the property</li>
<li>Any encumbrances or charges</li>
</ul>

<h2>Common Issues to Watch</h2>
<ul>
<li>Forged title deeds</li>
<li>Double allocations</li>
<li>Disputed boundaries</li>
<li>Unpaid land rates</li>
</ul>

<h2>How to Verify a Title</h2>
<ol>
<li>Conduct official search at Lands Registry</li>
<li>Visit the physical location</li>
<li>Engage a qualified lawyer</li>
<li>Check for any caveats or charges</li>
</ol>

<h2>Conclusion</h2>
<p>Always verify the authenticity of any title deed before proceeding with a purchase. Julin Real Estate can assist with proper due diligence.</p>`,
    featured_image: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=1200",
    author_name: "Julin Real Estate",
    published_at: "2024-11-01",
    tags: ["Legal", "Land Titles", "Documentation"],
    view_count: 189,
    seo_title: "Understanding Land Titles in Kenya | Julin Real Estate",
    seo_description: "Complete guide to land title types in Kenya - freehold, leasehold, and community land. Learn what each means for property owners."
  },
  "benefits-of-owning-property-kenya": {
    id: "4",
    title: "Benefits of Owning Property in Kenya",
    excerpt: "Why investing in Kenyan real estate is a smart financial decision for your future.",
    content: `<h2>Introduction</h2>
<p>Owning property in Kenya offers numerous benefits beyond just having a place to call home. Here's why real estate investment makes sense.</p>

<h2>Financial Benefits</h2>

<h3>1. Appreciation</h3>
<ul>
<li>Land values consistently increase over time</li>
<li>Urban areas see particularly high appreciation</li>
<li>Protection against inflation</li>
</ul>

<h3>2. Rental Income</h3>
<ul>
<li>Generate passive income from tenants</li>
<li>Consistent cash flow</li>
<li>Helps pay off mortgages</li>
</ul>

<h3>3. Tax Benefits</h3>
<ul>
<li>Mortgage interest deductions</li>
<li>Depreciation benefits</li>
<li>Capital gains advantages</li>
</ul>

<h2>Personal Benefits</h2>

<h3>Security</h3>
<ul>
<li>Stable housing for your family</li>
<li>Asset to pass to future generations</li>
<li>Collateral for loans</li>
</ul>

<h3>Freedom</h3>
<ul>
<li>Customize your property</li>
<li>No landlord restrictions</li>
<li>Build equity over time</li>
</ul>

<h2>Why Kenya?</h2>
<ul>
<li>Growing economy</li>
<li>Increasing urbanization</li>
<li>Strong demand for housing</li>
<li>Government support for homeownership</li>
</ul>

<h2>Getting Started</h2>
<ol>
<li>Assess your budget</li>
<li>Choose the right location</li>
<li>Work with trusted agents</li>
<li>Conduct proper due diligence</li>
</ol>

<h2>Conclusion</h2>
<p>Property ownership in Kenya is a journey worth taking. Contact Julin Real Estate to start your investment journey today.</p>`,
    featured_image: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1200",
    author_name: "Julin Real Estate",
    published_at: "2024-10-20",
    tags: ["Investment", "Benefits", "Property"],
    view_count: 98,
    seo_title: "Benefits of Owning Property in Kenya | Julin Real Estate",
    seo_description: "Discover why investing in Kenyan real estate is a smart financial decision. Learn about appreciation, rental income, and more."
  }
};

const BlogDetailPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const blog = slug ? sampleBlogs[slug] : null;

  const [sanitizedHtml, setSanitizedHtml] = useState<string | null>(null);

  useEffect(() => {
    // Sanitize HTML on the client using DOMPurify to prevent XSS when content
    // becomes dynamic from the database. We import dynamically so SSR won't fail.
    let mounted = true;
    if (!blog) return;
    if (typeof window === 'undefined') {
      setSanitizedHtml(blog.content);
      return;
    }
    import('dompurify')
      .then((mod) => {
        if (!mounted) return;
        type DOMPurifyModule = { default?: { sanitize: (s: string) => string }; sanitize?: (s: string) => string };
        const m = mod as DOMPurifyModule;
        const DOMPurify = m.default ?? m;
        setSanitizedHtml(DOMPurify.sanitize(blog.content));
      })
      .catch(() => {
        // If DOMPurify isn't available, fall back to raw content (not ideal).
        setSanitizedHtml(blog.content);
      });
    return () => { mounted = false; };
  }, [blog]);

  const formatDate = (dateString: string) => {
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
          text: blog.excerpt,
          url: window.location.href,
        });
      } catch (err) {
        console.log("Error sharing:", err);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  if (!blog) {
    return (
      <>
        <Helmet>
          <title>Blog Not Found - Julin Real Estate</title>
          <meta name="description" content="The blog post you're looking for could not be found." />
        </Helmet>

        <Navbar />

        <main className="min-h-screen bg-background">
          <section className="py-20">
            <div className="container mx-auto px-4 max-w-4xl text-center">
              <div className="mx-auto h-20 w-20 rounded-full bg-destructive/10 flex items-center justify-center mb-6">
                <BookOpen className="h-10 w-10 text-destructive" />
              </div>
              <h1 className="text-3xl font-bold text-foreground mb-4">
                Blog Post Not Found
              </h1>
              <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                The blog post you're looking for doesn't exist or has been removed.
              </p>
              <Link to="/blog">
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
        <title>{blog.seo_title}</title>
        <meta name="description" content={blog.seo_description} />
      </Helmet>

      <Navbar />

      <main className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <Link to="/blog" className="inline-flex items-center text-primary-foreground/80 hover:text-primary-foreground mb-6">
                <ArrowLeft className="mr-2" size={16} />
                Back to Blogs
              </Link>
              <h1 className="text-3xl md:text-4xl font-bold mb-4">{blog.title}</h1>
              <p className="text-xl text-primary-foreground/80 max-w-2xl mx-auto">
                {blog.excerpt}
              </p>
            </div>
          </div>
        </section>

        {/* Blog Content */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <article className="max-w-4xl mx-auto">
              {/* Featured Image */}
              <div className="aspect-video rounded-lg overflow-hidden mb-8">
                <img
                  src={blog.featured_image}
                  alt={blog.title}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Meta Information */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-8 p-4 bg-muted rounded-lg border">
                <div className="flex items-center gap-1">
                  <User size={14} />
                  <span>{blog.author_name}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar size={14} />
                  <span>{formatDate(blog.published_at)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Eye size={14} />
                  <span>{blog.view_count} views</span>
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
              <div className="flex flex-wrap gap-2 mb-8">
                {blog.tags.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>

              {/* Content */}
              <div
                className="prose prose-lg max-w-none dark:prose-invert"
                dangerouslySetInnerHTML={{ __html: sanitizedHtml ?? blog.content }}
              />

              {/* CTA */}
              <div className="mt-12 p-6 bg-muted rounded-lg">
                <h3 className="text-xl font-bold mb-2">Need Help with Your Property Search?</h3>
                <p className="text-muted-foreground mb-4">
                  Julin Real Estate is here to help you find the perfect property. Contact us today for expert guidance.
                </p>
                <Link to="/contact">
                  <Button>Contact Us</Button>
                </Link>
              </div>
            </article>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
};

export default BlogDetailPage;
