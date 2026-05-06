import { useEffect, useState } from "react";
import { ChevronLeft, Edit2, Check, X, ToggleLeft, ToggleRight, Plus, Trash2, MapPin } from "lucide-react";
import { useLocation } from "wouter";
import { useAdmin, adminFetch } from "@/lib/admin-context";
import { ImageUpload } from "@/components/ImageUpload";
import AdminLayout from "./AdminLayout";

interface Restaurant {
  id: number; nameAr: string; categoryAr: string; rating: number;
  deliveryTime: string; deliveryMinutes: number; minOrder: number; maxDeliveryFee: number | null;
  deliveryFee: number; pricePerKm: number;
  lat: number | null; lng: number | null;
  imageUrl: string; isOpen: boolean; isFreeDelivery: boolean;
  discountPercent: number; whatsapp: string;
}

type EditField = { id: number; field: string; value: string };

const EMPTY_REST = {
  nameAr: "", categoryAr: "", deliveryTime: "20-35 د",
  deliveryMinutes: "30", minOrder: "5000", maxDeliveryFee: "", deliveryFee: "2000",
  pricePerKm: "500", lat: "", lng: "", mapsUrl: "",
  imageUrl: "", whatsapp: "", discountPercent: "0",
};

function parseGoogleMapsUrl(url: string): { lat: number; lng: number } | null {
  if (!url) return null;
  const patterns = [
    /@(-?\d+\.\d+),(-?\d+\.\d+)/,
    /[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/,
    /[?&]ll=(-?\d+\.\d+),(-?\d+\.\d+)/,
    /\/place\/[^/]+\/@(-?\d+\.\d+),(-?\d+\.\d+)/,
    /maps\.google\.[^/]+\/\?.*q=(-?\d+\.\d+)%2C(-?\d+\.\d+)/,
  ];
  for (const re of patterns) {
    const m = url.match(re);
    if (m) return { lat: parseFloat(m[1]), lng: parseFloat(m[2]) };
  }
  const coordOnly = url.trim().match(/^(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)$/);
  if (coordOnly) return { lat: parseFloat(coordOnly[1]), lng: parseFloat(coordOnly[2]) };
  return null;
}

function Field({ label, value, onChange, type = "text", placeholder }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string;
}) {
  return (
    <div>
      <label className="text-xs text-muted-foreground mb-1 block">{label}</label>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-9 px-3 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 text-right"
      />
    </div>
  );
}

async function resolveUrl(url: string): Promise<{ lat: number; lng: number } | null> {
  const direct = parseGoogleMapsUrl(url);
  if (direct) return direct;
  try {
    const res = await fetch(`/api/resolve-maps-url?url=${encodeURIComponent(url)}`);
    if (!res.ok) return null;
    const data = await res.json() as { lat?: number; lng?: number };
    if (data.lat !== undefined && data.lng !== undefined) return { lat: data.lat, lng: data.lng };
  } catch { /* ignore */ }
  return null;
}

