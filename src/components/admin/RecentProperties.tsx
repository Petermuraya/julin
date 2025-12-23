import { Badge } from "@/components/ui/badge";
import Stagger from "@/components/ui/Stagger";

type RecentPropertiesProps = {
  properties: any[];
  loading: boolean;
};

export default function RecentProperties({ properties, loading }: RecentPropertiesProps) {
  return (
    <section className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Recent Properties</h2>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-slate-100 dark:bg-slate-700 rounded animate-pulse" />
          ))}
        </div>
      ) : properties.length === 0 ? (
        <p className="text-sm text-slate-500 dark:text-slate-400 py-6 text-center">No recent properties</p>
      ) : (
        <div className="space-y-3">
          <Stagger>
            {properties.map((p) => (
              <div
                key={p.id}
                className="p-3 bg-slate-50 dark:bg-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors"
              >
                <div className="flex gap-3">
                  {p._firstImage ? (
                    <img src={p._firstImage} alt={p.title} className="w-16 h-12 object-cover rounded flex-shrink-0" />
                  ) : (
                    <div className="w-16 h-12 bg-slate-300 dark:bg-slate-600 rounded flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-slate-900 dark:text-white text-sm truncate">{p.title}</h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 truncate">{p.location}</p>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        KES {Number(p.price || 0).toLocaleString()}
                      </p>
                      {p.is_verified && (
                        <Badge variant="secondary" className="text-xs h-5">
                          ✓ Verified
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </Stagger>
        </div>
      )}
    </section>
  );
}
