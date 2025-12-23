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
    title: "Understanding Land Titles in Kenya",
    slug: "understanding-land-titles-kenya",
    excerpt: "A comprehensive breakdown of different land title types.",
    published: true,
    published_at: "2024-11-01",
    author_name: "Julin Real Estate",
    tags: ["Legal", "Land Titles"],
    view_count: 189
  }
];

import Reveal from "@/components/ui/Reveal";

const AdminBlogs = () => {
  const [blogSuggestions, setBlogSuggestions] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

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
        <Button disabled>
          <Plus className="h-4 w-4 mr-2" />
          New Blog Post
        </Button>
      </div>

      {/* Database Notice */}
      <Card className="border-amber-500/50 bg-amber-500/10">
        <CardContent className="flex items-center gap-3 p-4">
          <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0" />
          <div>
            <p className="font-medium text-foreground">Blog Database Not Configured</p>
            <p className="text-sm text-muted-foreground">
              The blogs table needs to be created in Supabase to enable full CRUD functionality. 
              Currently showing sample content for preview purposes.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sampleBlogs.length}</div>
            <p className="text-xs text-muted-foreground">Sample data</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Published</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {sampleBlogs.filter(blog => blog.published).length}
            </div>
            <p className="text-xs text-muted-foreground">Sample data</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {sampleBlogs.reduce((sum, blog) => sum + blog.view_count, 0)}
            </div>
            <p className="text-xs text-muted-foreground">Sample data</p>
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
          <CardTitle>Sample Blog Posts</CardTitle>
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
              {sampleBlogs.map((blog) => (
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
                  <TableCell>{blog.author_name}</TableCell>
                  <TableCell>
                    {blog.published_at ? formatDate(blog.published_at) : "-"}
                  </TableCell>
                  <TableCell>{blog.view_count}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" disabled>
                        {blog.published ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                      <Button variant="ghost" size="sm" disabled>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" disabled>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" asChild>
                        <a href={`/blog/${blog.slug}`} target="_blank" rel="noopener noreferrer">
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
      </div>
    </Reveal>
  );
};

export default AdminBlogs;
