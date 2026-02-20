import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { DataProvider } from "@/context/DataContext";
import { Loader2 } from "lucide-react";
import Index from "./pages/Index";
import Properties from "./pages/Properties";
import Clients from "./pages/Clients";
import Tasks from "./pages/Tasks";
import Team from "./pages/Team";
import Agencies from "./pages/Agencies";
import PublicProperties from "./pages/PublicProperties";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
};

const AppRoutes = () => (
  <Routes>
    <Route path="/auth" element={<Auth />} />
    <Route path="/publica" element={<PublicProperties />} />
    <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
    <Route path="/propiedades" element={<ProtectedRoute><Properties /></ProtectedRoute>} />
    <Route path="/clientes" element={<ProtectedRoute><Clients /></ProtectedRoute>} />
    <Route path="/tareas" element={<ProtectedRoute><Tasks /></ProtectedRoute>} />
    <Route path="/equipo" element={<ProtectedRoute><Team /></ProtectedRoute>} />
    <Route path="/inmobiliarias" element={<ProtectedRoute><Agencies /></ProtectedRoute>} />
    <Route path="*" element={<NotFound />} />
  </Routes>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <DataProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </DataProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
