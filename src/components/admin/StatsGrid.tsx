import { Home, Clock, MessageSquare, CheckCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "../ui/badge";
import { Link } from "react-router-dom";

type StatsGridProps = {
  counts: { properties: number; submissions: number; inquiries: number; verified: number };
};

export default function StatsGrid({ counts }: StatsGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Properties */}
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6 hover:shadow-lg transition-shadow">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Properties</p>
            <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">{counts.properties}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-3">
              <span className="inline-block bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-400 px-2 py-1 rounded">
                {counts.verified} verified
              </span>
            </p>
          </div>
          <div className="bg-primary/5 p-3 rounded-lg">
            <Home size={24} className="text-primary" />
          </div>
        </div>
      </div>

      {/* Submissions */}
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6 hover:shadow-lg transition-shadow">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground">Pending Submissions</p>
            <p className="text-3xl font-bold text-foreground mt-2">{counts.submissions}</p>
            <Button asChild size="sm" variant="ghost" className="mt-3 h-auto p-0 text-xs text-primary">
              <Link to="/admin/submissions" className="inline-flex items-center gap-1">
                Review submissions <ArrowRight size={14} />
              </Link>
            </Button>
          </div>
          <div className="bg-orange-50 dark:bg-orange-950 p-3 rounded-lg">
            <Clock size={24} className="text-orange-600 dark:text-orange-400" />
          </div>
        </div>
      </div>

      {/* Inquiries */}
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6 hover:shadow-lg transition-shadow">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground">Buyer Inquiries</p>
            <p className="text-3xl font-bold text-foreground mt-2">{counts.inquiries}</p>
            <Button asChild size="sm" variant="ghost" className="mt-3 h-auto p-0 text-xs text-primary">
              <Link to="/admin/inquiries" className="inline-flex items-center gap-1">
                View leads <ArrowRight size={14} />
              </Link>
            </Button>
          </div>
          <div className="bg-purple-50 dark:bg-purple-950 p-3 rounded-lg">
            <MessageSquare size={24} className="text-purple-600 dark:text-purple-400" />
          </div>
        </div>
      </div>

      {/* Status */}
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6 hover:shadow-lg transition-shadow">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground">Status</p>
            <p className="text-3xl font-bold text-foreground mt-2">Active</p>
            <p className="text-xs text-muted-foreground mt-3">All systems operational</p>
          </div>
          <div className="bg-green-50 dark:bg-green-950 p-3 rounded-lg">
            <CheckCircle size={24} className="text-green-600 dark:text-green-400" />
          </div>
        </div>
      </div>
    </div>
  );
}
