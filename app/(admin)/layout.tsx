"use client";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import {
  Squares2X2Icon,
  HomeIcon,
  DocumentTextIcon,
  CalendarDaysIcon,
  ChatBubbleLeftRightIcon,
  Cog6ToothIcon,
  Bars3Icon,
  XMarkIcon,
  UserIcon,
  ArrowRightOnRectangleIcon,
  ChartBarIcon,
} from "@heroicons/react/24/outline";
import { motion } from "framer-motion";
import AdminTopProgress from "@/components/ui/AdminTopProgress";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContextValue";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { user, isAdmin, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const navItems = [
    { href: "/admin", label: "Dashboard", icon: Squares2X2Icon },
    { href: "/admin/properties", label: "Properties", icon: HomeIcon },
    { href: "/admin/chats", label: "Chat Analytics", icon: ChartBarIcon },
    { href: "/admin/blogs", label: "Blog Posts", icon: DocumentTextIcon },
    { href: "/admin/submissions", label: "Submissions", icon: DocumentTextIcon },
    { href: "/admin/inquiries", label: "Buyer Inquiries", icon: ChatBubbleLeftRightIcon },
    { href: "/admin/profile", label: "Profile", icon: Cog6ToothIcon },
  ];

  const isActive = (href: string) => pathname === href;

  useEffect(() => {
    // If not authenticated and not loading, redirect to login
    if (!loading && !user) {
      router.push("/admin/login");
    }
  }, [user, loading, router]);

  // Keyboard shortcut: Ctrl/Cmd+B to toggle sidebar
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        setSidebarOpen((s) => !s);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({ title: "Logged out", description: "See you next time!" });
    router.push("/admin/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin inline-block w-10 h-10 border-4 border-slate-300 border-t-blue-600 rounded-full mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      {/* Sidebar */}
      <motion.aside
        className="fixed left-0 top-0 h-screen bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 z-50"
        animate={{ width: sidebarOpen ? 256 : 80 }}
        transition={{ type: "spring", stiffness: 260, damping: 30 }}
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          {sidebarOpen && <h1 className="text-xl font-bold text-slate-900 dark:text-white">JulinHub</h1>}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="ml-auto p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Toggle sidebar"
          >
            {sidebarOpen ? <XMarkIcon className="h-5 w-5" /> : <Bars3Icon className="h-5 w-5" />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive(item.href)
                    ? "bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 font-medium"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                }`}
              >
                <motion.div whileHover={{ x: -4 }} className="flex-shrink-0">
                  <Icon className="h-5 w-5" />
                </motion.div>
                {sidebarOpen && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* User & Logout */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-700">
          {sidebarOpen && user && (
            <div className="flex items-center gap-3 mb-3 px-2">
              <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                <UserIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                  {user.email}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Admin</p>
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            className={`w-full text-left p-2 rounded-md text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950 ${
              !sidebarOpen ? "px-3" : ""
            }`}
          >
            <div className="inline-flex items-center gap-3">
              <ArrowRightOnRectangleIcon className="h-5 w-5 flex-shrink-0 text-red-600 dark:text-red-400" />
              {sidebarOpen && <span className="ml-1">Logout</span>}
            </div>
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <motion.main
        className="transition-all duration-300 relative"
        animate={{ marginLeft: sidebarOpen ? 256 : 80 }}
        transition={{ type: "spring", stiffness: 260, damping: 30 }}
      >
        <AdminTopProgress />
        <div className="p-6 md:p-8">
          {children}
        </div>
      </motion.main>
    </div>
  );
}