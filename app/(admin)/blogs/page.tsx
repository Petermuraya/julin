"use client";
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
import Reveal from "@/components/ui/Reveal";

// Sample blog data for preview
const sampleBlogs = [
  {
    id: "1",
    title: "Complete Guide to Buying Land in Kenya",
    slug: "guide-to-buying-land-in-kenya",
    excerpt: "Everything you need to know about purchasing land in Kenya.",
    published: true,
    published_at: "2024-12-01",
    author_name: "Julin Real Estate",
    tags: ["Land", "Buying Guide"],
    view_count: 156
  },
  {
    id: "2",
    title: "Top Investment Areas in Nairobi for 2024",
    slug: "top-investment-areas-nairobi-2024",
    excerpt: "Discover the most promising neighborhoods for real estate investment.",
    published: true,
    published_at: "2024-11-15",
    author_name: "Julin Real Estate",
    tags: ["Investment", "Nairobi"],
    view_count: 243
  },
  {
    id: "3",
    title: "Understanding Title Deeds in Kenya",
    slug: "understanding-title-deeds-kenya",
    excerpt: "A comprehensive guide to property documentation.",
    published: false,
    published_at: null,
    author_name: "Julin Real Estate",
    tags: ["Legal", "Documentation"],
    view_count: 89
  }
];

export default function AdminBlogsPage() {
  const [blogs] = useState(sampleBlogs);
  const [selectedBlog, setSelectedBlog] = useState<typeof sampleBlogs[0] | null>(null);

  const handleTogglePublish = (blogId: string) => {
    toast.success("Blog status updated");
  };

  const handleEdit = (blog: typeof sampleBlogs[0]) => {
    setSelectedBlog(blog);
  };

  const handleDelete = (blogId: string) => {
    toast.success("Blog deleted successfully");
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <Reveal>
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <BookOpen className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold text-primary">Blog Posts</h1>
          </div>
          <p className="text-muted-foreground">
            Manage your blog content and SEO performance
          </p>
        </div>
      </Reveal>

      <Reveal delay={0.1}>
        <div className="grid gap-6 mb-6 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{blogs.length}</div>
              <p className="text-xs text-muted-foreground">
                {blogs.filter(b => b.published).length} published
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Views</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {blogs.reduce((sum, b) => sum + b.view_count, 0)}
              </div>
              <p className="text-xs text-muted-foreground">Across all posts</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Drafts</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {blogs.filter(b => !b.published).length}
              </div>
              <p className="text-xs text-muted-foreground">Unpublished</p>
            </CardContent>
          </Card>
        </div>
      </Reveal>

      <Reveal delay={0.2}>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>All Blog Posts</CardTitle>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Post
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Views</TableHead>
                  <TableHead>Published</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {blogs.map((blog) => (
                  <TableRow key={blog.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{blog.title}</div>
                        <div className="text-sm text-muted-foreground">
                          {blog.excerpt}
                        </div>
                        <div className="flex gap-1 mt-1">
                          {blog.tags.map(tag => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={blog.published ? "default" : "secondary"}>
                        {blog.published ? "Published" : "Draft"}
                      </Badge>
                    </TableCell>
                    <TableCell>{blog.view_count}</TableCell>
                    <TableCell>
                      {blog.published_at || "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleTogglePublish(blog.id)}
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
                          onClick={() => handleEdit(blog)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(blog.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </Reveal>
    </div>
  );
}