"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Helmet } from "react-helmet-async";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, BookOpen, Calendar, User, Eye, Share2 } from "lucide-react";

const sampleBlogs: Record<string, any> = {/* sample data kept in src for brevity */};

export default function Page() {
  const params = useParams();
  const slug = (params as any)?.slug as string | undefined;
  const blog = slug ? sampleBlogs[slug] : null;

  const [sanitizedHtml, setSanitizedHtml] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    if (!blog) return;
    if (typeof window === 'undefined') {
      setSanitizedHtml(blog.content);
      return;
    }
    import('dompurify')
      .then((mod) => {
        if (!mounted) return;
        const DOMPurify = (mod as any).default ?? mod;
        setSanitizedHtml(DOMPurify.sanitize(blog.content));
      })
      .catch(() => {
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
              <Link href="/blog">
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
        <section className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <Link href="/blog" className="inline-flex items-center text-primary-foreground/80 hover:text-primary-foreground mb-6">
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

        <section className="py-16">
          <div className="container mx-auto px-4">
            <article className="max-w-4xl mx-auto">
              <div className="aspect-video rounded-lg overflow-hidden mb-8">
                <img
                  src={blog.featured_image}
                  alt={blog.title}
                  className="w-full h-full object-cover"
                />
              </div>

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

              <div className="flex flex-wrap gap-2 mb-8">
                {blog.tags.map((tag: string) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>

              <div
                className="prose prose-lg max-w-none dark:prose-invert"
                dangerouslySetInnerHTML={{ __html: sanitizedHtml ?? blog.content }}
              />

              <div className="mt-12 p-6 bg-muted rounded-lg">
                <h3 className="text-xl font-bold mb-2">Need Help with Your Property Search?</h3>
                <p className="text-muted-foreground mb-4">
                  Julin Real Estate is here to help you find the perfect property. Contact us today for expert guidance.
                </p>
                <Link href="/contact">
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
}
