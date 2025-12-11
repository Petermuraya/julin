import { Link, Outlet, useLocation } from "react-router-dom";
import { useState } from "react";
import { Menu, X, LayoutDashboard, Home, FileText, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();

  const navItems = [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/properties", label: "Properties", icon: Home },
    { href: "/admin/submissions", label: "Submissions", icon: FileText },
    { href: "/admin/inquiries", label: "Buyer Inquiries", icon: MessageSquare },
  ];

  const isActive = (href: string) => location.pathname === href;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-screen bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 transition-all duration-300 z-50 ${
          sidebarOpen ? "w-64" : "w-20"
        }`}
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          {sidebarOpen && <h1 className="text-xl font-bold text-slate-900 dark:text-white">JulinHub</h1>}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="ml-auto"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                to={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive(item.href)
                    ? "bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 font-medium"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                }`}
              >
                <Icon size={20} className="flex-shrink-0" />
                {sidebarOpen && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        {sidebarOpen && (
          <div className="p-4 border-t border-slate-200 dark:border-slate-700">
            <p className="text-xs text-slate-500 dark:text-slate-400">Admin Panel v1.0</p>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <main className={`transition-all duration-300 ${sidebarOpen ? "ml-64" : "ml-20"}`}>
        <div className="p-6 md:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
