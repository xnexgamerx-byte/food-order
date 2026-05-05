import { useLocation, Link } from "wouter";
import { LayoutDashboard, Store, ShoppingBag, Star, LogOut, Menu, X } from "lucide-react";
import { useState } from "react";
import { useAdmin } from "@/lib/admin-context";

const NAV = [
  { href: "/admin/dashboard", icon: LayoutDashboard, label: "الرئيسية" },
  { href: "/admin/restaurants", icon: Store, label: "المطاعم والقوائم" },
  { href: "/admin/orders", icon: ShoppingBag, label: "الطلبات" },
  { href: "/admin/reviews", icon: Star, label: "التقييمات" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { logout } = useAdmin();
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar */}
      <header className="sticky top-0 z-50 bg-blue-950 text-white h-13 flex items-center justify-between px-4 shadow-lg">
        <button onClick={() => setOpen(!open)} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
        <span className="font-black text-base">لوحة التحكم</span>
        <button
          onClick={logout}
          className="flex items-center gap-1.5 text-xs text-blue-200 hover:text-white transition-colors px-2 py-1.5 rounded-lg hover:bg-white/10"
        >
          <LogOut className="h-3.5 w-3.5" />
          خروج
        </button>
      </header>

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside
          className={`fixed top-13 right-0 h-full bg-white border-l border-border shadow-lg z-40 transition-all duration-300 w-52 ${open ? "translate-x-0" : "translate-x-full"}`}
        >
          <nav className="p-3 space-y-1 mt-2">
            {NAV.map((item) => {
              const active = location === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    active ? "bg-primary text-white" : "text-foreground hover:bg-muted"
                  }`}
                >
                  <item.icon className="h-4 w-4 flex-shrink-0" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Overlay */}
        {open && (
          <div className="fixed inset-0 bg-black/30 z-30 top-13" onClick={() => setOpen(false)} />
        )}

        {/* Bottom nav (mobile) */}
        <nav className="fixed bottom-0 right-0 left-0 bg-white border-t border-border z-40 flex">
          {NAV.map((item) => {
            const active = location === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex-1 flex flex-col items-center py-2.5 gap-1 text-xs font-semibold transition-colors ${
                  active ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <item.icon className={`h-5 w-5 ${active ? "text-primary" : ""}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Content */}
        <main className="flex-1 pb-20 min-h-screen">{children}</main>
      </div>
    </div>
  );
}
