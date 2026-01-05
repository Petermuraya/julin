import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  BookOpen, 
  Plus, 
  Eye, 
  EyeOff, 
  Edit, 
  Trash2, 
  AlertCircle,
  Sparkles,
  Lightbulb
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

// AdminBlogs now uses real data from the `blogs` table; removed sample/demo entries.

import Reveal from "@/components/ui/Reveal";
import { useEffect } from "react";
import BlogForm from "@/components/admin/BlogForm";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type BlogRow = {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  published: boolean;
  published_at?: string | null;
  author_name?: string | null;
  tags?: string[] | null;
  view_count?: number;
};

const AdminBlogs = () => {
  const [blogSuggestions, setBlogSuggestions] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [blogs, setBlogs] = useState<BlogRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<BlogRow | null>(null);

  const generateBlogSuggestions = async () => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('chat', {
        body: { type: 'blog_suggestion' }
      });

      if (error) throw error;

      if (data?.suggestions) {
        setBlogSuggestions(data.suggestions);
        toast.success("Blog suggestions generated!");
      }
    } catch (error) {
      console.error('Error generating suggestions:', error);
      // Fallback suggestions
      setBlogSuggestions([
        "5 Things to Check Before Buying Land in Kenya",
        "How to Verify a Land Title Deed",
        "Best Counties for Real Estate Investment in 2024",
        "Understanding Property Taxes in Kenya",
        "Tips for First-Time Home Buyers"
      ]);
      toast.success("Sample suggestions loaded");
    } finally {
      setIsGenerating(false);
    }
  };

  const loadBlogs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('blogs').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setBlogs(((data as unknown) as BlogRow[]) || []);
    } catch (err) {
      console.error('Failed to load blogs:', err);
      setBlogs([]);
    } finally { setLoading(false); }
  };

  useEffect(() => { loadBlogs(); }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <Reveal>
      <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Blog Posts</h1>
          <p className="text-muted-foreground mt-1">Manage your blog content</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => { setEditing(null); setFormOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            New Blog Post
          </Button>
          <Button onClick={loadBlogs} variant="outline">Refresh</Button>
        </div>
      </div>

      {/* Database Notice */}
      {/* Stats Cards */}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{blogs.length}</div>
            <p className="text-xs text-muted-foreground">From database</p>
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
            <p className="text-xs text-muted-foreground">From database</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {blogs.reduce((sum, blog) => sum + (blog.view_count ?? 0), 0)}
            </div>
            <p className="text-xs text-muted-foreground">From database</p>
          </CardContent>
        </Card>
      </div>

      {/* AI Blog Suggestions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-primary" />
            AI Blog Suggestions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={generateBlogSuggestions} 
            disabled={isGenerating}
            variant="outline"
          >
            <Sparkles className="mr-2 h-4 w-4" />
            {isGenerating ? "Generating..." : "Generate Blog Ideas"}
          </Button>

          {blogSuggestions.length > 0 && (
            <div className="grid gap-2">
              {blogSuggestions.map((suggestion, index) => (
                <div 
                  key={index}
                  className="flex items-center justify-between p-3 bg-muted rounded-lg"
                >
                  <span className="text-sm">{suggestion}</span>
                  <Badge variant="outline">Idea</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Blogs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Blog Posts</CardTitle>
        </CardHeader>
        <CardContent>
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
              {blogs.map((b) => (
                <TableRow key={b.id}>
                  <TableCell className="font-medium max-w-xs">
                    <div className="truncate" title={b.title}>
                      {b.title}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={b.published ? "default" : "secondary"}>
                      {b.published ? "Published" : "Draft"}
                    </Badge>
                  </TableCell>
                  <TableCell>{b.author_name || "-"}</TableCell>
                  <TableCell>
                    {b.published_at ? formatDate(b.published_at) : "-"}
                  </TableCell>
                  <TableCell>{b.view_count ?? 0}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={async () => {
                          try {
                            const { data, error } = await supabase.from('blogs').update({ published: !b.published, published_at: !b.published ? new Date().toISOString() : null }).eq('id', b.id).select().single();
                            if (error) throw error;
                            toast.success('Publish status updated');
                            loadBlogs();
                          } catch (err) { console.error(err); toast.error('Failed to update'); }
                        }}
                      >
                        {b.published ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => { setEditing(b as any); setFormOpen(true); }}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={async () => {
                        if (!confirm('Delete this blog post?')) return;
                        try {
                          const { error } = await supabase.from('blogs').delete().eq('id', b.id);
                          if (error) throw error;
                          toast.success('Blog deleted');
                          loadBlogs();
                        } catch (err) { console.error(err); toast.error('Delete failed'); }
                      }}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" asChild>
                        <a href={`/blog/${b.slug}`} target="_blank" rel="noopener noreferrer">
                          <Eye className="h-4 w-4" />
                        </a>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Blog Form Dialog */}
      <Dialog open={formOpen} onOpenChange={(v) => setFormOpen(v)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Blog' : 'New Blog'}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <BlogForm blog={editing as any} onSave={(saved) => { setFormOpen(false); loadBlogs(); }} onCancel={() => setFormOpen(false)} />
          </div>
        </DialogContent>
      </Dialog>
      </div>
    </Reveal>
  );
};

export default AdminBlogs;
