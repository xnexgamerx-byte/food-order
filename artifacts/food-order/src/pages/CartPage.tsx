import { useState } from "react";
import { useLocation } from "wouter";
import { ArrowRight, Trash2, Minus, Plus, MapPin, User, Phone, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateOrder } from "@workspace/api-client-react";
import { useCart } from "@/lib/cart-context";
import { useToast } from "@/hooks/use-toast";

const NEIGHBORHOODS = [
  "تكريت", "بيجي", "الدور", "سامراء", "الشرقاط", "بلد", "الضلوعية",
  "العلم", "الدجيل", "المكيشيفة", "طوزخرماتو", "السطة", "العوجة",
];

export default function CartPage() {
  const [, setLocation] = useLocation();
  const { items, restaurantId, restaurantName, updateQuantity, removeItem, clearCart, subtotal, totalItems } = useCart();
  const { toast } = useToast();
  const createOrder = useCreateOrder();

  const SERVICE_FEE = 500;
  const total = subtotal + SERVICE_FEE;

  const [form, setForm] = useState({ name: "", phone: "", address: "", neighborhood: "", notes: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "الاسم مطلوب";
    if (!form.phone.trim()) e.phone = "رقم الهاتف مطلوب";
    if (!form.address.trim()) e.address = "العنوان مطلوب";
    if (!form.neighborhood) e.neighborhood = "اختر المنطقة";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleOrder = () => {
    if (!validate() || !restaurantId) return;
    createOrder.mutate(
      {
        data: {
          customerName: form.name,
          customerPhone: form.phone,
          restaurantId,
          items: items.map((i) => ({
            menuItemId: i.menuItemId,
            quantity: i.quantity,
            price: i.price,
            name: i.name,
            nameAr: i.nameAr,
          })),
          address: form.address,
          neighborhood: form.neighborhood,
          notes: form.notes,
          total: total,
        },
      },
      {
        onSuccess: (order) => {
          clearCart();
          setLocation(
            `/order-success/${order.id}?whatsapp=${encodeURIComponent(order.whatsappUrl)}&orderNum=${order.orderNumber}&restaurantName=${encodeURIComponent(order.restaurantName)}&total=${order.total}`
          );
        },
        onError: () => {
          toast({ title: "حدث خطأ", description: "تعذر إتمام الطلب، حاول مجدداً", variant: "destructive" });
        },
      }
    );
  };

  /* Field helper */
  const Field = ({
    label, id, icon: Icon, placeholder, type = "text", value, onChange, error,
  }: {
    label: string; id: string; icon: React.ElementType; placeholder: string;
    type?: string; value: string; onChange: (v: string) => void; error?: string;
  }) => (
    <div>
      <label htmlFor={id} className="text-xs font-semibold text-muted-foreground mb-1.5 block">{label}</label>
      <div className="relative">
        <Icon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          id={id}
          data-testid={`input-${id}`}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full h-11 pr-10 pl-4 bg-background rounded-xl border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all ${error ? "border-destructive" : "border-border"}`}
        />
      </div>
      {error && <p className="text-destructive text-xs mt-1">{error}</p>}
    </div>
  );

  if (totalItems === 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="flex items-center gap-3 px-4 py-3 bg-white border-b">
          <button onClick={() => setLocation("/")} data-testid="button-back" className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center">
            <ArrowRight className="h-5 w-5" />
          </button>
          <h1 className="font-bold text-base">السلة</h1>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <div className="w-20 h-20 bg-muted rounded-3xl flex items-center justify-center text-4xl">🛒</div>
          <p className="text-base font-bold">السلة فارغة</p>
          <p className="text-sm text-muted-foreground">أضف أصناف من المطاعم</p>
          <Button onClick={() => setLocation("/")} className="mt-1 rounded-xl px-8">تصفح المطاعم</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-32">

      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-white border-b sticky top-12 z-20">
        <button onClick={() => setLocation("/")} data-testid="button-back" className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center">
          <ArrowRight className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <h1 className="font-bold text-base leading-none">السلة</h1>
          <p className="text-xs text-muted-foreground mt-0.5">{restaurantName}</p>
        </div>
        <span className="text-xs font-semibold text-primary bg-primary/10 px-2.5 py-1 rounded-full">
          {totalItems} صنف
        </span>
      </div>

      <div className="px-4 mt-4 space-y-3">

        {/* Cart Items */}
        <div className="bg-white rounded-2xl border border-border shadow-xs overflow-hidden">
          {items.map((item, idx) => (
            <div
              key={item.menuItemId}
              className={`flex items-center gap-3 px-3 py-3 ${idx < items.length - 1 ? "border-b border-border" : ""}`}
            >
              <img src={item.imageUrl} alt={item.nameAr} className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm line-clamp-1">{item.nameAr}</p>
                <p className="text-primary font-black text-sm mt-0.5">
                  {(item.price * item.quantity).toLocaleString()} د.ع
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => updateQuantity(item.menuItemId, item.quantity - 1)}
                  data-testid={`button-minus-${item.menuItemId}`}
                  className="w-7 h-7 bg-muted rounded-lg flex items-center justify-center hover:bg-border transition-colors"
                >
                  <Minus className="h-3 w-3" />
                </button>
                <span className="font-bold text-sm w-5 text-center tabular-nums">{item.quantity}</span>
                <button
                  onClick={() => updateQuantity(item.menuItemId, item.quantity + 1)}
                  data-testid={`button-plus-${item.menuItemId}`}
                  className="w-7 h-7 bg-primary text-white rounded-lg flex items-center justify-center hover:bg-primary/90 transition-colors"
                >
                  <Plus className="h-3 w-3" />
                </button>
                <button
                  onClick={() => removeItem(item.menuItemId)}
                  data-testid={`button-remove-${item.menuItemId}`}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-destructive hover:bg-destructive/10 transition-colors mr-0.5"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}

          <div className="px-3 py-2.5 bg-primary/5 flex justify-between items-center border-t border-border">
            <span className="text-sm font-semibold text-muted-foreground">المجموع الفرعي</span>
            <span className="font-black text-primary">{subtotal.toLocaleString()} د.ع</span>
          </div>
        </div>

        {/* Customer Info */}
        <div className="bg-white rounded-2xl border border-border shadow-xs p-4">
          <h2 className="font-bold text-sm text-foreground mb-3 flex items-center gap-2">
            <span className="w-5 h-5 bg-primary/10 rounded-md flex items-center justify-center">
              <User className="h-3 w-3 text-primary" />
            </span>
            بيانات العميل
          </h2>
          <div className="space-y-3">
            <Field label="الاسم الكامل" id="name" icon={User} placeholder="أدخل اسمك الكامل"
              value={form.name} onChange={(v) => setForm((f) => ({ ...f, name: v }))} error={errors.name} />
            <Field label="رقم الهاتف" id="phone" icon={Phone} placeholder="07XXXXXXXXX" type="tel"
              value={form.phone} onChange={(v) => setForm((f) => ({ ...f, phone: v }))} error={errors.phone} />
          </div>
        </div>

        {/* Delivery Location */}
        <div className="bg-white rounded-2xl border border-border shadow-xs p-4">
          <h2 className="font-bold text-sm text-foreground mb-3 flex items-center gap-2">
            <span className="w-5 h-5 bg-primary/10 rounded-md flex items-center justify-center">
              <MapPin className="h-3 w-3 text-primary" />
            </span>
            عنوان التوصيل
          </h2>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">المنطقة / الحي</label>
              <Select value={form.neighborhood} onValueChange={(v) => setForm((f) => ({ ...f, neighborhood: v }))}>
                <SelectTrigger
                  data-testid="select-neighborhood"
                  className={`h-11 rounded-xl border text-sm ${errors.neighborhood ? "border-destructive" : "border-border"} focus:ring-2 focus:ring-primary/30`}
                >
                  <SelectValue placeholder="اختر المنطقة في صلاح الدين" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {NEIGHBORHOODS.map((n) => (
                    <SelectItem key={n} value={n} className="text-sm">{n}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.neighborhood && <p className="text-destructive text-xs mt-1">{errors.neighborhood}</p>}
            </div>
            <Field label="العنوان التفصيلي" id="address" icon={MapPin} placeholder="الشارع، رقم المنزل، معلم قريب..."
              value={form.address} onChange={(v) => setForm((f) => ({ ...f, address: v }))} error={errors.address} />
            <div>
              <label htmlFor="notes" className="text-xs font-semibold text-muted-foreground mb-1.5 block">ملاحظات (اختياري)</label>
              <div className="relative">
                <FileText className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                <textarea
                  id="notes"
                  data-testid="input-notes"
                  placeholder="أي ملاحظات خاصة للمطعم..."
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  rows={2}
                  className="w-full pr-10 pl-4 pt-2.5 pb-2.5 bg-background rounded-xl border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all resize-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="bg-white rounded-2xl border border-border shadow-xs p-4">
          <h2 className="font-bold text-sm text-foreground mb-3">ملخص الطلب</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">المطعم</span>
              <span className="font-semibold">{restaurantName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">عدد الأصناف</span>
              <span className="font-semibold">{totalItems} صنف</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">المجموع الفرعي</span>
              <span className="font-semibold">{subtotal.toLocaleString()} د.ع</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">رسوم الخدمة</span>
              <span className="font-semibold">{SERVICE_FEE.toLocaleString()} د.ع</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-border mt-1">
              <span className="font-bold">الإجمالي</span>
              <span className="font-black text-primary text-base">{total.toLocaleString()} د.ع</span>
            </div>
          </div>
        </div>
      </div>

      {/* Confirm Button */}
      <div className="fixed bottom-0 right-0 left-0 p-4 bg-white border-t z-50">
        <button
          onClick={handleOrder}
          disabled={createOrder.isPending}
          data-testid="button-confirm-order"
          className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white rounded-2xl font-bold text-base transition-all active:scale-98 shadow-md"
        >
          {createOrder.isPending ? "جاري إرسال الطلب..." : `تأكيد الطلب — ${total.toLocaleString()} د.ع`}
        </button>
      </div>
    </div>
  );
}
