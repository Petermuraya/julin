import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";

const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  // No client-side registration: admins are provisioned in Supabase
  const navigate = useNavigate();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('[admin-login] handleAuth start', { email: Boolean(email), passwordSet: Boolean(password) });

    // Runtime sanity check for Supabase envs — these must be present in the built
    // site (GitHub Pages) for auth requests to succeed. If missing, fail fast
    // with a helpful toast and avoid throwing low-level proxy errors.
    const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
    const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
      console.error('[admin-login] Supabase env missing', { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY });
      toast({ title: 'Configuration error', description: 'Supabase URL or publishable key not set in site build.', variant: 'destructive' });
      setLoading(false);
      return;
    }
    
    if (!email.trim() || !password.trim()) {
      toast({ title: "Missing fields", description: "Please enter email and password", variant: "destructive" });
      return;
    }

    if (password.length < 6) {
      toast({ title: "Password too short", description: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      // Sign in existing user (admins should be provisioned in Supabase)
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim(),
      });

      console.debug('[admin-login] signInWithPassword response:', { data, error });

      if (error) {
        console.error('[admin-login] sign in error', error);
        throw error;
      }

      // Login successful only proceed if a session was established client-side.
      // If no session is returned (e.g. email confirmation required), instruct the user.
      // If the API returned a session, navigate immediately. Otherwise, if a user
      // object exists treat it as success and attempt to confirm the session.
      // If the response contains a session, navigate immediately. Otherwise
      // poll the client for a session for a short period then force a hash
      // navigation so the HashRouter picks up the route correctly.
      const baseHref = `${window.location.origin}${import.meta.env.BASE_URL || '/'}`.replace(/\/$/, '');

      const doNavigate = () => {
        try {
          // Force hash navigation to ensure the HashRouter recognizes it
          window.location.href = `${baseHref}#/admin`;
        } catch {
          navigate('/admin');
        }
      };

      if (data?.session) {
        toast({ title: "Welcome back!", description: "Logged in successfully" });
        doNavigate();
        return;
      }

      // Poll for session up to 3 seconds
      const start = Date.now();
      let found = false;
      while (Date.now() - start < 3000) {
        try {
          // eslint-disable-next-line no-await-in-loop
          const s = await supabase.auth.getSession();
          if (s?.data?.session) { found = true; break; }
        } catch (err) {
          // ignore and retry
        }
        // small delay
        // eslint-disable-next-line no-await-in-loop
        await new Promise((r) => setTimeout(r, 250));
      }

      if (found || data?.user) {
        toast({ title: "Welcome back!", description: "Logged in successfully" });
        doNavigate();
        return;
      }

      // No session found — likely requires email confirmation or other action.
      toast({ title: "Check your email", description: "Sign-in did not create a session. Check your email for a confirmation link or complete any required steps.", variant: 'warning' });
    } catch (err: unknown) {
      console.error("Auth error:", err);
      const message = err instanceof Error ? err.message : String(err);
      toast({ 
        title: "Login failed",
        description: message || "An error occurred", 
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">JulinHub</h1>
          <p className="text-slate-400">Admin Portal</p>
        </div>

        {/* Auth Card */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full mb-4">
              <Lock className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Admin Login</h2>
            <p className="text-slate-600 dark:text-slate-400 mt-1">Sign in to manage properties</p>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  type="email"
                  placeholder="admin@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  disabled={loading}
                  autocomplete="username"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10"
                  disabled={loading}
                  autocomplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          {/* No client-side registration UI: admins are provisioned in Supabase */}

          <div className="mt-6 text-center">
            <a href="/" className="text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400">
              ← Back to Website
            </a>
          </div>
        </div>

        <p className="text-center text-slate-500 text-sm mt-6">
          Julin Real Estate Admin Portal
        </p>
      </div>
    </div>
  );
};

export default AdminLogin;