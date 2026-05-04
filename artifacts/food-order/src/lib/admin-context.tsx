import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

interface AdminContextType {
  token: string | null;
  isAuthenticated: boolean;
  login: (token: string) => void;
  logout: () => void;
}

const AdminContext = createContext<AdminContextType | null>(null);

const TOKEN_KEY = "admin_token";

export function AdminProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));

  const login = (t: string) => {
    localStorage.setItem(TOKEN_KEY, t);
    setToken(t);
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
  };

  return (
    <AdminContext.Provider value={{ token, isAuthenticated: !!token, login, logout }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error("useAdmin must be inside AdminProvider");
  return ctx;
}

/* Helper to make authenticated admin API calls */
export async function adminFetch(token: string, path: string, options: RequestInit = {}) {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  const res = await fetch(`${base}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "خطأ في الشبكة" }));
    throw new Error(err.error || "خطأ غير معروف");
  }
  return res.json();
}
