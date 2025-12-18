import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { MessageCircle, Phone, Search, Mail } from "lucide-react";

type Inquiry = {
  id: string;
  buyer_name: string;
  buyer_phone: string;
  property_id?: string | null;
  message?: string | null;
  lead_status?: "hot" | "warm" | "cold" | null;
  created_at?: string | null;
};

const AdminInquiries = () => {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredInquiries = inquiries.filter((i) =>
    i.buyer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    i.buyer_phone.includes(searchQuery) ||
    (i.message || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data, error } = await supabase.from("buyer_inquiries").select("*").order("created_at", { ascending: false });
      if (error) console.error(error);
      setInquiries((data || []) as Inquiry[]);
      setLoading(false);
    };
    load();
  }, []);

  const updateLead = async (id: string, status: "hot" | "warm" | "cold") => {
    try {
      await supabase.from("buyer_inquiries").update({ lead_status: status }).eq("id", id);
      setInquiries((q) => q.map((x) => (x.id === id ? { ...x, lead_status: status } : x)));
    } catch (err: unknown) {
      console.error(err);
      const message = err instanceof Error ? err.message : String(err);
      toast({ title: "Error", description: message || "Failed to update lead status", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Buyer Inquiries</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">Track and manage buyer leads</p>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-3 text-slate-400" size={20} />
        <Input
          placeholder="Search by name, phone, or message..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 py-2 h-10"
        />
      </div>

      {/* Inquiries Table */}
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin inline-block w-8 h-8 border-4 border-slate-300 border-t-blue-600 rounded-full"></div>
            <p className="mt-2 text-slate-600 dark:text-slate-400">Loading inquiries...</p>
          </div>
        ) : filteredInquiries.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-slate-600 dark:text-slate-400 text-lg">
              {searchQuery ? "No inquiries found matching your search" : "No inquiries yet"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-700 border-b border-slate-200 dark:border-slate-600">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900 dark:text-white">
                    Buyer
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900 dark:text-white">
                    Contact
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900 dark:text-white">
                    Message
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900 dark:text-white">
                    Lead Status
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900 dark:text-white">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {filteredInquiries.map((i) => (
                  <tr
                    key={i.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900 dark:text-white">{i.buyer_name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                          <Phone size={16} />
                          <a href={`tel:${i.buyer_phone}`} className="hover:text-blue-600 dark:hover:text-blue-400">
                            {i.buyer_phone}
                          </a>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-slate-600 dark:text-slate-400 max-w-xs truncate">
                        {(i.message || "").slice(0, 50)}
                        {(i.message || "").length > 50 ? "..." : ""}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <Select
                        value={i.lead_status || "warm"}
                        onValueChange={(v) => updateLead(i.id, v as "hot" | "warm" | "cold")}
                      >
                        <SelectTrigger className="w-32 h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="hot">
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                              Hot
                            </div>
                          </SelectItem>
                          <SelectItem value="warm">
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                              Warm
                            </div>
                          </SelectItem>
                          <SelectItem value="cold">
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                              Cold
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                      {i.created_at ? new Date(i.created_at).toLocaleDateString() : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminInquiries;
