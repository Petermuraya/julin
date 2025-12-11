import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route } from "react-router-dom"; // <- Changed
import { HelmetProvider } from "react-helmet-async";

import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminProperties from "./pages/admin/AdminProperties";
import AdminSubmissions from "./pages/admin/AdminSubmissions";
import AdminInquiries from "./pages/admin/AdminInquiries";

import PropertiesPage from "./pages/PropertiesPage";
import AboutPage from "./pages/About";
import ContactPage from "./pages/Contact";

const queryClient = new QueryClient();

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <HashRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/properties" element={<PropertiesPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />

            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="properties" element={<AdminProperties />} />
              <Route path="submissions" element={<AdminSubmissions />} />
              <Route path="inquiries" element={<AdminInquiries />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </HashRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