function MapsUrlField({
  lat, lng, onParsed,
}: {
  lat: string; lng: string;
  onParsed: (lat: string, lng: string) => void;
}) {
  const [value, setValue] = useState("");
  const [status, setStatus] = useState<"idle" | "ok" | "error" | "loading">("idle");

  const handleChange = async (v: string) => {
    setValue(v);
    if (!v) { setStatus("idle"); onParsed("", ""); return; }

    // Check if it's plain coordinates: "34.6057, 43.6796"
    const coordOnly = v.trim().match(/^(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)$/);
    if (coordOnly) {
      const clat = parseFloat(coordOnly[1]);
      const clng = parseFloat(coordOnly[2]);
      if (clat >= -90 && clat <= 90 && clng >= -180 && clng <= 180) {
        setStatus("ok");
        onParsed(String(clat), String(clng));
        return;
      }
    }

    setStatus("loading");
    const parsed = await resolveUrl(v);
    if (parsed) {
      setStatus("ok");
      onParsed(String(parsed.lat), String(parsed.lng));
    } else {
      setStatus("error");
      onParsed("", "");
    }
  };

  return (
    <div>
      <label className="text-xs text-muted-foreground mb-1 block">موقع المطعم</label>
      <div className="relative">
        <input
          value={value}
          placeholder='رابط خرائط جوجل أو "34.60, 43.67"'
          onChange={(e) => handleChange(e.target.value)}
          className={`w-full h-9 pr-3 pl-8 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 text-right transition-colors ${
            status === "ok" ? "border-emerald-400 bg-emerald-50" :
            status === "error" ? "border-red-400 bg-red-50" :
            status === "loading" ? "border-amber-300 bg-amber-50" :
            "border-border"
          }`}
        />
        <MapPin className={`absolute left-2.5 top-2.5 h-4 w-4 ${
          status === "ok" ? "text-emerald-500" :
          status === "error" ? "text-red-400" :
          status === "loading" ? "text-amber-500 animate-pulse" :
          "text-muted-foreground"
        }`} />
      </div>
      {status === "loading" && <p className="text-[11px] text-amber-600 mt-1">جاري قراءة الرابط...</p>}
      {status === "ok" && lat && lng && (
        <p className="text-[11px] text-emerald-600 mt-1 font-medium">
          ✓ الموقع: {parseFloat(lat).toFixed(4)}, {parseFloat(lng).toFixed(4)}
        </p>
      )}
      {status === "error" && (
        <div className="mt-1 bg-red-50 border border-red-200 rounded-lg p-2 text-[11px] text-red-700 space-y-1">
          <p className="font-bold">تعذّر قراءة الرابط المختصر</p>
          <p>من الجوال: افتح خرائط جوجل ← اضغط مطوّلاً على موقع المطعم ← انسخ الأرقام من الأسفل (مثل <span dir="ltr">34.6057, 43.6796</span>) والصقها هنا مباشرة</p>
        </div>
      )}
      {status === "idle" && (
        <p className="text-[10px] text-muted-foreground mt-1">
          الصق رابط خرائط جوجل — أو الأرقام مباشرة: <span dir="ltr">34.60, 43.67</span>
        </p>
      )}
    </div>
  );
}

