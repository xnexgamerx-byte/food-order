import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { ArrowRight, Plus, Trash2, Edit2, Check, X, Eye, EyeOff } from "lucide-react";
import { useAdmin, adminFetch } from "@/lib/admin-context";
import AdminLayout from "./AdminLayout";

interface MenuItem {
  id: number; nameAr: string; descriptionAr: string;
  price: number; imageUrl: string; categoryAr: string; isAvailable: boolean;
}

const EMPTY_ITEM = { nameAr: "", descriptionAr: "", price: "", imageUrl: "", categoryAr: "" };

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

export default function AdminMenu() {
  const params = useParams<{ id: string }>();
  const restId = Number(params.id);
  const [, setLocation] = useLocation();
  const { token } = useAdmin();
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState<number | null>(null);
  const [editData, setEditData] = useState<Partial<MenuItem>>({});
  const [showAdd, setShowAdd] = useState(false);
  const [newItem, setNewItem] = useState(EMPTY_ITEM);
  const [saving, setSaving] = useState(false);

  const load = () => {
    if (!token) return;
    adminFetch(token, `/api/admin/restaurants/${restId}/menu`)
      .then(setItems).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, [token, restId]);

  const startEdit = (item: MenuItem) => {
    setEditId(item.id);
    setEditData({ nameAr: item.nameAr, descriptionAr: item.descriptionAr, price: item.price, imageUrl: item.imageUrl, categoryAr: item.categoryAr });
  };

  const saveEdit = async () => {
    if (!token || !editId) return;
    setSaving(true);
    try {
      const updated = await adminFetch(token, `/api/admin/menu/${editId}`, { method: "PUT", body: JSON.stringify(editData) });
      setItems((prev) => prev.map((i) => i.id === editId ? { ...i, ...updated } : i));
      setEditId(null);
    } finally { setSaving(false); }
  };

  const toggleAvailable = async (item: MenuItem) => {
    if (!token) return;
    const updated = await adminFetch(token, `/api/admin/menu/${item.id}`, { method: "PUT", body: JSON.stringify({ isAvailable: !item.isAvailable }) });
    setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, ...updated } : i));
  };

  const deleteItem = async (id: number) => {
    if (!token || !confirm("حذف هذا الصنف؟")) return;
    await adminFetch(token, `/api/admin/menu/${id}`, { method: "DELETE" });
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const addItem = async () => {
    if (!token || !newItem.nameAr || !newItem.price) return;
    setSaving(true);
    try {
      const created = await adminFetch(token, `/api/admin/restaurants/${restId}/menu`, { method: "POST", body: JSON.stringify(newItem) });
      setItems((prev) => [...prev, created]);
      setNewItem(EMPTY_ITEM);
      setShowAdd(false);
    } finally { setSaving(false); }
  };

  return (
    <AdminLayout>
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-3 mb-1">
          <button onClick={() => setLocation("/admin/restaurants")} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
            <ArrowRight className="h-4 w-4" />
          </button>
          <h1 className="font-black text-base">إدارة القائمة</h1>
        </div>

        {/* Add button */}
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="w-full h-11 border-2 border-dashed border-primary/40 text-primary rounded-2xl flex items-center justify-center gap-2 text-sm font-bold hover:border-primary hover:bg-primary/5 transition-all"
        >
          <Plus className="h-4 w-4" /> إضافة صنف جديد
        </button>

        {/* Add Form */}
        {showAdd && (
          <div className="bg-white rounded-2xl border border-border shadow-xs p-4 space-y-3">
            <h2 className="font-bold text-sm text-foreground">صنف جديد</h2>
            <Field label="اسم الصنف *" value={newItem.nameAr} onChange={(v) => setNewItem((p) => ({ ...p, nameAr: v }))} />
            <Field label="الوصف" value={newItem.descriptionAr} onChange={(v) => setNewItem((p) => ({ ...p, descriptionAr: v }))} />
            <Field label="السعر (د.ع) *" value={newItem.price} onChange={(v) => setNewItem((p) => ({ ...p, price: v }))} type="number" />
            <Field label="الفئة" value={newItem.categoryAr} onChange={(v) => setNewItem((p) => ({ ...p, categoryAr: v }))} />
            <Field label="رابط الصورة" value={newItem.imageUrl} onChange={(v) => setNewItem((p) => ({ ...p, imageUrl: v }))} />
            <div className="flex gap-2 pt-1">
              <button onClick={addItem} disabled={saving} className="flex-1 h-10 bg-primary text-white rounded-xl text-sm font-bold disabled:opacity-60">
                {saving ? "جاري الحفظ..." : "حفظ"}
              </button>
              <button onClick={() => setShowAdd(false)} className="flex-1 h-10 bg-muted rounded-xl text-sm font-semibold">إلغاء</button>
            </div>
          </div>
        )}

        {/* Items list */}
        {loading
          ? Array(4).fill(0).map((_, i) => <div key={i} className="bg-white rounded-2xl h-24 border border-border animate-pulse" />)
          : items.map((item) => (
            <div key={item.id} className={`bg-white rounded-2xl border shadow-xs overflow-hidden ${!item.isAvailable ? "opacity-60" : "border-border"}`}>
              {editId === item.id ? (
                <div className="p-4 space-y-3">
                  <Field label="اسم الصنف" value={editData.nameAr || ""} onChange={(v) => setEditData((p) => ({ ...p, nameAr: v }))} />
                  <Field label="الوصف" value={editData.descriptionAr || ""} onChange={(v) => setEditData((p) => ({ ...p, descriptionAr: v }))} />
                  <Field label="السعر (د.ع)" value={String(editData.price || "")} onChange={(v) => setEditData((p) => ({ ...p, price: Number(v) }))} type="number" />
                  <Field label="الفئة" value={editData.categoryAr || ""} onChange={(v) => setEditData((p) => ({ ...p, categoryAr: v }))} />
                  <Field label="رابط الصورة" value={editData.imageUrl || ""} onChange={(v) => setEditData((p) => ({ ...p, imageUrl: v }))} />
                  <div className="flex gap-2">
                    <button onClick={saveEdit} disabled={saving} className="flex-1 h-9 bg-primary text-white rounded-xl text-sm font-bold disabled:opacity-60">
                      {saving ? "..." : "حفظ"}
                    </button>
                    <button onClick={() => setEditId(null)} className="flex-1 h-9 bg-muted rounded-xl text-sm">إلغاء</button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 p-3">
                  <img src={item.imageUrl} alt={item.nameAr} className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm line-clamp-1">{item.nameAr}</p>
                    <p className="text-xs text-muted-foreground">{item.categoryAr}</p>
                    <p className="text-primary font-black text-sm mt-1">{Number(item.price).toLocaleString()} د.ع</p>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <button onClick={() => startEdit(item)} className="w-7 h-7 bg-primary/10 text-primary rounded-lg flex items-center justify-center hover:bg-primary/20">
                      <Edit2 className="h-3 w-3" />
                    </button>
                    <button onClick={() => toggleAvailable(item)} className={`w-7 h-7 rounded-lg flex items-center justify-center ${item.isAvailable ? "bg-emerald-100 text-emerald-600" : "bg-muted text-muted-foreground"}`}>
                      {item.isAvailable ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                    </button>
                    <button onClick={() => deleteItem(item.id)} className="w-7 h-7 bg-red-50 text-red-500 rounded-lg flex items-center justify-center hover:bg-red-100">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
      </div>
    </AdminLayout>
  );
}
