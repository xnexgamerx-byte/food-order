import { useEffect, useState } from "react";
import { ChevronLeft, Edit2, Check, X, ToggleLeft, ToggleRight } from "lucide-react";
import { useLocation } from "wouter";
import { useAdmin, adminFetch } from "@/lib/admin-context";
import AdminLayout from "./AdminLayout";

interface Restaurant {
  id: number; nameAr: string; categoryAr: string; rating: number;
  deliveryTime: string; deliveryMinutes: number; minOrder: number;
  imageUrl: string; isOpen: boolean; isFreeDelivery: boolean;
  discountPercent: number; whatsapp: string;
}

type EditField = { id: number; field: string; value: string };

export default function AdminRestaurants() {
  const [, setLocation] = useLocation();
  const { token } = useAdmin();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<EditField | null>(null);
  const [saving, setSaving] = useState(false);

  const load = () => {
    if (!token) return;
    adminFetch(token, "/api/admin/restaurants")
      .then(setRestaurants)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [token]);

  const save = async (id: number, field: string, value: unknown) => {
    if (!token) return;
    setSaving(true);
    try {
      const updated = await adminFetch(token, `/api/admin/restaurants/${id}`, {
        method: "PUT", body: JSON.stringify({ [field]: value }),
      });
      setRestaurants((prev) => prev.map((r) => r.id === id ? { ...r, ...updated } : r));
    } finally {
      setSaving(false);
      setEditing(null);
    }
  };

  const toggle = (r: Restaurant, field: "isOpen" | "isFreeDelivery") => save(r.id, field, !r[field]);

  const EditableCell = ({ r, field, label, type = "text" }: { r: Restaurant; field: keyof Restaurant; label: string; type?: string }) => {
    const isEditing = editing?.id === r.id && editing?.field === field;
    const val = String(r[field]);
    return (
      <div className="flex items-center justify-between py-2 border-b border-border last:border-0">
        <span className="text-xs text-muted-foreground">{label}</span>
        {isEditing ? (
          <div className="flex items-center gap-1.5">
            <input
              type={type}
              defaultValue={val}
              autoFocus
              className="w-28 text-sm border border-primary rounded-lg px-2 py-1 text-right focus:outline-none"
              onKeyDown={(e) => {
                if (e.key === "Enter") save(r.id, field, (e.target as HTMLInputElement).value);
                if (e.key === "Escape") setEditing(null);
              }}
              id={`edit-${r.id}-${field}`}
            />
            <button onClick={() => {
              const inp = document.getElementById(`edit-${r.id}-${field}`) as HTMLInputElement;
              save(r.id, field, inp.value);
            }} className="w-6 h-6 bg-emerald-500 text-white rounded-md flex items-center justify-center">
              <Check className="h-3 w-3" />
            </button>
            <button onClick={() => setEditing(null)} className="w-6 h-6 bg-muted rounded-md flex items-center justify-center">
              <X className="h-3 w-3" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setEditing({ id: r.id, field, value: val })}
            className="flex items-center gap-1.5 text-sm font-semibold hover:text-primary transition-colors group"
          >
            {val}
            <Edit2 className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        )}
      </div>
    );
  };

  return (
    <AdminLayout>
      <div className="p-4 space-y-4">
        <h1 className="text-lg font-black">المطاعم</h1>

        {loading
          ? Array(3).fill(0).map((_, i) => <div key={i} className="bg-white rounded-2xl h-48 border border-border animate-pulse" />)
          : restaurants.map((r) => (
            <div key={r.id} className="bg-white rounded-2xl border border-border shadow-xs overflow-hidden">
              {/* Header */}
              <div className="relative h-24">
                <img src={r.imageUrl} alt={r.nameAr} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <div className="absolute bottom-3 right-3 left-3 flex items-end justify-between">
                  <button
                    onClick={() => setLocation(`/admin/restaurants/${r.id}/menu`)}
                    className="flex items-center gap-1 text-xs text-white bg-primary rounded-lg px-2.5 py-1.5 font-semibold"
                  >
                    إدارة القائمة <ChevronLeft className="h-3 w-3" />
                  </button>
                  <span className="text-white font-black text-base">{r.nameAr}</span>
                </div>
              </div>

              {/* Fields */}
              <div className="px-4 py-2">
                <EditableCell r={r} field="nameAr" label="اسم المطعم" />
                <EditableCell r={r} field="discountPercent" label="الخصم %" type="number" />
                <EditableCell r={r} field="minOrder" label="الحد الأدنى (د.ع)" type="number" />
                <EditableCell r={r} field="deliveryTime" label="وقت التوصيل" />
                <EditableCell r={r} field="whatsapp" label="واتساب" type="tel" />
                <EditableCell r={r} field="imageUrl" label="رابط الصورة" />

                {/* Toggles */}
                <div className="flex gap-3 pt-3 pb-1">
                  <button
                    onClick={() => toggle(r, "isOpen")}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold border transition-all ${r.isOpen ? "bg-emerald-50 border-emerald-300 text-emerald-700" : "bg-red-50 border-red-300 text-red-600"}`}
                  >
                    {r.isOpen ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                    {r.isOpen ? "مفتوح" : "مغلق"}
                  </button>
                  <button
                    onClick={() => toggle(r, "isFreeDelivery")}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold border transition-all ${r.isFreeDelivery ? "bg-blue-50 border-blue-300 text-blue-700" : "bg-muted border-border text-muted-foreground"}`}
                  >
                    {r.isFreeDelivery ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                    توصيل مجاني
                  </button>
                </div>
              </div>
            </div>
          ))}
      </div>
    </AdminLayout>
  );
}
