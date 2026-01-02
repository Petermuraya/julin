import { Button } from "@/components/ui/button";
import Stagger from "@/components/ui/Stagger";

type Submission = {
  id: string;
  _firstImage?: string | null;
  title: string;
  seller_name?: string;
  price?: number | string;
};

type RecentSubmissionsProps = {
  submissions: Submission[];
  loading: boolean;
  onApprove: (submission: Submission) => void;
  onReject: (submission: Submission) => void;
};

export default function RecentSubmissions({ submissions, loading, onApprove, onReject }: RecentSubmissionsProps) {
  return (
    <section className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Recent Submissions</h2>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-slate-100 dark:bg-slate-700 rounded animate-pulse" />
          ))}
        </div>
      ) : submissions.length === 0 ? (
        <p className="text-sm text-slate-500 dark:text-slate-400 py-6 text-center">No recent submissions</p>
      ) : (
        <div className="space-y-3">
          <Stagger>
            {submissions.map((s) => (
              <div
                key={s.id}
                className="p-3 bg-slate-50 dark:bg-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors"
              >
                <div className="flex gap-3">
                  {s._firstImage ? (
                    <img src={s._firstImage} alt={s.title} className="w-16 h-12 object-cover rounded flex-shrink-0" />
                  ) : (
                    <div className="w-16 h-12 bg-slate-300 dark:bg-slate-600 rounded flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-slate-900 dark:text-white text-sm truncate">{s.title}</h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 truncate">{s.seller_name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      KES {Number(s.price || 0).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 mt-2">
                  <Button size="sm" variant="destructive" className="flex-1 h-7 text-xs" onClick={() => onReject(s)}>
                    Reject
                  </Button>
                  <Button size="sm" className="flex-1 h-7 text-xs bg-green-600 hover:bg-green-700" onClick={() => onApprove(s)}>
                    Approve
                  </Button>
                </div>
              </div>
            ))}
          </Stagger>
        </div>
      )}
    </section>
  );
}
