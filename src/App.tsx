import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import ScrollProgress from "@/components/ui/ScrollProgress";
import BackToTop from "@/components/ui/BackToTop";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HelmetProvider } from "react-helmet-async";

import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import ScrollToTop from "./components/ScrollToTop";

import AdminLayout from "./pages/admin/AdminLayout";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminProperties from "./pages/admin/AdminProperties";
import AdminBlogs from "./pages/admin/AdminBlogs";
import AdminSubmissions from "./pages/admin/AdminSubmissions";
import AdminInquiries from "./pages/admin/AdminInquiries";
import AdminChats from "./pages/admin/AdminChats";
import AdminChatDashboard from "./pages/admin/AdminChatDashboard";
import AdminProfile from "./pages/admin/AdminProfile";

import PropertiesPage from "./pages/PropertiesPage";
import PropertyDetailPage from "./pages/PropertyDetailPage";
import BlogsPage from "./pages/BlogsPage";
import BlogDetailPage from "./pages/BlogDetailPage";
import AboutPage from "./pages/About";
import ContactPage from "./pages/Contact";
import Chat from "./components/chat/Chat";
import ChatLauncher from "./components/chat/ChatLauncher";
import AuthRedirectHandler from "./components/AuthRedirectHandler";
import Debug from "./pages/Debug";

const queryClient = new QueryClient();

/**
 * App now acts as a provider/layout wrapper. It no longer provides client-side
 * routing (HashRouter). Next.js will mount pages inside this wrapper via pages/_app.tsx.
 */
const App = ({ children }: { children?: React.ReactNode }) => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ScrollProgress />
        <Toaster />
        <Sonner />
        {/* children will be Next pages or dynamic imports of src/pages/* */}
        {children ?? <Index />}
        <ChatLauncher />
        <BackToTop />
      </TooltipProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;