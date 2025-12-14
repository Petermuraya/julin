import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { X, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Blog } from "@/types/blog";
import { toast } from "@/components/ui/use-toast";

interface BlogFormProps {
  blog: Blog | null;
  onSave: (blog: Blog) => void;
  onCancel: () => void;
}

const BlogForm = ({ blog, onSave, onCancel }: BlogFormProps) => {
  const [form, setForm] = useState({
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    featured_image: "",
    author_name: "",
    published: false,
    tags: [] as string[],
    seo_title: "",
    seo_description: "",
    seo_keywords: [] as string[],
  });

  const [tagInput, setTagInput] = useState("");
  const [keywordInput, setKeywordInput] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (blog) {
      setForm({
        title: blog.title,
        slug: blog.slug,
        excerpt: blog.excerpt || "",
        content: blog.content,
        featured_image: blog.featured_image || "",
        author_name: blog.author_name || "",
        published: blog.published,
        tags: blog.tags || [],
        seo_title: blog.seo_title || "",
        seo_description: blog.seo_description || "",
        seo_keywords: blog.seo_keywords || [],
      });
    }
  }, [blog]);

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  };

  const handleTitleChange = (title: string) => {
    setForm(prev => ({
      ...prev,
      title,
      slug: generateSlug(title),
      seo_title: prev.seo_title || title,
    }));
  };

  const addTag = () => {
    if (tagInput.trim() && !form.tags.includes(tagInput.trim())) {
      setForm(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()],
      }));
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setForm(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove),
    }));
  };

  const addKeyword = () => {
    if (keywordInput.trim() && !form.seo_keywords.includes(keywordInput.trim())) {
      setForm(prev => ({
        ...prev,
        seo_keywords: [...prev.seo_keywords, keywordInput.trim()],
      }));
      setKeywordInput("");
    }
  };

  const removeKeyword = (keywordToRemove: string) => {
    setForm(prev => ({
      ...prev,
      seo_keywords: prev.seo_keywords.filter(keyword => keyword !== keywordToRemove),
    }));
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.content.trim()) {
      toast({
        title: "Error",
        description: "Title and content are required",
        variant: "destructive",
      });
      return;
    }

    try {
      setSaving(true);
      const blogData = {
        ...form,
        published_at: form.published ? new Date().toISOString() : null,
      };

      let savedBlog: Blog;

      if (blog) {
        // Update existing blog
        const { data, error } = await supabase
          .from("blogs")
          .update(blogData)
          .eq("id", blog.id)
          .select()
          .single();

        if (error) throw error;
        savedBlog = data;
      } else {
        // Create new blog
        const { data, error } = await supabase
          .from("blogs")
          .insert(blogData)
          .select()
          .single();

        if (error) throw error;
        savedBlog = data;
      }

      onSave(savedBlog);
      toast({
        title: "Success",
        description: `Blog ${blog ? 'updated' : 'created'} successfully`,
      });
    } catch (err: any) {
      console.error("Error saving blog:", err);
      toast({
        title: "Error",
        description: `Failed to ${blog ? 'update' : 'create'} blog`,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic Information */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={form.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Enter blog title"
            />
          </div>

          <div>
            <Label htmlFor="slug">Slug</Label>
            <Input
              id="slug"
              value={form.slug}
              onChange={(e) => setForm(prev => ({ ...prev, slug: e.target.value }))}
              placeholder="url-friendly-slug"
            />
          </div>

          <div>
            <Label htmlFor="author">Author Name</Label>
            <Input
              id="author"
              value={form.author_name}
              onChange={(e) => setForm(prev => ({ ...prev, author_name: e.target.value }))}
              placeholder="Author name"
            />
          </div>

          <div>
            <Label htmlFor="excerpt">Excerpt</Label>
            <Textarea
              id="excerpt"
              value={form.excerpt}
              onChange={(e) => setForm(prev => ({ ...prev, excerpt: e.target.value }))}
              placeholder="Brief description of the blog post"
              rows={3}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="published"
              checked={form.published}
              onCheckedChange={(checked) =>
                setForm(prev => ({ ...prev, published: checked as boolean }))
              }
            />
            <Label htmlFor="published">Publish immediately</Label>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="content">Content *</Label>
            <Textarea
              id="content"
              value={form.content}
              onChange={(e) => setForm(prev => ({ ...prev, content: e.target.value }))}
              placeholder="Write your blog content here..."
              rows={12}
            />
          </div>

          <div>
            <Label htmlFor="featured_image">Featured Image URL</Label>
            <Input
              id="featured_image"
              value={form.featured_image}
              onChange={(e) => setForm(prev => ({ ...prev, featured_image: e.target.value }))}
              placeholder="https://example.com/image.jpg"
            />
          </div>
        </div>
      </div>

      {/* Tags */}
      <div>
        <Label>Tags</Label>
        <div className="flex gap-2 mt-2">
          <Input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            placeholder="Add a tag"
            onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
          />
          <Button type="button" onClick={addTag} variant="outline">
            Add
          </Button>
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          {form.tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="flex items-center gap-1">
              {tag}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => removeTag(tag)}
              />
            </Badge>
          ))}
        </div>
      </div>

      {/* SEO Settings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="seo_title">SEO Title</Label>
          <Input
            id="seo_title"
            value={form.seo_title}
            onChange={(e) => setForm(prev => ({ ...prev, seo_title: e.target.value }))}
            placeholder="SEO optimized title"
          />
        </div>

        <div>
          <Label htmlFor="seo_description">SEO Description</Label>
          <Textarea
            id="seo_description"
            value={form.seo_description}
            onChange={(e) => setForm(prev => ({ ...prev, seo_description: e.target.value }))}
            placeholder="SEO meta description"
            rows={3}
          />
        </div>
      </div>

      {/* SEO Keywords */}
      <div>
        <Label>SEO Keywords</Label>
        <div className="flex gap-2 mt-2">
          <Input
            value={keywordInput}
            onChange={(e) => setKeywordInput(e.target.value)}
            placeholder="Add a keyword"
            onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addKeyword())}
          />
          <Button type="button" onClick={addKeyword} variant="outline">
            Add
          </Button>
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          {form.seo_keywords.map((keyword) => (
            <Badge key={keyword} variant="outline" className="flex items-center gap-1">
              {keyword}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => removeKeyword(keyword)}
              />
            </Badge>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-4">
        <Button variant="outline" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : (blog ? "Update" : "Create")} Blog
        </Button>
      </div>
    </div>
  );
};

export default BlogForm;