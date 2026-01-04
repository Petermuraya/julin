import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, User, Eye, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
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

const PAGE_SIZE = 9;

const BlogsPage = () => {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const fetchBlogs = async (opts?: { reset?: boolean }) => {
    setLoading(true);
    setError(null);
    try {
      const offset = opts?.reset ? 0 : (page - 1) * PAGE_SIZE;
      const { data, error } = await supabase
        .from("blogs")
        .select("id, slug, title, excerpt, featured_image, author_name, published_at, tags, view_count")
        .eq("published", true)
        .order("published_at", { ascending: false })
        .range(offset, offset + PAGE_SIZE - 1);

      if (error) throw error;

      const items = ((data as unknown) as Blog[]) || [];
      if (opts?.reset) setBlogs(items);
      else setBlogs((b) => [...b, ...items]);

      setHasMore(items.length === PAGE_SIZE);
    } catch (err: unknown) {
      console.warn("Failed to fetch blogs:", err);
      setError("Failed to load blog posts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // reset when query or tag changes
    setPage(1);
    setBlogs([]);
    fetchBlogs({ reset: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Load more when page changes (page 1 already loaded in initial)
    if (page === 1) return;
    fetchBlogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const visibleBlogs = useMemo(() => {
    const q = query.trim().toLowerCase();
    return blogs.filter((b) => {
      if (selectedTag && !(b.tags || []).includes(selectedTag)) return false;
      if (!q) return true;
      return (
        b.title.toLowerCase().includes(q) ||
        (b.excerpt || "").toLowerCase().includes(q) ||
        (b.tags || []).join(" ").toLowerCase().includes(q)
      );
    });
  }, [blogs, query, selectedTag]);

  const allTags = useMemo(() => {
    const s = new Set<string>();
    blogs.forEach((b) => (b.tags || []).forEach((t) => s.add(t)));
    return Array.from(s).slice(0, 40);
  }, [blogs]);

  const estimateReadingTime = (text?: string | null) => {
    if (!text) return "1 min";
    const words = text.split(/\s+/).length;
    const mins = Math.max(1, Math.round(words / 200));
    return `${mins} min`;
  };

  return (
    <>
      <Helmet>
        <title>Blog - Julin Real Estate</title>
        <meta name="description" content="Read our latest blog posts about real estate, property investment, and market insights in Kenya." />
      </Helmet>

      <Navbar />

      <main className="min-h-screen bg-background">
        <section className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">Real Estate Insights</h1>
              <p className="text-lg text-primary-foreground/90 mb-6">Actionable guides, market updates and expert tips for property buyers and investors in Kenya.</p>

              <div className="mt-6 flex items-center gap-3 justify-center">
                <div className="relative w-full max-w-xl">
                  <input
                    aria-label="Search blogs"
                    className="w-full rounded-full py-3 pl-12 pr-4 shadow-sm border border-transparent focus:outline-none focus:ring-2 focus:ring-primary/60"
                    placeholder="Search by title, excerpt or tag..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"><Search /></div>
                </div>
                <Button onClick={() => { setQuery(''); setSelectedTag(null); }}>Reset</Button>
              </div>
            </div>
          </div>
        </section>

        <section className="py-12">
          <div className="container mx-auto px-4">
            <div className="flex flex-col lg:flex-row gap-6">
              <aside className="w-full lg:w-72">
                <Card>
                  <CardHeader>
                    <CardTitle>Filters</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-4">
                      <div className="text-sm font-medium mb-2">Tags</div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          className={`px-2 py-1 rounded text-sm ${selectedTag === null ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
                          onClick={() => setSelectedTag(null)}
                        >All</button>
                        {allTags.map((t) => (
                          <button
                            key={t}
                            className={`px-2 py-1 rounded text-sm ${selectedTag === t ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
                            onClick={() => setSelectedTag((s) => (s === t ? null : t))}
                          >{t}</button>
                        ))}
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">Showing <strong>{visibleBlogs.length}</strong> posts</div>
                  </CardContent>
                </Card>
              </aside>

              <div className="flex-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {visibleBlogs.length === 0 && !loading ? (
                    <div className="col-span-full text-center py-20 text-muted-foreground">
                      <Calendar className="mx-auto mb-4 opacity-50 w-14 h-14" />
                      <h3 className="text-xl font-semibold">No posts found</h3>
                      <p className="mt-2">Try a different search or check back later.</p>
                    </div>
                  ) : (
                    (loading ? Array.from({ length: 6 }) : visibleBlogs).map((blog, idx) => {
                      if (loading) {
                        return (
                          <div key={idx} className="h-72 rounded-xl bg-gray-100 animate-pulse" />
                        );
                      }

                      return (
                        <Reveal key={(blog as Blog).id} delay={idx * 0.04}>
                          <Card className="group hover:shadow-2xl transition-shadow overflow-hidden">
                            <div className="aspect-[16/9] overflow-hidden">
                              <img
                                src={(blog as Blog).featured_image || "/placeholder.svg"}
                                alt={(blog as Blog).title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            </div>
                            <CardHeader className="pb-2">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-3">
                                  <div className="text-xs text-muted-foreground flex items-center gap-2">
                                    <User className="w-4 h-4" /> {(blog as Blog).author_name || 'Julin'}
                                  </div>
                                  <div className="text-xs text-muted-foreground">•</div>
                                  <div className="text-xs text-muted-foreground">{formatDate((blog as Blog).published_at)}</div>
                                  <div className="text-xs text-muted-foreground">•</div>
                                  <div className="text-xs text-muted-foreground">{estimateReadingTime((blog as Blog).excerpt)}</div>
                                </div>
                                <div className="text-sm text-muted-foreground">{(blog as Blog).view_count ?? 0} views</div>
                              </div>

                              <CardTitle className="line-clamp-2 text-lg">
                                <Link to={`/blog/${(blog as Blog).slug}`} className="hover:text-primary transition-colors">
                                  {(blog as Blog).title}
                                </Link>
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <p className="text-muted-foreground mb-4 line-clamp-3">{(blog as Blog).excerpt}</p>
                              <div className="flex items-center justify-between">
                                <div className="flex flex-wrap gap-2">
                                  {((blog as Blog).tags || []).slice(0, 3).map((tag) => (
                                    <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                                  ))}
                                </div>
                                <div className="flex items-center gap-2">
                                  <Link to={`/blog/${(blog as Blog).slug}`} className="text-sm text-primary hover:underline">Read more</Link>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </Reveal>
                      );
                    })
                  )}
                </div>

                <div className="mt-8 flex justify-center">
                  {hasMore && (
                    <Button onClick={() => setPage((p) => p + 1)} variant="outline">Load more</Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
};
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
