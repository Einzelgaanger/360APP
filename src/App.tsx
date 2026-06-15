import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { EmployeeAuthProvider, useEmployeeAuth } from "@/contexts/EmployeeAuthContext";
import Onboarding from "./pages/Onboarding";
import Index from "./pages/Index";
import EmployeeLogin from "./pages/EmployeeLogin";
import FindAccount from "./pages/FindAccount";
import ResetPassword from "./pages/ResetPassword";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import DemoDashboard from "./pages/DemoDashboard";
import EmployeeHub from "./pages/EmployeeHub";
import AppraisalAdmin from "./pages/AppraisalAdmin";
import NotFound from "./pages/NotFound";
import ProfileCompletionGate from "@/components/ProfileCompletionGate";
import { AppBootstrapSkeleton } from "@/components/shell/LoadingShells";
import { EO_PILOT_ONLY } from "@/lib/eoPilot";

const queryClient = new QueryClient();

function ProtectedAdminRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated: isLegacyAdmin } = useAuth();
  const { isAuthenticated: isEmployee, isAdmin, isLoading } = useEmployeeAuth();
  if (isLoading) return <AppBootstrapSkeleton />;
  if (isLegacyAdmin || (isEmployee && isAdmin)) return <>{children}</>;
  return <Navigate to="/admin" replace />;
}

function ProtectedEmployeeRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useEmployeeAuth();
  if (isLoading) return <AppBootstrapSkeleton />;
  return isAuthenticated ? <ProfileCompletionGate>{children}</ProfileCompletionGate> : <Navigate to="/login" replace />;
}

function AdminGate() {
  const { isAuthenticated: isLegacyAdmin } = useAuth();
  const { isAuthenticated: isEmployee, isAdmin, isLoading } = useEmployeeAuth();
  if (isLoading) return <AppBootstrapSkeleton />;
  if (isLegacyAdmin || (isEmployee && isAdmin)) return <Navigate to={EO_PILOT_ONLY ? "/appraisal" : "/dashboard"} replace />;
  return <Login />;
}

function AppRoutes() {
  const { isAuthenticated: isEmployee, isLoading } = useEmployeeAuth();

  if (isLoading) {
    return <AppBootstrapSkeleton />;
  }

  return (
    <Routes>
      <Route path="/" element={isEmployee ? <Navigate to="/hub?tab=survey" replace /> : <Onboarding />} />
      <Route path="/login" element={isEmployee ? <Navigate to="/hub?tab=survey" replace /> : <EmployeeLogin />} />
      <Route path="/landing" element={<Index />} />
      <Route path="/find-account" element={<FindAccount />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/hub" element={<ProtectedEmployeeRoute><EmployeeHub /></ProtectedEmployeeRoute>} />
      {/* Legacy routes redirect to hub */}
      <Route path="/survey" element={<Navigate to="/hub?tab=survey" replace />} />
      <Route path="/my-dashboard" element={<Navigate to="/hub?tab=dashboard" replace />} />
      <Route path="/wall-of-fame" element={<Navigate to={EO_PILOT_ONLY ? "/hub?tab=survey" : "/hub?tab=rankings"} replace />} />
      <Route path="/admin" element={<AdminGate />} />
      <Route
        path="/dashboard"
        element={
          EO_PILOT_ONLY ? (
            <ProtectedAdminRoute><Navigate to="/appraisal" replace /></ProtectedAdminRoute>
          ) : (
            <ProtectedAdminRoute><Dashboard /></ProtectedAdminRoute>
          )
        }
      />
      <Route path="/appraisal" element={<ProtectedAdminRoute><AppraisalAdmin /></ProtectedAdminRoute>} />
      <Route path="/demo" element={EO_PILOT_ONLY ? <Navigate to="/login" replace /> : <DemoDashboard />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} forcedTheme="light">
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >
          <EmployeeAuthProvider>
            <AuthProvider>
              <AppRoutes />
            </AuthProvider>
          </EmployeeAuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
