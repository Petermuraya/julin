import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BookOpen, Plus, Edit, Trash2, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Blog } from "@/types/blog";
import { toast } from "@/components/ui/use-toast";
import BlogForm from "@/components/admin/BlogForm";

const AdminBlogs = () => {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [legalGuideDialogOpen, setLegalGuideDialogOpen] = useState(false);
  const [editingBlog, setEditingBlog] = useState<Blog | null>(null);
  const [legalGuideBlog, setLegalGuideBlog] = useState<Blog | null>(null);

  useEffect(() => {
    fetchBlogs();
  }, []);

  const fetchBlogs = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("blogs")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        if (error.message.includes('relation "public.blogs" does not exist')) {
          setBlogs([]);
          setLoading(false);
          return;
        }
        throw error;
      }
      setBlogs((data || []) as unknown as Blog[]);
    } catch (err: any) {
      console.error("Error fetching blogs:", err);
      toast({
        title: "Error",
        description: "Failed to load blogs",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this blog post?")) return;

    try {
      const { error } = await supabase.from("blogs").delete().eq("id", id);
      if (error) throw error;

      setBlogs(blogs.filter(blog => blog.id !== id));
      toast({
        title: "Success",
        description: "Blog post deleted successfully",
      });
    } catch (err: any) {
      console.error("Error deleting blog:", err);
      toast({
        title: "Error",
        description: "Failed to delete blog post",
        variant: "destructive",
      });
    }
  };

  const handleCreateLegalGuide = () => {
    const legalGuideContent = {
      id: '',
      title: 'Legal Issues in Kenya Land and Real Estate: A Comprehensive Guide',
      slug: 'legal-issues-kenya-land-real-estate-guide',
      excerpt: 'Land ownership and real estate development are central to Kenya\'s economic growth. However, the sector is one of the most legally sensitive areas due to historical land injustices, fraud, overlapping laws, and administrative inefficiencies.',
      content: `Introduction

Land ownership and real estate development are central to Kenya's economic growth. However, the sector is one of the most legally sensitive areas due to historical land injustices, fraud, overlapping laws, and administrative inefficiencies. Whether you are purchasing land, developing property, or investing in real estate, awareness of the legal landscape is critical.

This article explores the most common legal issues affecting land and real estate in Kenya and offers practical guidance on how to navigate them.

1. Land Ownership and Title Deeds

One of the most common legal issues in Kenya is uncertainty over land ownership. Many disputes arise from:

Fake or forged title deeds

Multiple titles issued for the same parcel of land

Incomplete succession processes for inherited land

Historical land injustices

Before acquiring land, it is essential to conduct an official land search at the Ministry of Lands to confirm ownership, encumbrances, and land status.

2. Land Fraud and Scams

Land fraud remains a major concern in Kenya's real estate sector. Common scams include:

Selling land without legal authority

Impersonation of landowners

Sale of public or government land

Double sale of the same property

Engaging a qualified advocate, conducting due diligence, and verifying documents can significantly reduce the risk of fraud.

3. Land Use and Zoning Regulations

Kenya has strict land use and zoning regulations governed by county governments and physical planning laws. Legal issues often arise when:

Property is used contrary to its approved purpose

Developments lack planning approval

Environmental impact assessments are ignored

Failure to comply may lead to penalties, demolition orders, or denial of occupancy certificates.

4. Leasehold vs Freehold Land

Land in Kenya is held under either freehold or leasehold tenure. Leasehold land, often issued for 33, 50, or 99 years, requires renewal upon expiry. Legal challenges may occur if:

Lease renewal applications are delayed or rejected

Conditions of the lease are breached

Ground rent and land rates are unpaid

Property owners should monitor lease terms closely to avoid loss of rights.

5. Succession and Inheritance Disputes

Real estate disputes frequently arise after the death of a landowner, especially where no will exists. Issues include:

Unauthorized sale of inherited property

Family disputes over land distribution

Delays in succession proceedings

Under Kenyan law, property of a deceased person can only be transferred through a lawful succession process.

6. Property Taxes, Rates, and Charges

Landowners are legally required to pay land rates, rent, and other statutory charges. Failure to comply may result in:

Accumulation of penalties and interest

Restrictions on property transfers

Auction of property by county governments

Regular compliance ensures smooth transactions and protects ownership rights.

7. Dispute Resolution in Land Matters

Land and real estate disputes are handled by the Environment and Land Court (ELC) in Kenya. Alternative dispute resolution methods such as mediation and arbitration are also encouraged to reduce costs and delays.

Early legal advice can help resolve disputes efficiently and prevent prolonged litigation.

Conclusion

Land and real estate transactions in Kenya require careful legal consideration. From verifying ownership to complying with planning laws and tax obligations, understanding the legal framework is essential for protecting investments. Engaging qualified professionals and conducting thorough due diligence can help avoid costly mistakes.

If you are planning to buy, sell, or invest in land or real estate in Kenya, seeking legal guidance is not just advisable—it is necessary.`,
      featured_image: '',
      author_id: null,
      author_name: 'Julius Murigi',
      published: false,
      published_at: null,
      tags: ['Kenya', 'Real Estate', 'Legal Issues', 'Land Ownership', 'Property Law'],
      seo_title: 'Legal Issues in Kenya Land and Real Estate: Complete Guide 2025',
      seo_description: 'Comprehensive guide to legal issues affecting land and real estate in Kenya. Learn about title deeds, fraud prevention, zoning laws, and dispute resolution.',
      seo_keywords: ['Kenya land law', 'real estate legal issues', 'property ownership Kenya', 'land fraud prevention', 'Kenya property taxes'],
      view_count: 0,
      created_at: '',
      updated_at: ''
    };

    setLegalGuideBlog(legalGuideContent as Blog);
  };

  const handleTogglePublish = async (blog: Blog) => {
    try {
      const updates = {
        published: !blog.published,
        published_at: !blog.published ? new Date().toISOString() : null,
      };

      const { error } = await supabase
        .from("blogs")
        .update(updates as any)
        .eq("id", blog.id);

      if (error) throw error;

      setBlogs(blogs.map(b =>
        b.id === blog.id
          ? { ...b, ...updates }
          : b
      ));

      toast({
        title: "Success",
        description: `Blog ${updates.published ? 'published' : 'unpublished'} successfully`,
      });
    } catch (err: any) {
      console.error("Error toggling publish status:", err);
      toast({
        title: "Error",
        description: "Failed to update publish status",
        variant: "destructive",
      });
    }
  };

  const handleSave = (blog: Blog) => {
    if (editingBlog) {
      setBlogs(blogs.map(b => b.id === blog.id ? blog : b));
    } else {
      setBlogs([blog, ...blogs]);
    }
    setDialogOpen(false);
    setEditingBlog(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Blog Posts</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">Manage your blog content</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingBlog(null)} variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                New Blog Post
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingBlog ? "Edit Blog Post" : "Create New Blog Post"}
                </DialogTitle>
              </DialogHeader>
              <BlogForm
                blog={editingBlog}
                onSave={handleSave}
                onCancel={() => {
                  setDialogOpen(false);
                  setEditingBlog(null);
                }}
              />
            </DialogContent>
          </Dialog>

          <Dialog open={legalGuideDialogOpen} onOpenChange={setLegalGuideDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleCreateLegalGuide}>
                <BookOpen className="h-4 w-4 mr-2" />
                Create Legal Guide
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create Legal Issues Guide</DialogTitle>
              </DialogHeader>
              <BlogForm
                blog={legalGuideBlog}
                onSave={handleSave}
                onCancel={() => {
                  setLegalGuideDialogOpen(false);
                  setLegalGuideBlog(null);
                }}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{blogs.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Published</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {blogs.filter(blog => blog.published).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Draft</CardTitle>
            <EyeOff className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {blogs.filter(blog => !blog.published).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Blogs Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Blog Posts</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p>Loading blogs...</p>
            </div>
          ) : blogs.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No blog posts yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first blog post to get started.
              </p>
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Blog Post
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Author</TableHead>
                  <TableHead>Published</TableHead>
                  <TableHead>Views</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {blogs.map((blog) => (
                  <TableRow key={blog.id}>
                    <TableCell className="font-medium max-w-xs">
                      <div className="truncate" title={blog.title}>
                        {blog.title}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={blog.published ? "default" : "secondary"}>
                        {blog.published ? "Published" : "Draft"}
                      </Badge>
                    </TableCell>
                    <TableCell>{blog.author_name || "Unknown"}</TableCell>
                    <TableCell>
                      {blog.published_at ? formatDate(blog.published_at) : "-"}
                    </TableCell>
                    <TableCell>{blog.view_count || 0}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleTogglePublish(blog)}
                        >
                          {blog.published ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingBlog(blog);
                            setDialogOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(blog.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminBlogs;
