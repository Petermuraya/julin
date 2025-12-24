import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { HomeIcon, DocumentTextIcon } from "@heroicons/react/24/outline";

export default function DashboardHeader() {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Quick overview — manage properties, submissions and leads</p>
      </div>

      <div className="flex gap-3 flex-wrap">
        <Button asChild className="bg-primary hover:bg-primary/90">
          <Link to="/admin/properties" className="inline-flex items-center gap-2">
            <HomeIcon className="h-5 w-5" />
            <span>Properties</span>
          </Link>
        </Button>

        <Button variant="outline" asChild>
          <Link to="/admin/submissions" className="inline-flex items-center gap-2">
            <DocumentTextIcon className="h-5 w-5" />
            <span>Submissions</span>
          </Link>
        </Button>
      </div>
    </div>
  );
}
