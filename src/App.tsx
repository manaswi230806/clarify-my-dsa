import { Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Toaster } from "sonner";
import Index from "@/pages/Index";
import Auth from "@/pages/Auth";
import Topics from "@/pages/Topics";
import Test from "@/pages/Test";
import Analysis from "@/pages/Analysis";
import Results from "@/pages/Results";
import Learning from "@/pages/Learning";
import Dashboard from "@/pages/Dashboard";
import ResetPassword from "@/pages/ResetPassword";
import type { Session } from "@supabase/supabase-js";

function ProtectedRoute({ children, session }: { children: React.ReactNode; session: Session | null }) {
  if (!session) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/auth" element={session ? <Navigate to="/topics" replace /> : <Auth />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/topics" element={<ProtectedRoute session={session}><Topics /></ProtectedRoute>} />
        <Route path="/test" element={<ProtectedRoute session={session}><Test /></ProtectedRoute>} />
        <Route path="/analysis" element={<ProtectedRoute session={session}><Analysis /></ProtectedRoute>} />
        <Route path="/results" element={<ProtectedRoute session={session}><Results /></ProtectedRoute>} />
        <Route path="/learning" element={<ProtectedRoute session={session}><Learning /></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute session={session}><Dashboard /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
