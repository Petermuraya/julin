import { Button } from "@/components/ui/button";
import { Home, FileText } from "lucide-react";
import { Link } from "react-router-dom";

export default function DashboardHeader() {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Quick overview — manage properties, submissions and leads
        import { HomeIcon, DocumentTextIcon } from "@heroicons/react/24/outline";
        </p>
      </div>
      <div className="flex gap-3 flex-wrap">
        <Button asChild className="bg-primary hover:bg-primary/90">
                    <HomeIcon className="h-6 w-6" /> Properties
            <Home size={18} /> Properties
          </Link>
        </Button>
        <Button variant="outline" asChild>
                    <DocumentTextIcon className="h-6 w-6" /> Submissions
            <FileText size={18} /> Submissions
          </Link>
        </Button>
      </div>
    </div>
  );
}