function MapsUrlEditField({
  restaurantId, lat, lng,
  onSaved,
}: {
  restaurantId: number;
  lat: number | null; lng: number | null;
  onSaved: (lat: number | null, lng: number | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [parsed, setParsed] = useState<{ lat: number; lng: number } | null>(null);
  const [status, setStatus] = useState<"idle" | "ok" | "error" | "loading">("idle");

  const handleChange = async (v: string) => {
    setUrl(v);
    if (!v) { setStatus("idle"); setParsed(null); return; }

    // Accept plain coordinates "34.6057, 43.6796"
    const coordOnly = v.trim().match(/^(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)$/);
    if (coordOnly) {
      const clat = parseFloat(coordOnly[1]);
      const clng = parseFloat(coordOnly[2]);
      if (clat >= -90 && clat <= 90 && clng >= -180 && clng <= 180) {
        setStatus("ok");
        setParsed({ lat: clat, lng: clng });
        return;
      }
    }

    setStatus("loading");
    const res = await resolveUrl(v);
    if (res) { setStatus("ok"); setParsed(res); }
    else { setStatus("error"); setParsed(null); }
  };

  const handleSave = () => {
    if (!parsed) return;
    onSaved(parsed.lat, parsed.lng);
    setOpen(false);
    setUrl("");
    setParsed(null);
    setStatus("idle");
  };

  const hasLocation = lat !== null && lng !== null;

  return (
    <div className="py-2 border-b border-border">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">موقع المطعم</span>
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-1.5 text-sm font-semibold hover:text-primary transition-colors group"
        >
          {hasLocation ? (
            <span className="text-emerald-600 text-xs font-bold flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              محدد ✓
            </span>
          ) : (
            <span className="text-muted-foreground text-xs flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              غير محدد
            </span>
          )}
          <Edit2 className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>
      </div>

      {open && (
        <div className="mt-2 space-y-2">
          <div className="relative">
            <input
              value={url}
              placeholder='رابط جوجل أو "34.60, 43.67"'
              autoFocus
              onChange={(e) => handleChange(e.target.value)}
              className={`w-full h-9 pr-3 pl-8 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 text-right transition-colors ${
                status === "ok" ? "border-emerald-400 bg-emerald-50" :
                status === "error" ? "border-red-400 bg-red-50" :
                status === "loading" ? "border-amber-300 bg-amber-50" :
                "border-border"
              }`}
            />
            <MapPin className={`absolute left-2.5 top-2.5 h-4 w-4 ${
              status === "ok" ? "text-emerald-500" :
              status === "error" ? "text-red-400" :
              status === "loading" ? "text-amber-500 animate-pulse" :
              "text-muted-foreground"
            }`} />
          </div>
          {status === "loading" && <p className="text-[11px] text-amber-600">جاري قراءة الرابط...</p>}
          {status === "ok" && parsed && (
            <p className="text-[11px] text-emerald-600 font-medium">
              ✓ {parsed.lat.toFixed(4)}, {parsed.lng.toFixed(4)}
            </p>
          )}
          {status === "error" && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-2 text-[11px] text-red-700 space-y-0.5">
              <p className="font-bold">تعذّر قراءة الرابط المختصر</p>
              <p>من الجوال: اضغط مطوّلاً على الموقع في خرائط جوجل ← انسخ الأرقام من الأسفل ← الصقها هنا مباشرة (مثل <span dir="ltr">34.60, 43.67</span>)</p>
            </div>
          )}
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={!parsed}
              className="flex-1 h-8 bg-emerald-500 text-white rounded-lg text-xs font-bold disabled:opacity-40"
            >
              حفظ الموقع
            </button>
            <button
              onClick={() => { setOpen(false); setUrl(""); setParsed(null); setStatus("idle"); }}
              className="flex-1 h-8 bg-muted rounded-lg text-xs font-semibold"
            >
              إلغاء
            </button>
          </div>
        </div>
      )}
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
  const [addError, setAddError] = useState<string | null>(null);

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

  const saveLocation = async (id: number, lat: number | null, lng: number | null) => {
    if (!token) return;
    const updated = await adminFetch(token, `/api/admin/restaurants/${id}`, {
      method: "PUT", body: JSON.stringify({ lat, lng }),
    });
    setRestaurants((prev) => prev.map((r) => r.id === id ? { ...r, ...updated } : r));
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
    setAddError(null);
    try {
      await adminFetch(token, "/api/admin/restaurants", {
        method: "POST",
        body: JSON.stringify({
          ...newRest,
          deliveryMinutes: Number(newRest.deliveryMinutes),
          minOrder: Number(newRest.minOrder),
          maxDeliveryFee: newRest.maxDeliveryFee ? Number(newRest.maxDeliveryFee) : null,
          deliveryFee: Number(newRest.deliveryFee),
          discountPercent: Number(newRest.discountPercent),
          pricePerKm: Number(newRest.pricePerKm) || 500,
          lat: newRest.lat ? Number(newRest.lat) : null,
          lng: newRest.lng ? Number(newRest.lng) : null,
        }),
      });
      const fresh = await adminFetch(token, "/api/admin/restaurants");
      setRestaurants(fresh);
      setNewRest(EMPTY_REST);
      setShowAdd(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "تعذر حفظ المطعم";
      setAddError(msg);
    } finally { setSaving(false); }
  };

  const renderEditableCell = (r: Restaurant, field: keyof Restaurant, label: string, type = "text") => {
    const isEditing = editing?.id === r.id && editing?.field === field;
    const val = String(r[field] ?? "");
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
            {val || <span className="text-muted-foreground text-xs">—</span>}
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

        <button
          onClick={() => setShowAdd(!showAdd)}
          className="w-full h-11 border-2 border-dashed border-primary/40 text-primary rounded-2xl flex items-center justify-center gap-2 text-sm font-bold hover:border-primary hover:bg-primary/5 transition-all"
        >
          <Plus className="h-4 w-4" /> إضافة مطعم جديد
        </button>

        {showAdd && (
          <div className="bg-white rounded-2xl border border-border shadow-xs p-4 space-y-3">
            <h2 className="font-bold text-sm">مطعم جديد</h2>
            <Field label="اسم المطعم *" value={newRest.nameAr} onChange={(v) => setNewRest((p) => ({ ...p, nameAr: v }))} />
            <Field label="التصنيف (مثال: برغر، بيتزا)" value={newRest.categoryAr} onChange={(v) => setNewRest((p) => ({ ...p, categoryAr: v }))} />
            <Field label="وقت التوصيل (مثال: 20-35 د)" value={newRest.deliveryTime} onChange={(v) => setNewRest((p) => ({ ...p, deliveryTime: v }))} />
            <div className="grid grid-cols-2 gap-3">
              <Field label="وقت التوصيل (دقيقة)" value={newRest.deliveryMinutes} onChange={(v) => setNewRest((p) => ({ ...p, deliveryMinutes: v }))} type="number" />
              <Field label="الخصم %" value={newRest.discountPercent} onChange={(v) => setNewRest((p) => ({ ...p, discountPercent: v }))} type="number" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="حد أدنى للطلب (د.ع)" value={newRest.minOrder} onChange={(v) => setNewRest((p) => ({ ...p, minOrder: v }))} type="number" />
              <Field label="حد التوصيل الأقصى (د.ع) — اختياري" value={newRest.maxDeliveryFee} onChange={(v) => setNewRest((p) => ({ ...p, maxDeliveryFee: v }))} type="number" placeholder="بلا حد" />
            </div>
            <Field label="كلفة التوصيل الحد الأدنى (د.ع)" value={newRest.deliveryFee} onChange={(v) => setNewRest((p) => ({ ...p, deliveryFee: v }))} type="number" />
            <Field
              label="سعر الكيلومتر (د.ع/كم) — 0 يعني سعر توصيل ثابت"
              value={newRest.pricePerKm}
              onChange={(v) => setNewRest((p) => ({ ...p, pricePerKm: v }))}
              type="number"
              placeholder="مثال: 300"
            />
            <MapsUrlField
              lat={newRest.lat}
              lng={newRest.lng}
              onParsed={(lat, lng) => setNewRest((p) => ({ ...p, lat, lng }))}
            />
            <Field label="واتساب" value={newRest.whatsapp} onChange={(v) => setNewRest((p) => ({ ...p, whatsapp: v }))} />
            <ImageUpload label="صورة المطعم" value={newRest.imageUrl} onChange={(v) => setNewRest((p) => ({ ...p, imageUrl: v }))} />
            {addError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs font-semibold px-3 py-2 rounded-lg">
                ⚠️ {addError}
              </div>
            )}
            <div className="flex gap-2 pt-1">
              <button type="button" onClick={addRestaurant} disabled={saving || !newRest.nameAr}
                className="flex-1 h-10 bg-primary text-white rounded-xl text-sm font-bold disabled:opacity-60">
                {saving ? "جاري الحفظ..." : "إضافة المطعم"}
              </button>
              <button type="button" onClick={() => { setShowAdd(false); setNewRest(EMPTY_REST); }}
                className="flex-1 h-10 bg-muted rounded-xl text-sm font-semibold">إلغاء</button>
            </div>
          </div>
        )}

        {loading
          ? Array(3).fill(0).map((_, i) => <div key={i} className="bg-white rounded-2xl h-48 border border-border animate-pulse" />)
          : restaurants.map((r) => (
            <div key={r.id} className="bg-white rounded-2xl border border-border shadow-xs overflow-hidden">
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

              <div className="px-4 py-2">
                {renderEditableCell(r, "nameAr", "اسم المطعم")}
                {renderEditableCell(r, "categoryAr", "التصنيف")}
                {renderEditableCell(r, "discountPercent", "الخصم %", "number")}
                {renderEditableCell(r, "minOrder", "حد أدنى للطلب (د.ع)", "number")}
                {renderEditableCell(r, "maxDeliveryFee", "حد التوصيل الأقصى (د.ع)", "number")}
                {renderEditableCell(r, "deliveryFee", "كلفة توصيل الحد الأدنى (د.ع)", "number")}
                {renderEditableCell(r, "pricePerKm", "سعر الكيلومتر (د.ع/كم)", "number")}
                {renderEditableCell(r, "deliveryTime", "وقت التوصيل")}
                {renderEditableCell(r, "whatsapp", "واتساب", "tel")}

                <MapsUrlEditField
                  restaurantId={r.id}
                  lat={r.lat}
                  lng={r.lng}
                  onSaved={(lat, lng) => saveLocation(r.id, lat, lng)}
                />

                <div className="py-3 border-b border-border">
                  <ImageUpload
                    label="صورة المطعم"
                    value={r.imageUrl}
                    onChange={(v) => save(r.id, "imageUrl", v)}
                  />
                </div>

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
