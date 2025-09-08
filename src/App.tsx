import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AppLayout from "@/layouts/AppLayout";
import Dashboard from "@/pages/Dashboard";
import Triggers from "@/pages/Triggers";
import ImportCenter from "@/pages/ImportCenter";
import OrgStructure from "@/pages/OrgStructure";
import Records from "@/pages/Records";
import RecordForm from "@/pages/Records/New";
import Settings from "@/pages/Settings";
import NotFound from "@/pages/NotFound";
import Login from "@/pages/Login";
import ProtectedRoute from "@/components/ProtectedRoute";
import { AuthProvider } from "@/contexts/AuthContext";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Dashboard />} />
              <Route
                path="triggers"
                element={
                  <ProtectedRoute roles={["admin", "manager", "head"]}>
                    <Triggers />
                  </ProtectedRoute>
                }
              />
              <Route
                path="import"
                element={
                  <ProtectedRoute roles={["admin"]}>
                    <ImportCenter />
                  </ProtectedRoute>
                }
              />
              <Route
                path="organization"
                element={
                  <ProtectedRoute roles={["admin"]}>
                    <OrgStructure />
                  </ProtectedRoute>
                }
              />
              <Route
                path="records"
                element={
                  <ProtectedRoute roles={["admin", "manager", "head", "viewer"]}>
                    <Records />
                  </ProtectedRoute>
                }
              />
              <Route
                path="records/new"
                element={
                  <ProtectedRoute roles={["admin", "manager", "head"]}>
                    <RecordForm />
                  </ProtectedRoute>
                }
              />
              <Route
                path="settings"
                element={
                  <ProtectedRoute roles={["admin"]}>
                    <Settings />
                  </ProtectedRoute>
                }
              />
            </Route>
            <Route path="/login" element={<Login />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
