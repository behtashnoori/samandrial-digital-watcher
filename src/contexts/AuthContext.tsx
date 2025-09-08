import { createContext, useContext, useState } from "react";
import { apiClient } from "@/lib/api/client";

export type User = { username: string; role: string } | null;

interface AuthContextValue {
  user: User;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User>(() => {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  });

  const login = async (username: string, password: string) => {
    const res = await apiClient.post("/auth/login", { username, password });
    setUser(res);
    localStorage.setItem("user", JSON.stringify(res));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("AuthContext خارج از محدوده است");
  return ctx;
};
