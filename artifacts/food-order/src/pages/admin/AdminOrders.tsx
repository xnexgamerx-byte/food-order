import { useEffect, useState } from "react";
import { Clock, CheckCircle2, XCircle, Truck, RefreshCw } from "lucide-react";
import { useAdmin, adminFetch } from "@/lib/admin-context";
import AdminLayout from "./AdminLayout";

interface Order {
  id: number; orderNumber: string; customerName: string; customerPhone: string;
  restaurantName: string; neighborhood: string; address: string; total: number;
  status: string; notes: string; createdAt: string;
  items: Array<{ nameAr: string; quantity: number; price: number }>;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  pending:   { label: "قيد الانتظار", color: "bg-amber-100 text-amber-700 border-amber-300", icon: Clock },
  confirmed: { label: "مؤكد",         color: "bg-blue-100 text-blue-700 border-blue-300",   icon: CheckCircle2 },
  preparing: { label: "يُحضَّر",       color: "bg-purple-100 text-purple-700 border-purple-300", icon: RefreshCw },
  delivered: { label: "تم التوصيل",   color: "bg-emerald-100 text-emerald-700 border-emerald-300", icon: Truck },
  cancelled: { label: "ملغى",         color: "bg-red-100 text-red-600 border-red-300",       icon: XCircle },
};

const STATUS_OPTIONS = Object.entries(STATUS_CONFIG).map(([k, v]) => ({ value: k, label: v.label }));

export default function AdminOrders() {
  const { token } = useAdmin();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [updating, setUpdating] = useState<number | null>(null);

  const load = () => {
    if (!token) return;
    setLoading(true);
    adminFetch(token, "/api/admin/orders")
      .then(setOrders).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [token]);

  const updateStatus = async (id: number, status: string) => {
    if (!token) return;
    setUpdating(id);
    try {
      const updated = await adminFetch(token, `/api/admin/orders/${id}/status`, {
        method: "PUT", body: JSON.stringify({ status }),
      });
      setOrders((prev) => prev.map((o) => o.id === id ? { ...o, ...updated } : o));
    } finally { setUpdating(null); }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("ar-IQ", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  };

  return (
    <AdminLayout>
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-black">الطلبات</h1>
          <button onClick={load} className="w-8 h-8 bg-muted rounded-full flex items-center justify-center hover:bg-border transition-colors">
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>

        {/* Filter chips */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {STATUS_OPTIONS.map((s) => {
            const cfg = STATUS_CONFIG[s.value];
            const count = orders.filter((o) => o.status === s.value).length;
            return count > 0 ? (
              <span key={s.value} className={`flex-shrink-0 text-xs font-bold px-2.5 py-1 rounded-full border ${cfg.color}`}>
                {s.label} ({count})
              </span>
            ) : null;
          })}
        </div>

        {loading
          ? Array(3).fill(0).map((_, i) => <div key={i} className="bg-white rounded-2xl h-28 border border-border animate-pulse" />)
          : orders.length === 0
          ? (
            <div className="flex flex-col items-center py-16 gap-3">
              <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center text-3xl">📋</div>
              <p className="text-muted-foreground text-sm">لا توجد طلبات بعد</p>
            </div>
          )
          : orders.map((order) => {
            const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
            const Icon = cfg.icon;
            const isOpen = expanded === order.id;
            const items = typeof order.items === "string" ? JSON.parse(order.items) : order.items;

            return (
              <div key={order.id} className="bg-white rounded-2xl border border-border shadow-xs overflow-hidden">
                {/* Header */}
                <button onClick={() => setExpanded(isOpen ? null : order.id)} className="w-full text-right">
                  <div className="p-3 flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-black text-primary text-sm">{order.orderNumber}</span>
                        <span className={`flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full border ${cfg.color}`}>
                          <Icon className="h-3 w-3" />
                          {cfg.label}
                        </span>
                      </div>
                      <p className="font-semibold text-sm">{order.customerName}</p>
                      <p className="text-xs text-muted-foreground">{order.restaurantName} • {order.neighborhood}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{formatDate(order.createdAt)}</p>
                    </div>
                    <div className="text-left">
                      <p className="font-black text-primary text-sm">{order.total.toLocaleString()} د.ع</p>
                      <p className="text-xs text-muted-foreground">{items?.length || 0} أصناف</p>
                    </div>
                  </div>
                </button>

                {/* Expanded */}
                {isOpen && (
                  <div className="border-t border-border px-3 pb-3 pt-2 space-y-3">
                    {/* Items */}
                    <div className="space-y-1">
                      {(items || []).map((item: { nameAr: string; quantity: number; price: number }, i: number) => (
                        <div key={i} className="flex justify-between text-xs py-1 border-b border-border last:border-0">
                          <span className="text-muted-foreground">{(item.price * item.quantity).toLocaleString()} د.ع</span>
                          <span className="font-semibold">{item.nameAr} × {item.quantity}</span>
                        </div>
                      ))}
                    </div>

                    {/* Address */}
                    <div className="bg-muted rounded-xl px-3 py-2 text-xs space-y-1">
                      <p><span className="text-muted-foreground">الهاتف: </span><span className="font-semibold" dir="ltr">{order.customerPhone}</span></p>
                      <p><span className="text-muted-foreground">العنوان: </span><span className="font-semibold">{order.address}</span></p>
                      {order.notes && <p><span className="text-muted-foreground">ملاحظات: </span><span>{order.notes}</span></p>}
                    </div>

                    {/* Status update */}
                    <div>
                      <p className="text-xs text-muted-foreground mb-1.5">تغيير الحالة:</p>
                      <div className="grid grid-cols-3 gap-1.5">
                        {STATUS_OPTIONS.map((s) => {
                          const sc = STATUS_CONFIG[s.value];
                          return (
                            <button
                              key={s.value}
                              disabled={order.status === s.value || updating === order.id}
                              onClick={() => updateStatus(order.id, s.value)}
                              className={`py-1.5 rounded-lg text-xs font-bold border transition-all disabled:opacity-40 ${order.status === s.value ? sc.color : "bg-muted border-border text-muted-foreground hover:border-primary hover:text-primary"}`}
                            >
                              {s.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
      </div>
    </AdminLayout>
  );
}
