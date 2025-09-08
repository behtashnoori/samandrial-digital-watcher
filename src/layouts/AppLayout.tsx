import { Outlet } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";

const mockUser = {
  name: "علی احمدی",
  role: "مدیر سیستم",
};

const mockUserRole = "admin";

export function AppLayout() {
  return (
    <div className="min-h-screen bg-background">
      <Header user={mockUser} />
      <div className="flex">
        <Sidebar userRole={mockUserRole} />
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AppLayout;
