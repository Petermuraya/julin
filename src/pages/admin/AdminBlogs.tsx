import { BookOpen } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const AdminBlogs = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Blog Posts</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">Manage your blog content</p>
      </div>

      {/* Coming Soon Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-blue-500" />
            Blog Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <div className="mx-auto h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center mb-4">
              <BookOpen className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
              Blog Feature Coming Soon
            </h3>
            <p className="text-slate-600 dark:text-slate-400 max-w-md mx-auto">
              The blog management feature is currently being developed. 
              You'll be able to create, edit, and publish blog posts about real estate tips, 
              market updates, and property insights.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminBlogs;
