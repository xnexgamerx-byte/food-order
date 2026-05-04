import { useEffect, useState } from "react";
import { Store, ShoppingBag, Banknote, Clock } from "lucide-react";
import { useAdmin, adminFetch } from "@/lib/admin-context";
import AdminLayout from "./AdminLayout";

interface Stats {
  restaurantCount: number;
  orderCount: number;
  totalRevenue: number;
  pendingOrders: number;
}

export default function AdminDashboard() {
  const { token } = useAdmin();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    adminFetch(token, "/api/admin/stats")
      .then(setStats)
      .finally(() => setLoading(false));
  }, [token]);

  const cards = stats
    ? [
        { label: "المطاعم", value: stats.restaurantCount, icon: Store, color: "bg-blue-500" },
        { label: "إجمالي الطلبات", value: stats.orderCount, icon: ShoppingBag, color: "bg-emerald-500" },
        { label: "المبيعات (د.ع)", value: stats.totalRevenue.toLocaleString(), icon: Banknote, color: "bg-amber-500" },
        { label: "طلبات قيد الانتظار", value: stats.pendingOrders, icon: Clock, color: "bg-red-500" },
      ]
    : [];

  return (
    <AdminLayout>
      <div className="p-4 space-y-5">
        <div>
          <h1 className="text-lg font-black text-foreground">مرحباً 👋</h1>
          <p className="text-xs text-muted-foreground mt-0.5">ملخص نشاط منصة الطلب</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          {loading
            ? Array(4).fill(0).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl p-4 border border-border animate-pulse h-24" />
              ))
            : cards.map((card) => (
                <div key={card.label} className="bg-white rounded-2xl p-4 border border-border shadow-xs">
                  <div className={`w-9 h-9 ${card.color} rounded-xl flex items-center justify-center mb-3`}>
                    <card.icon className="h-4.5 w-4.5 text-white" />
                  </div>
                  <p className="text-xl font-black text-foreground">{card.value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{card.label}</p>
                </div>
              ))}
        </div>

        {/* Quick links */}
        <div className="bg-white rounded-2xl border border-border shadow-xs p-4">
          <h2 className="font-bold text-sm mb-3">روابط سريعة</h2>
          <div className="space-y-2">
            <a href="/admin/restaurants" className="flex items-center justify-between p-3 rounded-xl bg-muted hover:bg-border transition-colors">
              <span className="text-sm font-semibold">إدارة المطاعم والقوائم</span>
              <Store className="h-4 w-4 text-primary" />
            </a>
            <a href="/admin/orders" className="flex items-center justify-between p-3 rounded-xl bg-muted hover:bg-border transition-colors">
              <span className="text-sm font-semibold">عرض الطلبات</span>
              <ShoppingBag className="h-4 w-4 text-primary" />
            </a>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
