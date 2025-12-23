import { Inquiry } from "./types";
import { Badge } from "@/components/ui/badge";
import Stagger from "@/components/ui/Stagger";

type RecentInquiriesProps = {
  inquiries: Inquiry[];
  loading: boolean;
};

export default function RecentInquiries({ inquiries, loading }: RecentInquiriesProps) {
  return (
    <section className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Recent Inquiries</h2>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-slate-100 dark:bg-slate-700 rounded animate-pulse" />
          ))}
        </div>
      ) : inquiries.length === 0 ? (
        <p className="text-sm text-slate-500 dark:text-slate-400 py-6 text-center">No recent inquiries</p>
      ) : (
        <div className="space-y-3">
          <Stagger>
            {inquiries.map((q) => (
              <div
                key={q.id}
                className="p-3 bg-slate-50 dark:bg-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-slate-900 dark:text-white text-sm">{q.buyer_name}</h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">📱 {q.buyer_phone}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 line-clamp-2">
                      {(q.message || "").slice(0, 60)}
                      {(q.message || "").length > 60 ? "..." : ""}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className={`flex-shrink-0 text-xs ${
                      q.lead_status === "hot"
                        ? "bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-400 border-red-200 dark:border-red-700"
                        : q.lead_status === "warm"
                        ? "bg-orange-50 dark:bg-orange-950 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-700"
                        : "bg-primary/5 text-primary border-primary/20"
                    }`}
                  >
                    {q.lead_status || "Warm"}
                  </Badge>
                </div>
              </div>
            ))}
          </Stagger>
        </div>
      )}
    </section>
  );
}
