import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { X, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Blog } from "@/types/blog";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';

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
  const [featuredFile, setFeaturedFile] = useState<File | null>(null);
  const [uploadingFeatured, setUploadingFeatured] = useState(false);
  const [featuredUploadProgress, setFeaturedUploadProgress] = useState(0);

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
    // Insert or update blog in Supabase
    (async () => {
      try {
        // basic validation
        if (!form.title.trim()) return toast.error('Title is required');
        if (!form.slug.trim()) return toast.error('Slug is required');

        const payload: any = {
          title: form.title.trim(),
          slug: form.slug.trim(),
          excerpt: form.excerpt || null,
          content: form.content || null,
          featured_image: form.featured_image || null,
          author_name: form.author_name || null,
          published: !!form.published,
          tags: form.tags && form.tags.length ? form.tags : null,
          seo_title: form.seo_title || null,
          seo_description: form.seo_description || null,
          seo_keywords: form.seo_keywords && form.seo_keywords.length ? form.seo_keywords : null,
          updated_at: new Date().toISOString(),
        };

        if (blog && blog.id) {
          // update
          const { data, error } = await supabase.from('blogs').update(payload).eq('id', blog.id).select().single();
          if (error) throw error;
          toast.success('Blog updated');
          onSave && onSave(data as Blog);
        } else {
          // insert
          payload.created_at = new Date().toISOString();
          payload.view_count = 0;
          if (payload.published) payload.published_at = new Date().toISOString();
          const { data, error } = await supabase.from('blogs').insert(payload).select().single();
          if (error) throw error;
          toast.success('Blog created');
          onSave && onSave(data as Blog);
        }
      } catch (err: unknown) {
        console.error('Blog save error:', err);
        const msg = err instanceof Error ? err.message : String(err);
        toast.error(msg || 'Failed to save blog');
      }
    })();
  };

  const handleFeaturedFileChange = async (file?: File | null) => {
    if (!file) return;
    // Validate file type
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) return toast.error('Unsupported image format. Use JPG, PNG or WebP.');
    // limit to 5MB
    if (file.size > 5 * 1024 * 1024) return toast.error('Featured image must be under 5MB');

    // Validate dimensions (min 600x300 recommended)
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    const dimsOk = await new Promise<boolean>((res) => {
      img.onload = () => {
        const ok = img.width >= 600 && img.height >= 300;
        URL.revokeObjectURL(objectUrl);
        res(ok);
      };
      img.onerror = () => { URL.revokeObjectURL(objectUrl); res(false); };
      img.src = objectUrl;
    });
    if (!dimsOk) return toast.error('Image must be at least 600x300 pixels');

    // Upload using Supabase Storage (same approach as property uploads)
    setUploadingFeatured(true);
    setFeaturedUploadProgress(0);
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `blogs/${Date.now()}-${Math.random().toString(36).slice(2,8)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('blog-images')
        .upload(filePath, file, { cacheControl: '3600', upsert: false });

      if (uploadError) {
        console.error('Featured upload error:', uploadError);
        throw uploadError;
      }

      const publicUrl = `${SUPABASE_URL.replace(/\/$/, '')}/storage/v1/object/public/blog-images/${encodeURIComponent(filePath)}`;
      setForm(prev => ({ ...prev, featured_image: publicUrl }));
      setFeaturedFile(file);
      setFeaturedUploadProgress(100);
      toast.success('Featured image uploaded');
    } catch (err) {
      console.error('Featured upload error:', err);
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(msg || 'Failed to upload image');
    } finally {
      setUploadingFeatured(false);
      setTimeout(() => setFeaturedUploadProgress(0), 800);
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
            <Label>Featured Image</Label>
            <div className="flex items-start gap-4">
              <div className="w-40 h-24 rounded overflow-hidden bg-slate-100 border border-border flex items-center justify-center">
                {form.featured_image ? (
                  // eslint-disable-next-line jsx-a11y/img-redundant-alt
                  <img src={form.featured_image} alt="featured image" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-xs text-muted-foreground p-2">No image</div>
                )}
              </div>
              <div className="flex-1">
                <input
                  id="featured_file"
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFeaturedFileChange(e.target.files ? e.target.files[0] : null)}
                />
                <div className="mt-2">
                  <Label htmlFor="featured_image">Or image URL</Label>
                  <Input
                    id="featured_image"
                    value={form.featured_image}
                    onChange={(e) => setForm(prev => ({ ...prev, featured_image: e.target.value }))}
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
                {uploadingFeatured && (
                  <div className="mt-2">
                    <p className="text-xs text-muted-foreground">Uploading featured image... {featuredUploadProgress}%</p>
                    <div className="w-full bg-slate-200 rounded-full h-2 mt-1 overflow-hidden"><div className="bg-primary h-2" style={{ width: `${featuredUploadProgress}%` }} /></div>
                  </div>
                )}
              </div>
            </div>
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
        <Button onClick={handleSave}>
          {blog ? "Update" : "Create"}
        </Button>
      </div>
    </div>
  );
};

export default BlogForm;
