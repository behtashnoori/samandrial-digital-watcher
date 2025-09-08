import { Outlet } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { useAuth } from "@/contexts/AuthContext";

export function AppLayout() {
  const { user } = useAuth();
  const headerUser = {
    name: user?.username || "",
    role: user?.role || "",
  };
  return (
    <div className="min-h-screen bg-background">
      <Header user={headerUser} />
      <div className="flex">
        <Sidebar userRole={user?.role || "viewer"} />
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AppLayout;
