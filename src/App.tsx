import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { DataProvider } from "@/context/DataContext";
import { TenantProvider } from "@/context/TenantContext";
import { Loader2 } from "lucide-react";
import { ForcePasswordChange } from "@/components/ForcePasswordChange";
import { OnboardingWizard } from "@/components/OnboardingWizard";
import { useBodyPointerEventsGuard } from "@/hooks/useBodyPointerEventsGuard";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import Index from "./pages/Index";
import Properties from "./pages/Properties";
import Clients from "./pages/Clients";
import Tasks from "./pages/Tasks";
import Team from "./pages/Team";
import Agencies from "./pages/Agencies";
import PublicProperties from "./pages/PublicProperties";
import Auth from "./pages/Auth";
import Settings from "./pages/Settings";
import Tenants from "./pages/Tenants";
import Pipeline from "./pages/Pipeline";
import MatchCenter from "./pages/MatchCenter";
import ResetPassword from "./pages/ResetPassword";
import SignUp from "./pages/SignUp";
import NotFound from "./pages/NotFound";
import RolesPermissions from "./pages/RolesPermissions";
import SuperAdminDashboard from "./pages/SuperAdminDashboard";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
};

const OnboardingGuard = () => {
  const { user } = useAuth();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!user) { setChecked(true); return; }
    const checkOnboarding = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("onboarding_completed")
        .eq("user_id", user.id)
        .single();
      if (data && !(data as any).onboarding_completed) {
        setShowOnboarding(true);
      }
      setChecked(true);
    };
    checkOnboarding();
  }, [user]);

  if (!checked) return null;

  return (
    <OnboardingWizard
      open={showOnboarding}
      onComplete={() => setShowOnboarding(false)}
    />
  );
};

const AppRoutes = () => (
  <Routes>
    <Route path="/auth" element={<Auth />} />
    <Route path="/signup" element={<Navigate to="/auth" replace />} />
    <Route path="/reset-password" element={<ResetPassword />} />
    <Route path="/publica" element={<PublicProperties />} />
    <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
    <Route path="/propiedades" element={<ProtectedRoute><Properties /></ProtectedRoute>} />
    <Route path="/propiedades/:listingType" element={<ProtectedRoute><Properties /></ProtectedRoute>} />
    <Route path="/clientes" element={<ProtectedRoute><Clients /></ProtectedRoute>} />
    <Route path="/tareas" element={<ProtectedRoute><Tasks /></ProtectedRoute>} />
    <Route path="/equipo" element={<ProtectedRoute><Team /></ProtectedRoute>} />
    <Route path="/inmobiliarias" element={<ProtectedRoute><Agencies /></ProtectedRoute>} />
    <Route path="/ajustes" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
    <Route path="/pipeline" element={<ProtectedRoute><Pipeline /></ProtectedRoute>} />
    <Route path="/match-center" element={<ProtectedRoute><MatchCenter /></ProtectedRoute>} />
    <Route path="/tenants" element={<ProtectedRoute><Tenants /></ProtectedRoute>} />
    <Route path="/roles" element={<ProtectedRoute><RolesPermissions /></ProtectedRoute>} />
    <Route path="/admin" element={<ProtectedRoute><SuperAdminDashboard /></ProtectedRoute>} />
    <Route path="*" element={<NotFound />} />
  </Routes>
);

const GlobalGuards = () => {
  useBodyPointerEventsGuard();
  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <TenantProvider>
          <DataProvider>
            <GlobalGuards />
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <ForcePasswordChange />
              <OnboardingGuard />
              <AppRoutes />
            </BrowserRouter>
          </DataProvider>
        </TenantProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
