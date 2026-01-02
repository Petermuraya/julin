"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardHeader from "@/components/admin/DashboardHeader";
import StatsGrid from "@/components/admin/StatsGrid";
import RecentSubmissions from "@/components/admin/RecentSubmissions";
import RecentInquiries from "@/components/admin/RecentInquiries";
import RecentProperties from "@/components/admin/RecentProperties";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import { toast } from "@/components/ui/use-toast";
import Reveal from "@/components/ui/Reveal";
import Stagger from "@/components/ui/Stagger";
import RealtimeCharts from "@/components/admin/RealtimeCharts";

export default function Page() {
  const [counts, setCounts] = useState({ properties: 0, submissions: 0, inquiries: 0, verified: 0 });
  const [recentSubmissions, setRecentSubmissions] = useState<any[]>([]);
  const [recentInquiries, setRecentInquiries] = useState<any[]>([]);
  const [recentProperties, setRecentProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<any>(null);
  const [confirmItem, setConfirmItem] = useState<any | null>(null);

  const openConfirm = (action: any, item: any) => {
    setConfirmAction(action);
    setConfirmItem(item);
    setConfirmOpen(true);
  };

  const onConfirm = async () => {
    if (!confirmAction || !confirmItem) return setConfirmOpen(false);
    const prev = recentSubmissions;
    setRecentSubmissions((s) => s.filter((x) => x.id !== confirmItem.id));
    setCounts((c) => ({ ...c, submissions: Math.max(0, c.submissions - 1) }));
    setConfirmOpen(false);

    try {
      if (confirmAction === "approve") await handleApprove(confirmItem);
      else await handleReject(confirmItem);
    } catch {
      setRecentSubmissions(prev);
      toast({ title: "Error", description: "Action failed. Changes rolled back.", variant: "destructive" });
    } finally {
      setConfirmAction(null);
      setConfirmItem(null);
    }
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [pRes, sRes, iRes, vRes, subsRes, inqRes, propRes] = await Promise.all([
          supabase.from("properties").select("id", { count: "exact" }),
          supabase.from("property_submissions").select("id", { count: "exact" }),
          supabase.from("buyer_inquiries").select("id", { count: "exact" }),
          supabase.from("properties").select("id", { count: "exact" }).eq("is_verified", true),
          supabase.from("property_submissions").select("id,title,seller_name,seller_phone,price,status,images").order("created_at", { ascending: false }).limit(5),
          supabase.from("buyer_inquiries").select("id,buyer_name,buyer_phone,property_id,message,lead_status,created_at").order("created_at", { ascending: false }).limit(5),
          supabase.from("properties").select("id,title,location,price,status,is_verified,images").order("created_at", { ascending: false }).limit(5),
        ]);

        setCounts({
          properties: pRes.count ?? 0,
          submissions: sRes.count ?? 0,
          inquiries: iRes.count ?? 0,
          verified: vRes.count ?? 0,
        });

        setRecentSubmissions((subsRes.data as any[]).map((s) => ({
          ...s,
          _firstImage: s.images?.[0] ? supabase.storage.from("properties").getPublicUrl(s.images[0]).data?.publicUrl : undefined,
        })) || []);

        setRecentInquiries(inqRes.data as any[] || []);
        setRecentProperties((propRes.data as any[]).map((p) => ({
          ...p,
          _firstImage: p.images?.[0] ? supabase.storage.from("properties").getPublicUrl(p.images[0]).data?.publicUrl : undefined,
        })) || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleApprove = async (submission: any) => {
    try {
      const { data, error } = await supabase.from("properties").insert([{
        title: submission.title,
        description: submission.description || null,
        property_type: (submission.property_type || "land") as any,
        price: submission.price || 0,
        location: submission.location || "",
        images: submission.images || null,
        seller_name: submission.seller_name || null,
        seller_phone: submission.seller_phone || null,
        is_admin_property: false,
        approved_at: new Date().toISOString(),
      }]).select().single();
      if (error) throw error;

      await supabase.from("property_submissions").update({ status: "approved", created_property_id: data.id, reviewed_at: new Date().toISOString() }).eq("id", submission.id);
      setCounts((c) => ({ ...c, properties: c.properties + 1 }));
      toast({ title: "Approved", description: "Submission approved and published.", variant: "default" });
    } catch (err: unknown) {
      console.error(err);
      toast({ title: "Error", description: (err as Error).message || "Failed to approve submission.", variant: "destructive" });
    }
  };

  const handleReject = async (submission: any) => {
    try {
      await supabase.from("property_submissions").update({ status: "rejected", reviewed_at: new Date().toISOString() }).eq("id", submission.id);
      toast({ title: "Rejected", description: "Submission rejected.", variant: "default" });
    } catch (err: unknown) {
      console.error(err);
      toast({ title: "Error", description: (err as Error).message || "Failed to reject submission.", variant: "destructive" });
    }
  };

  return (
    <Reveal>
      <div className="space-y-6">
        <DashboardHeader />

        <Stagger>
          <RealtimeCharts />
          <StatsGrid counts={counts} />
        </Stagger>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Stagger>
            <RecentSubmissions submissions={recentSubmissions} loading={loading} onApprove={openConfirm.bind(null, "approve")} onReject={openConfirm.bind(null, "reject")} />
            <RecentInquiries inquiries={recentInquiries} loading={loading} />
            <RecentProperties properties={recentProperties} loading={loading} />
          </Stagger>
        </div>

        <ConfirmDialog open={confirmOpen} action={confirmAction} item={confirmItem} onClose={() => setConfirmOpen(false)} onConfirm={onConfirm} />
      </div>
    </Reveal>
  );
}
