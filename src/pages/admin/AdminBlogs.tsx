import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit2, Trash2, Search, Eye, EyeOff, Upload, X, Image as ImageIcon } from "lucide-react";

type BlogForm = {
  title: string;
  excerpt: string;
  content: string;
  featured_image: string;
  tags: string;
  seo_title: string;
  seo_description: string;
  seo_keywords: string;
  published: boolean;
};

const emptyForm: BlogForm = {
  title: "",
  excerpt: "",
  content: "",
  featured_image: "",
  tags: "",
  seo_title: "",
  seo_description: "",
  seo_keywords: "",
  published: false,
};

const AdminBlogs = () => {
  const [blogs, setBlogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<BlogForm>(emptyForm);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredBlogs = blogs.filter(
    (blog) =>
      blog.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      blog.excerpt?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    loadBlogs();
  }, []);

  const loadBlogs = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("blogs")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) console.error(error);
    setBlogs(data || []);
    setLoading(false);
  };

  const openAddDialog = () => {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEditDialog = (blog: any) => {
    setEditingId(blog.id);
    setForm({
      title: blog.title || "",
      excerpt: blog.excerpt || "",
      content: blog.content || "",
      featured_image: blog.featured_image || "",
      tags: blog.tags?.join(", ") || "",
      seo_title: blog.seo_title || "",
      seo_description: blog.seo_description || "",
      seo_keywords: blog.seo_keywords?.join(", ") || "",
      published: blog.published || false,
    });
    setDialogOpen(true);
  };

  const handleSaveBlog = async () => {
    setSaving(true);
    try {
      // Validation
      if (!form.title.trim()) throw new Error("Title is required");
      if (!form.content.trim()) throw new Error("Content is required");

      const blogData = {
        title: form.title.trim(),
        excerpt: form.excerpt.trim() || null,
        content: form.content.trim(),
        featured_image: form.featured_image.trim() || null,
        tags: form.tags ? form.tags.split(",").map((t: string) => t.trim()).filter(Boolean) : null,
        seo_title: form.seo_title.trim() || null,
        seo_description: form.seo_description.trim() || null,
        seo_keywords: form.seo_keywords ? form.seo_keywords.split(",").map((k: string) => k.trim()).filter(Boolean) : null,
        published: form.published,
        published_at: form.published ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      };

      if (editingId) {
        // UPDATE existing blog
        const { error } = await supabase
          .from("blogs")
          .update(blogData)
          .eq("id", editingId);

        if (error) throw error;

        setBlogs((b) =>
          b.map((x) => (x.id === editingId ? { ...x, ...blogData } : x))
        );
        toast({ title: "Success", description: "Blog updated successfully." });
      } else {
        // CREATE new blog
        const { data: newBlog, error: insertError } = await supabase
          .from("blogs")
          .insert(blogData)
          .select()
          .single();

        if (insertError) throw insertError;

        setBlogs((b) => [newBlog, ...b]);
        toast({ title: "Success", description: "Blog created successfully." });
      }

      setDialogOpen(false);
      setForm(emptyForm);
      setEditingId(null);
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Error",
        description: err?.message || "Failed to save blog.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const deleteBlog = async (id: string) => {
    if (!confirm("Are you sure you want to delete this blog post?")) return;

    try {
      const { error } = await supabase.from("blogs").delete().eq("id", id);
      if (error) throw error;

      setBlogs((b) => b.filter((x) => x.id !== id));
      toast({ title: "Deleted", description: "Blog post removed successfully." });
    } catch (err: any) {
      console.error(err);
      toast({ title: "Error", description: err?.message || "Failed to delete blog post.", variant: "destructive" });
    }
  };

  const togglePublished = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("blogs")
        .update({
          published: !currentStatus,
          published_at: !currentStatus ? new Date().toISOString() : null
        })
        .eq("id", id);

      if (error) throw error;

      setBlogs((b) =>
        b.map((x) => (x.id === id ? { ...x, published: !currentStatus, published_at: !currentStatus ? new Date().toISOString() : null } : x))
      );
      toast({ title: "Success", description: `Blog ${!currentStatus ? 'published' : 'unpublished'} successfully.` });
    } catch (err: any) {
      console.error(err);
      toast({ title: "Error", description: "Failed to update blog status.", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Blog Posts</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">Manage your blog content</p>
        </div>
        <Button onClick={openAddDialog} className="bg-blue-600 hover:bg-blue-700 inline-flex items-center gap-2">
          <Plus size={18} />
          Add Blog Post
        </Button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-3 text-slate-400" size={20} />
        <Input
          placeholder="Search blog posts by title or excerpt..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 py-2 h-10"
        />
      </div>

      {/* Blogs Table */}
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin inline-block w-8 h-8 border-4 border-slate-300 border-t-blue-600 rounded-full"></div>
            <p className="mt-2 text-slate-600 dark:text-slate-400">Loading blog posts...</p>
          </div>
        ) : filteredBlogs.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-slate-600 dark:text-slate-400 text-lg">
              {searchQuery ? "No blog posts found matching your search" : "No blog posts yet"}
            </p>
            <Button onClick={openAddDialog} variant="outline" className="mt-4">
              Create your first blog post
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-700 border-b border-slate-200 dark:border-slate-600">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900 dark:text-white">Blog Post</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900 dark:text-white">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900 dark:text-white">Published</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900 dark:text-white">Views</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-slate-900 dark:text-white">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {filteredBlogs.map((blog) => (
                  <tr key={blog.id} className="hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {blog.featured_image ? (
                          <img src={blog.featured_image} alt={blog.title} className="w-12 h-12 rounded-lg object-cover" />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-slate-200 dark:bg-slate-600 flex items-center justify-center">
                            <ImageIcon size={20} className="text-slate-400" />
                          </div>
                        )}
                        <div>
                          <div className="font-medium text-slate-900 dark:text-white">{blog.title}</div>
                          <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-1">{blog.excerpt}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={blog.published ? "default" : "secondary"} className="capitalize text-xs">
                        {blog.published ? 'Published' : 'Draft'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                      {blog.published_at ? new Date(blog.published_at).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                      {blog.view_count || 0}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => togglePublished(blog.id, blog.published)}
                          className={`h-8 w-8 p-0 ${blog.published ? 'text-green-600 hover:text-green-700' : 'text-orange-600 hover:text-orange-700'}`}
                        >
                          {blog.published ? <Eye size={16} /> : <EyeOff size={16} />}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openEditDialog(blog)}
                          className="h-8 w-8 p-0 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                        >
                          <Edit2 size={16} />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteBlog(blog.id)}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950"
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Blog Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(v) => { setDialogOpen(v); if (!v) { setEditingId(null); } }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">{editingId ? "Edit Blog Post" : "Add New Blog Post"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid grid-cols-1 gap-4">
              <Input
                placeholder="Blog Title *"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              />
              <Textarea
                placeholder="Excerpt (short description)"
                value={form.excerpt}
                onChange={(e) => setForm((f) => ({ ...f, excerpt: e.target.value }))}
                className="min-h-20"
              />
            </div>

            <Textarea
              placeholder="Blog Content (HTML or Markdown) *"
              value={form.content}
              onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
              className="min-h-40"
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                placeholder="Featured Image URL"
                value={form.featured_image}
                onChange={(e) => setForm((f) => ({ ...f, featured_image: e.target.value }))}
              />
              <Input
                placeholder="Tags (comma separated)"
                value={form.tags}
                onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
              />
            </div>

            <div className="border-t pt-4">
              <h3 className="text-lg font-semibold mb-4">SEO Settings</h3>
              <div className="grid grid-cols-1 gap-4">
                <Input
                  placeholder="SEO Title"
                  value={form.seo_title}
                  onChange={(e) => setForm((f) => ({ ...f, seo_title: e.target.value }))}
                />
                <Textarea
                  placeholder="SEO Description"
                  value={form.seo_description}
                  onChange={(e) => setForm((f) => ({ ...f, seo_description: e.target.value }))}
                  className="min-h-20"
                />
                <Input
                  placeholder="SEO Keywords (comma separated)"
                  value={form.seo_keywords}
                  onChange={(e) => setForm((f) => ({ ...f, seo_keywords: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="published"
                checked={form.published}
                onChange={(e) => setForm((f) => ({ ...f, published: e.target.checked }))}
                className="w-4 h-4"
              />
              <label htmlFor="published" className="text-sm font-medium">
                Publish immediately
              </label>
            </div>
          </div>

          <DialogFooter className="flex gap-2 sm:justify-end">
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveBlog}
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {saving ? "Saving..." : (editingId ? "Update Blog Post" : "Create Blog Post")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminBlogs;