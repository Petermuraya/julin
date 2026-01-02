import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { X, Sparkles, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Blog } from "@/types/blog";

interface BlogFormProps {
  blog?: Blog | null;
  onSave?: (blog: Blog) => void;
  onCancel?: () => void;
}

const BlogForm = ({ blog, onSave, onCancel }: BlogFormProps) => {
  const [form, setForm] = useState({
    title: blog?.title || "",
    slug: blog?.slug || "",
    excerpt: blog?.excerpt || "",
    content: blog?.content || "",
    featured_image: blog?.featured_image || "",
    author_name: blog?.author_name || "",
    published: blog?.published || false,
    tags: blog?.tags || [] as string[],
    seo_title: blog?.seo_title || "",
    seo_description: blog?.seo_description || "",
    seo_keywords: blog?.seo_keywords || [] as string[],
  });

  const [tagInput, setTagInput] = useState("");
  const [keywordInput, setKeywordInput] = useState("");
  const [generating, setGenerating] = useState(false);

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

  const generateWithAI = async (type: 'content' | 'excerpt' | 'seo') => {
    if (!form.title.trim()) {
      toast.error("Please enter a title first");
      return;
    }

    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('chat', {
        body: { 
          type: 'generate_blog',
          topic: form.title
        }
      });

      if (error) throw error;
      
      if (data) {
        if (type === 'content' && data.content) {
          setForm(prev => ({ ...prev, content: data.content }));
        } else if (type === 'excerpt' && data.excerpt) {
          setForm(prev => ({ ...prev, excerpt: data.excerpt }));
        } else if (type === 'seo') {
          setForm(prev => ({ 
            ...prev, 
            seo_title: data.seo_title || prev.title,
            seo_description: data.seo_description || prev.excerpt
          }));
        }
        toast.success("AI content generated!");
      }
    } catch (err) {
      console.error("Error generating with AI:", err);
      toast.error("Failed to generate content");
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = () => {
    toast.info("Blog saving requires database configuration. Please create the blogs table in Supabase.");
  };

  return (
    <div className="space-y-6">
      {/* Database Notice */}
      <div className="flex items-center gap-3 p-4 bg-amber-500/10 border border-amber-500/50 rounded-lg">
        <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0" />
        <p className="text-sm text-muted-foreground">
          Blog database not configured. Form is available for preview but saving is disabled.
        </p>
      </div>

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
            <div className="flex items-center justify-between mb-2">
              <Label htmlFor="excerpt">Excerpt</Label>
              <Button 
                type="button" 
                variant="ghost" 
                size="sm"
                onClick={() => generateWithAI('excerpt')}
                disabled={generating}
              >
                <Sparkles className="h-4 w-4 mr-1" />
                AI Generate
              </Button>
            </div>
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
            <div className="flex items-center justify-between mb-2">
              <Label htmlFor="content">Content *</Label>
              <Button 
                type="button" 
                variant="ghost" 
                size="sm"
                onClick={() => generateWithAI('content')}
                disabled={generating}
              >
                <Sparkles className="h-4 w-4 mr-1" />
                AI Generate
              </Button>
            </div>
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
          <div className="flex items-center justify-between mb-2">
            <Label htmlFor="seo_title">SEO Title</Label>
            <Button 
              type="button" 
              variant="ghost" 
              size="sm"
              onClick={() => generateWithAI('seo')}
              disabled={generating}
            >
              <Sparkles className="h-4 w-4 mr-1" />
              AI Generate
            </Button>
          </div>
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
        {onCancel && (
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button onClick={handleSave} disabled>
          {blog ? "Update" : "Create"} Blog (Database Required)
        </Button>
      </div>
    </div>
  );
};

export default BlogForm;
