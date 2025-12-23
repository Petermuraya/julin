import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, LineChart, Line, CartesianGrid } from "recharts";

type Counts = { properties: number; submissions: number; inquiries: number; verified: number };

export default function Charts({ counts }: { counts: Counts }) {
  const barData = [
    { name: "Properties", value: counts.properties },
    { name: "Submissions", value: counts.submissions },
    { name: "Inquiries", value: counts.inquiries },
    { name: "Verified", value: counts.verified },
  ];

  const sparkData = [
    { name: "T-4", v: Math.max(0, counts.properties - 3) },
    { name: "T-3", v: Math.max(0, counts.properties - 2) },
    { name: "T-2", v: Math.max(0, counts.properties - 1) },
    { name: "Now", v: counts.properties },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={120}>
            <BarChart data={barData} margin={{ top: 8, right: 12, left: 0, bottom: 8 }}>
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#06b6d4" radius={[6,6,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Properties Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={120}>
            <LineChart data={sparkData} margin={{ top: 8, right: 12, left: 0, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="v" stroke="#3b82f6" strokeWidth={2} dot={{ r: 2 }} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Quick Stats</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="p-2 bg-slate-50 rounded">Properties<br/><strong>{counts.properties}</strong></div>
            <div className="p-2 bg-slate-50 rounded">Verified<br/><strong>{counts.verified}</strong></div>
            <div className="p-2 bg-slate-50 rounded">Submissions<br/><strong>{counts.submissions}</strong></div>
            <div className="p-2 bg-slate-50 rounded">Inquiries<br/><strong>{counts.inquiries}</strong></div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
