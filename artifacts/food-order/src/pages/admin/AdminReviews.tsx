import { useEffect, useState } from "react";
import { Star, Trash2, MessageSquare, RefreshCw, Phone } from "lucide-react";
import { useAdmin, adminFetch } from "@/lib/admin-context";
import AdminLayout from "./AdminLayout";

interface AdminReview {
  id: number;
  orderId: number;
  restaurantId: number;
  customerPhone: string;
  rating: number;
  message: string;
  createdAt: string;
  restaurantName: string | null;
  orderNumber: string | null;
  customerName: string | null;
}

const FILTERS: { key: "all" | "low" | "high"; label: string }[] = [
  { key: "all", label: "الكل" },
  { key: "low", label: "شكاوى (<3)" },
  { key: "high", label: "إيجابية (4+)" },
];

export default function AdminReviews() {
  const { token } = useAdmin();
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [filter, setFilter] = useState<"all" | "low" | "high">("all");

  const load = () => {
    if (!token) return;
    setLoading(true);
    adminFetch(token, "/api/admin/reviews")
      .then(setReviews)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [token]);

  const remove = async (id: number) => {
    if (!token) return;
    if (!confirm("حذف هذا التقييم نهائياً؟ سيُعاد حساب تقييم المطعم.")) return;
    setDeleting(id);
    try {
      await adminFetch(token, `/api/admin/reviews/${id}`, { method: "DELETE" });
      setReviews((prev) => prev.filter((r) => r.id !== id));
    } catch {
      alert("تعذر الحذف");
    } finally {
      setDeleting(null);
    }
  };

  const filtered = reviews.filter((r) =>
    filter === "all" ? true : filter === "low" ? r.rating < 3 : r.rating >= 4,
  );

  const stats = {
    total: reviews.length,
    avg: reviews.length
      ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
      : "—",
    low: reviews.filter((r) => r.rating < 3).length,
    high: reviews.filter((r) => r.rating >= 4).length,
  };

  return (
    <AdminLayout>
      <div className="p-4 max-w-3xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black flex items-center gap-2">
              <Star className="h-5 w-5 fill-amber-500 text-amber-500" />
              التقييمات
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">آراء العملاء بعد التوصيل</p>
          </div>
          <button
            onClick={load}
            className="flex items-center gap-1.5 text-xs font-bold text-primary hover:bg-primary/10 px-3 py-2 rounded-xl"
            data-testid="button-refresh-reviews"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            تحديث
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-2">
          <StatCard label="المجموع" value={String(stats.total)} color="text-foreground" />
          <StatCard label="متوسط" value={stats.avg} color="text-amber-600" icon={<Star className="h-3 w-3 fill-amber-500 text-amber-500" />} />
          <StatCard label="إيجابية" value={String(stats.high)} color="text-emerald-600" />
          <StatCard label="شكاوى" value={String(stats.low)} color="text-rose-600" />
        </div>

        {/* Filters */}
        <div className="flex gap-1.5 bg-white p-1 rounded-xl border border-border">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`flex-1 text-xs font-bold py-2 rounded-lg transition-colors ${
                filter === f.key ? "bg-primary text-white" : "text-muted-foreground hover:bg-muted"
              }`}
              data-testid={`filter-${f.key}`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* List */}
        {loading ? (
          <div className="text-center py-12 text-sm text-muted-foreground">جاري التحميل...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-14">
            <div className="w-16 h-16 mx-auto bg-muted rounded-3xl flex items-center justify-center mb-3">
              <MessageSquare className="h-7 w-7 text-muted-foreground" />
            </div>
            <p className="font-bold">لا توجد تقييمات</p>
            <p className="text-xs text-muted-foreground mt-1">
              {filter === "all" ? "لم يتم إرسال أي تقييم بعد" : "لا توجد تقييمات في هذا القسم"}
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filtered.map((r) => <ReviewCard key={r.id} r={r} onDelete={remove} deleting={deleting === r.id} />)}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

function StatCard({ label, value, color, icon }: { label: string; value: string; color: string; icon?: React.ReactNode }) {
  return (
    <div className="bg-white border border-border rounded-xl px-2 py-2.5 text-center">
      <div className={`text-base font-black flex items-center justify-center gap-1 ${color}`}>
        {icon}
        {value}
      </div>
      <div className="text-[10px] text-muted-foreground mt-0.5">{label}</div>
    </div>
  );
}

function ReviewCard({ r, onDelete, deleting }: { r: AdminReview; onDelete: (id: number) => void; deleting: boolean }) {
  const isLow = r.rating < 3;
  const date = new Date(r.createdAt);

  return (
    <div
      className={`bg-white rounded-2xl border-2 overflow-hidden ${
        isLow ? "border-rose-200" : "border-border"
      }`}
      data-testid={`review-card-${r.id}`}
    >
      {/* Header */}
      <div className={`px-3 py-2 flex items-center justify-between ${isLow ? "bg-rose-50" : "bg-amber-50/60"}`}>
        <div className="flex items-center gap-2">
          <div className="flex gap-0.5" dir="ltr">
            {[1, 2, 3, 4, 5].map((n) => (
              <Star
                key={n}
                className={`h-3.5 w-3.5 ${n <= r.rating ? "fill-amber-500 text-amber-500" : "text-muted-foreground/30"}`}
              />
            ))}
          </div>
          <span className={`text-xs font-black ${isLow ? "text-rose-700" : "text-amber-700"}`}>
            {r.rating}/5
          </span>
          {isLow && (
            <span className="text-[10px] bg-rose-600 text-white px-1.5 py-0.5 rounded-full font-bold">
              شكوى
            </span>
          )}
        </div>
        <span className="text-[10px] text-muted-foreground">
          {date.toLocaleString("ar-IQ", { dateStyle: "short", timeStyle: "short" })}
        </span>
      </div>

      {/* Body */}
      <div className="p-3 space-y-2 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">المطعم</span>
          <span className="font-bold">{r.restaurantName || "—"}</span>
        </div>
        <div className="flex items-center justify-between border-t border-border pt-2">
          <span className="text-xs text-muted-foreground">الطلب</span>
          <span className="font-mono text-xs font-bold text-primary">{r.orderNumber || `#${r.orderId}`}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">العميل</span>
          <div className="text-left">
            <div className="font-semibold text-xs">{r.customerName || "—"}</div>
            <a href={`tel:${r.customerPhone}`} className="text-[11px] text-primary flex items-center gap-1 justify-end mt-0.5" dir="ltr">
              <Phone className="h-3 w-3" />
              {r.customerPhone}
            </a>
          </div>
        </div>

        {r.message && (
          <div className={`mt-2 px-3 py-2 rounded-xl text-xs leading-relaxed ${
            isLow ? "bg-rose-50 text-rose-900 border border-rose-200" : "bg-muted/40 text-foreground"
          }`}>
            <MessageSquare className="h-3.5 w-3.5 inline-block ml-1 -mt-0.5" />
            {r.message}
          </div>
        )}

        <button
          onClick={() => onDelete(r.id)}
          disabled={deleting}
          className="w-full mt-1 flex items-center justify-center gap-1.5 h-8 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-lg disabled:opacity-50"
          data-testid={`button-delete-review-${r.id}`}
        >
          <Trash2 className="h-3.5 w-3.5" />
          {deleting ? "جاري الحذف..." : "حذف التقييم"}
        </button>
      </div>
    </div>
  );
}
