import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import {
  Store, ShoppingBag, Banknote, Clock, TrendingUp, ChevronLeft,
  CheckCircle2, Truck, XCircle, RefreshCw, BarChart3, Calendar,
} from "lucide-react";
import { useAdmin, adminFetch } from "@/lib/admin-context";
import AdminLayout from "./AdminLayout";

interface Stats {
  restaurantCount: number;
  orderCount: number;
  totalRevenue: number;
  pendingOrders: number;
}

interface Order {
  id: number; orderNumber: string; customerName: string;
  restaurantName: string; total: number; status: string; createdAt: string;
  items: string;
}

const STATUS_BADGE: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  pending:   { label: "قيد الانتظار", color: "bg-amber-50 text-amber-700 border-amber-200", icon: Clock },
  confirmed: { label: "مؤكد",         color: "bg-blue-50 text-blue-700 border-blue-200",   icon: CheckCircle2 },
  preparing: { label: "يُحضَّر",       color: "bg-purple-50 text-purple-700 border-purple-200", icon: RefreshCw },
  delivered: { label: "تم التوصيل",   color: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: Truck },
  cancelled: { label: "ملغى",         color: "bg-red-50 text-red-600 border-red-200",      icon: XCircle },
};

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const { token } = useAdmin();
  const [stats, setStats] = useState<Stats | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [s, o] = await Promise.all([
        adminFetch(token, "/api/admin/stats"),
        adminFetch(token, "/api/admin/orders"),
      ]);
      setStats(s);
      setOrders(o);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [token]);

  // Compute today's & this month's sales
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

  const deliveredOrders = orders.filter((o) => o.status === "delivered");
  const todaySales = deliveredOrders
    .filter((o) => new Date(o.createdAt).getTime() >= todayStart)
    .reduce((s, o) => s + o.total, 0);
  const monthSales = deliveredOrders
    .filter((o) => new Date(o.createdAt).getTime() >= monthStart)
    .reduce((s, o) => s + o.total, 0);

  // Top selling restaurants (by # of delivered orders)
  const restaurantSales: Record<string, { count: number; revenue: number }> = {};
  deliveredOrders.forEach((o) => {
    if (!restaurantSales[o.restaurantName]) {
      restaurantSales[o.restaurantName] = { count: 0, revenue: 0 };
    }
    restaurantSales[o.restaurantName].count++;
    restaurantSales[o.restaurantName].revenue += o.total;
  });
  const topRestaurants = Object.entries(restaurantSales)
    .sort((a, b) => b[1].revenue - a[1].revenue)
    .slice(0, 5);

  const recentOrders = orders.slice(0, 6);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("ar-IQ", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  };

  return (
    <AdminLayout>
      <div className="pb-6">
        {/* Hero greeting */}
        <div className="bg-gradient-to-br from-blue-950 via-blue-900 to-blue-800 px-4 pt-5 pb-12 text-white relative overflow-hidden">
          <div className="absolute -top-10 -left-10 w-40 h-40 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -right-10 w-60 h-60 bg-blue-400/10 rounded-full blur-3xl" />
          <div className="relative">
            <p className="text-xs text-blue-200 mb-1">{new Date().toLocaleDateString("ar-IQ", { weekday: "long", day: "numeric", month: "long" })}</p>
            <h1 className="text-2xl font-black mb-1">مرحباً بك 👋</h1>
            <p className="text-sm text-blue-100/90">إليك ملخص أداء منصتك اليوم</p>
          </div>
        </div>

        <div className="px-4 -mt-8 space-y-4 relative z-10">
          {/* Top Stats - Sales focus */}
          <div className="grid grid-cols-2 gap-3">
            {loading ? (
              Array(2).fill(0).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl h-28 border border-border animate-pulse" />
              ))
            ) : (
              <>
                <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white rounded-2xl p-4 shadow-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-9 h-9 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                      <Banknote className="h-5 w-5" />
                    </div>
                    <TrendingUp className="h-4 w-4 opacity-80" />
                  </div>
                  <p className="text-2xl font-black">{todaySales.toLocaleString()}</p>
                  <p className="text-xs text-emerald-50 mt-0.5">مبيعات اليوم (د.ع)</p>
                </div>

                <div className="bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-2xl p-4 shadow-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-9 h-9 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                      <Calendar className="h-5 w-5" />
                    </div>
                    <TrendingUp className="h-4 w-4 opacity-80" />
                  </div>
                  <p className="text-2xl font-black">{monthSales.toLocaleString()}</p>
                  <p className="text-xs text-blue-50 mt-0.5">مبيعات الشهر (د.ع)</p>
                </div>
              </>
            )}
          </div>

          {/* Secondary stats */}
          <div className="grid grid-cols-3 gap-2">
            {loading || !stats ? (
              Array(3).fill(0).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl h-20 border border-border animate-pulse" />
              ))
            ) : (
              [
                { label: "المطاعم", value: stats.restaurantCount, icon: Store, color: "text-blue-600 bg-blue-50" },
                { label: "كل الطلبات", value: stats.orderCount, icon: ShoppingBag, color: "text-purple-600 bg-purple-50" },
                { label: "بانتظار", value: stats.pendingOrders, icon: Clock, color: "text-amber-600 bg-amber-50" },
              ].map((c) => (
                <div key={c.label} className="bg-white rounded-2xl p-3 border border-border shadow-xs">
                  <div className={`w-7 h-7 ${c.color} rounded-lg flex items-center justify-center mb-1.5`}>
                    <c.icon className="h-3.5 w-3.5" />
                  </div>
                  <p className="text-base font-black">{c.value}</p>
                  <p className="text-[10px] text-muted-foreground">{c.label}</p>
                </div>
              ))
            )}
          </div>

          {/* Top Selling Restaurants */}
          <div className="bg-white rounded-2xl border border-border shadow-xs overflow-hidden">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <h2 className="font-bold text-sm flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" /> الأكثر مبيعاً
              </h2>
              <span className="text-xs text-muted-foreground">حسب الإيرادات</span>
            </div>
            <div className="p-3">
              {loading ? (
                Array(3).fill(0).map((_, i) => <div key={i} className="h-12 mb-2 bg-muted rounded-xl animate-pulse" />)
              ) : topRestaurants.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground text-sm">
                  <p className="text-3xl mb-2">📊</p>
                  <p>لا توجد مبيعات بعد</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {topRestaurants.map(([name, data], idx) => {
                    const max = topRestaurants[0][1].revenue;
                    const pct = (data.revenue / max) * 100;
                    return (
                      <div key={name} className="flex items-center gap-3">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black flex-shrink-0 ${
                          idx === 0 ? "bg-amber-100 text-amber-700" :
                          idx === 1 ? "bg-slate-100 text-slate-600" :
                          idx === 2 ? "bg-orange-100 text-orange-700" :
                          "bg-muted text-muted-foreground"
                        }`}>
                          {idx + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-semibold text-sm truncate">{name}</span>
                            <span className="text-xs text-muted-foreground">{data.count} طلب</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                              <div className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all" style={{ width: `${pct}%` }} />
                            </div>
                            <span className="text-xs font-bold text-primary w-fit">{data.revenue.toLocaleString()} د.ع</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Recent Orders / Sales List */}
          <div className="bg-white rounded-2xl border border-border shadow-xs overflow-hidden">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <h2 className="font-bold text-sm flex items-center gap-2">
                <ShoppingBag className="h-4 w-4 text-primary" /> آخر الطلبات
              </h2>
              <button
                onClick={() => setLocation("/admin/orders")}
                className="text-xs text-primary font-semibold flex items-center gap-0.5 hover:gap-1 transition-all"
              >
                عرض الكل <ChevronLeft className="h-3 w-3" />
              </button>
            </div>
            <div>
              {loading ? (
                Array(3).fill(0).map((_, i) => <div key={i} className="h-16 mb-1 mx-3 bg-muted rounded-xl animate-pulse" />)
              ) : recentOrders.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  <p className="text-3xl mb-2">📋</p>
                  <p>لا توجد طلبات بعد</p>
                </div>
              ) : (
                recentOrders.map((order) => {
                  const cfg = STATUS_BADGE[order.status] || STATUS_BADGE.pending;
                  const Icon = cfg.icon;
                  return (
                    <button
                      key={order.id}
                      onClick={() => setLocation("/admin/orders")}
                      className="w-full text-right px-4 py-3 border-b border-border last:border-0 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="font-black text-primary text-xs">{order.orderNumber}</span>
                            <span className={`flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md border ${cfg.color}`}>
                              <Icon className="h-2.5 w-2.5" />
                              {cfg.label}
                            </span>
                          </div>
                          <p className="font-semibold text-sm truncate">{order.customerName}</p>
                          <p className="text-xs text-muted-foreground truncate">{order.restaurantName}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">{formatDate(order.createdAt)}</p>
                        </div>
                        <div className="text-left flex-shrink-0">
                          <p className="font-black text-primary text-sm">{order.total.toLocaleString()}</p>
                          <p className="text-[10px] text-muted-foreground">د.ع</p>
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Quick links */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setLocation("/admin/restaurants")}
              className="bg-white rounded-2xl border border-border shadow-xs p-4 flex items-center gap-3 hover:border-primary/40 hover:shadow-md transition-all text-right"
            >
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Store className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm">المطاعم</p>
                <p className="text-xs text-muted-foreground">إدارة كاملة</p>
              </div>
              <ChevronLeft className="h-4 w-4 text-muted-foreground" />
            </button>

            <button
              onClick={() => setLocation("/admin/orders")}
              className="bg-white rounded-2xl border border-border shadow-xs p-4 flex items-center gap-3 hover:border-primary/40 hover:shadow-md transition-all text-right"
            >
              <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <ShoppingBag className="h-5 w-5 text-emerald-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm">الطلبات</p>
                <p className="text-xs text-muted-foreground">متابعة وتحديث</p>
              </div>
              <ChevronLeft className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
