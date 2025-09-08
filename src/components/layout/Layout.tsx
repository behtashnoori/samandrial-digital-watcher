import { ReactNode } from "react";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";

interface LayoutProps {
  children: ReactNode;
}

// Mock user data - this would come from auth context in real app
const mockUser = {
  name: "علی احمدی",
  role: "مدیر سیستم",
};

const mockUserRole = "admin"; // This would come from auth context

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Header user={mockUser} />
      <div className="flex">
        <Sidebar userRole={mockUserRole} />
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}