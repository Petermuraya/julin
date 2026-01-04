import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { ChartContainer, ChartTooltipContent, ChartLegendContent } from "@/components/ui/chart";
import * as Recharts from "recharts";
import { Spinner } from "@/components/ui/spinner";

type PageView = {
  id: string;
  path: string;
  url: string;
  referrer?: string | null;
  user_agent?: string | null;
  created_at: string;
};

const ranges = {
  day: 1,
  week: 7,
  month: 30,
  year: 365,
} as const;

export default function AdminAnalytics() {
  const [range, setRange] = useState<keyof typeof ranges>("week");
  const [views, setViews] = useState<PageView[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadViews();
  }, [range]);

  const loadViews = async () => {
    setLoading(true);
    try {
      const since = new Date(Date.now() - ranges[range] * 24 * 60 * 60 * 1000).toISOString();
      const { data, error } = await supabase
        .from("page_views")
        .select("id,path,url,referrer,user_agent,created_at")
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(10000);

      if (error) throw error;
      setViews((data as PageView[]) || []);
    } catch (err) {
      console.error("Failed to load page views:", err);
      setViews([]);
    } finally {
      setLoading(false);
    }
  };

  const total = views.length;

  // aggregate by date (day) for display
  const aggByDate = views.reduce<Record<string, number>>((acc, v) => {
    const d = new Date(v.created_at).toISOString().slice(0, 10); // YYYY-MM-DD
    acc[d] = (acc[d] || 0) + 1;
    return acc;
  }, {});

  // top pages
  const topPages = Object.entries(views.reduce<Record<string, number>>((acc, v) => {
    acc[v.path] = (acc[v.path] || 0) + 1;
    return acc;
  }, {})).sort((a, b) => b[1] - a[1]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Analytics</h1>
          <p className="text-sm text-muted-foreground">Website visitors and page views</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setRange("day")} className={`px-3 py-1 rounded ${range === "day" ? "bg-slate-200" : "border"}`}>Day</button>
          <button onClick={() => setRange("week")} className={`px-3 py-1 rounded ${range === "week" ? "bg-slate-200" : "border"}`}>Week</button>
          <button onClick={() => setRange("month")} className={`px-3 py-1 rounded ${range === "month" ? "bg-slate-200" : "border"}`}>Month</button>
          <button onClick={() => setRange("year")} className={`px-3 py-1 rounded ${range === "year" ? "bg-slate-200" : "border"}`}>Year</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Total Views</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{total}</div>
            <p className="text-sm text-muted-foreground">Views in selected range</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Unique Pages</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{Object.keys(topPages).length}</div>
            <p className="text-sm text-muted-foreground">Distinct page paths</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Page</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-medium">{topPages[0]?.[0] ?? '-'}</div>
            <p className="text-sm text-muted-foreground">Most visited path</p>
          </CardContent>
        </Card>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Views Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center p-8"><Spinner /></div>
            ) : (
              <ChartContainer
                config={{ views: { label: 'Views', color: 'hsl(220 90% 56%)' } }}
                style={{ height: 260 }}
              >
                <Recharts.LineChart data={Object.entries(aggByDate).map(([date, cnt]) => ({ date, views: cnt })).sort((a,b) => a.date.localeCompare(b.date))}>
                  <Recharts.CartesianGrid strokeDasharray="3 3" />
                  <Recharts.XAxis dataKey="date" />
                  <Recharts.YAxis />
                  <Recharts.Line type="monotone" dataKey="views" stroke="var(--color-views)" strokeWidth={3} dot={{ r: 3 }} />
                  <Recharts.Tooltip content={<ChartTooltipContent />} />
                  <Recharts.Legend content={<ChartLegendContent />} />
                </Recharts.LineChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Pages</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center p-8"><Spinner /></div>
            ) : (
              <div className="space-y-4">
                <ChartContainer config={{ pages: { label: 'Pages', color: 'hsl(260 80% 60%)' } }} style={{ height: 240 }}>
                  <Recharts.PieChart>
                    <Recharts.Pie
                      data={topPages.slice(0,8).map(([path, cnt]) => ({ name: path, value: cnt }))}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={4}
                      label={({ percent }) => `${Math.round((percent || 0) * 100)}%`}
                    />
                    <Recharts.Tooltip content={<ChartTooltipContent />} />
                    <Recharts.Legend content={<ChartLegendContent />} />
                  </Recharts.PieChart>

                </ChartContainer>

                <div className="max-h-48 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Path</TableHead>
                        <TableHead>Views</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {topPages.slice(0,20).map(([path, cnt]) => (
                        <TableRow key={path}>
                          <TableCell className="font-medium truncate max-w-lg">{path}</TableCell>
                          <TableCell>{cnt}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
