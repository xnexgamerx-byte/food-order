import { useEffect, useState } from "react";
import { ChevronLeft, Edit2, Check, X, ToggleLeft, ToggleRight, Plus, Trash2 } from "lucide-react";
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

const EMPTY_REST = {
  nameAr: "", categoryAr: "", deliveryTime: "20-35 د",
  deliveryMinutes: "30", minOrder: "5000",
  imageUrl: "", whatsapp: "", discountPercent: "0",
};

function Field({ label, value, onChange, type = "text" }: {
  label: string; value: string; onChange: (v: string) => void; type?: string;
}) {
  return (
    <div>
      <label className="text-xs text-muted-foreground mb-1 block">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-9 px-3 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 text-right"
      />
    </div>
  );
}

export default function AdminRestaurants() {
  const [, setLocation] = useLocation();
  const { token } = useAdmin();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<EditField | null>(null);
  const [saving, setSaving] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [newRest, setNewRest] = useState(EMPTY_REST);

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

  const deleteRestaurant = async (id: number, name: string) => {
    if (!token || !confirm(`هل تريد حذف "${name}" وجميع أصنافه؟`)) return;
    await adminFetch(token, `/api/admin/restaurants/${id}`, { method: "DELETE" });
    setRestaurants((prev) => prev.filter((r) => r.id !== id));
  };

  const addRestaurant = async () => {
    if (!token || !newRest.nameAr) return;
    setSaving(true);
    try {
      const created = await adminFetch(token, "/api/admin/restaurants", {
        method: "POST",
        body: JSON.stringify({
          ...newRest,
          deliveryMinutes: Number(newRest.deliveryMinutes),
          minOrder: Number(newRest.minOrder),
          discountPercent: Number(newRest.discountPercent),
        }),
      });
      setRestaurants((prev) => [...prev, created]);
      setNewRest(EMPTY_REST);
      setShowAdd(false);
    } finally { setSaving(false); }
  };

  const renderEditableCell = (r: Restaurant, field: keyof Restaurant, label: string, type = "text") => {
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
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-black">المطاعم</h1>
          <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-lg">{restaurants.length} مطعم</span>
        </div>

        {/* Add Restaurant Button */}
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="w-full h-11 border-2 border-dashed border-primary/40 text-primary rounded-2xl flex items-center justify-center gap-2 text-sm font-bold hover:border-primary hover:bg-primary/5 transition-all"
        >
          <Plus className="h-4 w-4" /> إضافة مطعم جديد
        </button>

        {/* Add Restaurant Form */}
        {showAdd && (
          <div className="bg-white rounded-2xl border border-border shadow-xs p-4 space-y-3">
            <h2 className="font-bold text-sm">مطعم جديد</h2>
            <Field label="اسم المطعم *" value={newRest.nameAr} onChange={(v) => setNewRest((p) => ({ ...p, nameAr: v }))} />
            <Field label="التصنيف (مثال: برغر، بيتزا)" value={newRest.categoryAr} onChange={(v) => setNewRest((p) => ({ ...p, categoryAr: v }))} />
            <Field label="وقت التوصيل (مثال: 20-35 د)" value={newRest.deliveryTime} onChange={(v) => setNewRest((p) => ({ ...p, deliveryTime: v }))} />
            <div className="grid grid-cols-2 gap-3">
              <Field label="وقت التوصيل (دقيقة)" value={newRest.deliveryMinutes} onChange={(v) => setNewRest((p) => ({ ...p, deliveryMinutes: v }))} type="number" />
              <Field label="الحد الأدنى (د.ع)" value={newRest.minOrder} onChange={(v) => setNewRest((p) => ({ ...p, minOrder: v }))} type="number" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="الخصم %" value={newRest.discountPercent} onChange={(v) => setNewRest((p) => ({ ...p, discountPercent: v }))} type="number" />
              <Field label="واتساب" value={newRest.whatsapp} onChange={(v) => setNewRest((p) => ({ ...p, whatsapp: v }))} />
            </div>
            <Field label="رابط الصورة" value={newRest.imageUrl} onChange={(v) => setNewRest((p) => ({ ...p, imageUrl: v }))} />
            <div className="flex gap-2 pt-1">
              <button onClick={addRestaurant} disabled={saving || !newRest.nameAr}
                className="flex-1 h-10 bg-primary text-white rounded-xl text-sm font-bold disabled:opacity-60">
                {saving ? "جاري الحفظ..." : "إضافة المطعم"}
              </button>
              <button onClick={() => { setShowAdd(false); setNewRest(EMPTY_REST); }}
                className="flex-1 h-10 bg-muted rounded-xl text-sm font-semibold">إلغاء</button>
            </div>
          </div>
        )}

        {/* Restaurants List */}
        {loading
          ? Array(3).fill(0).map((_, i) => <div key={i} className="bg-white rounded-2xl h-48 border border-border animate-pulse" />)
          : restaurants.map((r) => (
            <div key={r.id} className="bg-white rounded-2xl border border-border shadow-xs overflow-hidden">
              {/* Header */}
              <div className="relative h-24">
                <img src={r.imageUrl || "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&q=80"}
                  alt={r.nameAr} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <div className="absolute bottom-3 right-3 left-3 flex items-end justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setLocation(`/admin/restaurants/${r.id}/menu`)}
                      className="flex items-center gap-1 text-xs text-white bg-primary rounded-lg px-2.5 py-1.5 font-semibold"
                    >
                      إدارة القائمة <ChevronLeft className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => deleteRestaurant(r.id, r.nameAr)}
                      className="flex items-center gap-1 text-xs text-white bg-red-500 rounded-lg px-2.5 py-1.5 font-semibold"
                    >
                      <Trash2 className="h-3 w-3" /> حذف
                    </button>
                  </div>
                  <span className="text-white font-black text-base">{r.nameAr}</span>
                </div>
              </div>

              {/* Fields */}
              <div className="px-4 py-2">
                {renderEditableCell(r, "nameAr", "اسم المطعم")}
                {renderEditableCell(r, "categoryAr", "التصنيف")}
                {renderEditableCell(r, "discountPercent", "الخصم %", "number")}
                {renderEditableCell(r, "minOrder", "الحد الأدنى (د.ع)", "number")}
                {renderEditableCell(r, "deliveryTime", "وقت التوصيل")}
                {renderEditableCell(r, "whatsapp", "واتساب", "tel")}
                {renderEditableCell(r, "imageUrl", "رابط الصورة")}

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

        {!loading && restaurants.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-4xl mb-3">🍽️</p>
            <p className="font-semibold">لا توجد مطاعم بعد</p>
            <p className="text-sm mt-1">اضغط "إضافة مطعم جديد" للبدء</p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
