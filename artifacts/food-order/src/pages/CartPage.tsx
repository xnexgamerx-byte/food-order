import { useState } from "react";
import { useLocation } from "wouter";
import { ArrowRight, Trash2, Minus, Plus, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateOrder } from "@workspace/api-client-react";
import { useCart } from "@/lib/cart-context";
import { useToast } from "@/hooks/use-toast";

const NEIGHBORHOODS = [
  "تكريت", "بيجي", "الدور", "سامراء", "الشرقاط", "بلد", "الضلوعية",
  "العلم", "الدجيل", "المكيشيفة", "طوزخرماتو", "السطة", "العوجة"
];

export default function CartPage() {
  const [, setLocation] = useLocation();
  const { items, restaurantId, restaurantName, updateQuantity, removeItem, clearCart, subtotal, totalItems } = useCart();
  const { toast } = useToast();
  const createOrder = useCreateOrder();

  const [form, setForm] = useState({ name: "", phone: "", address: "", neighborhood: "", notes: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "مطلوب";
    if (!form.phone.trim()) e.phone = "مطلوب";
    if (!form.address.trim()) e.address = "مطلوب";
    if (!form.neighborhood) e.neighborhood = "اختر الحي";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleOrder = () => {
    if (!validate()) return;
    if (!restaurantId) return;

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
          total: subtotal,
        },
      },
      {
        onSuccess: (order) => {
          clearCart();
          setLocation(`/order-success/${order.id}?whatsapp=${encodeURIComponent(order.whatsappUrl)}&orderNum=${order.orderNumber}&restaurantName=${encodeURIComponent(order.restaurantName)}&total=${order.total}`);
        },
        onError: () => {
          toast({ title: "حدث خطأ", description: "تعذر إتمام الطلب، يرجى المحاولة مجدداً", variant: "destructive" });
        },
      }
    );
  };

  if (totalItems === 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="flex items-center gap-3 px-4 py-3 bg-white border-b">
          <button onClick={() => setLocation("/")} data-testid="button-back" className="p-2 rounded-full hover:bg-muted">
            <ArrowRight className="h-5 w-5" />
          </button>
          <h1 className="font-bold text-lg">السلة</h1>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <p className="text-6xl">🛒</p>
          <p className="text-lg font-bold text-foreground">السلة فارغة</p>
          <p className="text-muted-foreground text-sm">أضف أصناف من المطاعم</p>
          <Button onClick={() => setLocation("/")} className="mt-2">تصفح المطاعم</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-32">
      <div className="flex items-center gap-3 px-4 py-3 bg-white border-b sticky top-0 z-30">
        <button onClick={() => setLocation("/")} data-testid="button-back" className="p-2 rounded-full hover:bg-muted">
          <ArrowRight className="h-5 w-5" />
        </button>
        <h1 className="font-bold text-lg flex-1">السلة</h1>
        <span className="text-sm text-muted-foreground">{restaurantName}</span>
      </div>

      <div className="px-4 mt-4 space-y-4">
        {/* Cart Items */}
        <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
          {items.map((item, idx) => (
            <div key={item.menuItemId} className={`flex items-center gap-3 p-3 ${idx < items.length - 1 ? "border-b border-border" : ""}`}>
              <img src={item.imageUrl} alt={item.nameAr} className="w-14 h-14 rounded-lg object-cover flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">{item.nameAr}</p>
                <p className="text-primary font-bold text-sm mt-0.5">{(item.price * item.quantity).toLocaleString()} د.ع</p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => updateQuantity(item.menuItemId, item.quantity - 1)}
                  data-testid={`button-minus-${item.menuItemId}`}
                  className="w-7 h-7 bg-muted rounded-md flex items-center justify-center text-foreground"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <span className="font-bold text-sm w-5 text-center">{item.quantity}</span>
                <button
                  onClick={() => updateQuantity(item.menuItemId, item.quantity + 1)}
                  data-testid={`button-plus-${item.menuItemId}`}
                  className="w-7 h-7 bg-primary text-white rounded-md flex items-center justify-center"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => removeItem(item.menuItemId)}
                  data-testid={`button-remove-${item.menuItemId}`}
                  className="w-7 h-7 rounded-md flex items-center justify-center text-destructive hover:bg-destructive/10 mr-1"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
          <div className="px-3 py-2 bg-muted/50 flex justify-between items-center">
            <span className="text-sm font-semibold text-muted-foreground">المجموع</span>
            <span className="font-bold text-primary">{subtotal.toLocaleString()} د.ع</span>
          </div>
        </div>

        {/* Customer Info */}
        <div className="bg-white rounded-xl border border-border shadow-sm p-4">
          <h2 className="font-bold text-base mb-3">بيانات العميل</h2>
          <div className="space-y-3">
            <div>
              <Label htmlFor="name" className="text-sm font-medium mb-1 block">الاسم الكامل *</Label>
              <Input
                id="name"
                data-testid="input-name"
                placeholder="أدخل اسمك"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className={errors.name ? "border-destructive" : ""}
              />
              {errors.name && <p className="text-destructive text-xs mt-1">{errors.name}</p>}
            </div>
            <div>
              <Label htmlFor="phone" className="text-sm font-medium mb-1 block">رقم الهاتف *</Label>
              <Input
                id="phone"
                data-testid="input-phone"
                placeholder="07XXXXXXXXX"
                type="tel"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                className={errors.phone ? "border-destructive" : ""}
              />
              {errors.phone && <p className="text-destructive text-xs mt-1">{errors.phone}</p>}
            </div>
          </div>
        </div>

        {/* Delivery Location */}
        <div className="bg-white rounded-xl border border-border shadow-sm p-4">
          <div className="flex items-center gap-2 mb-3">
            <MapPin className="h-4 w-4 text-primary" />
            <h2 className="font-bold text-base">عنوان التوصيل</h2>
          </div>
          <div className="space-y-3">
            <div>
              <Label className="text-sm font-medium mb-1 block">الحي / المنطقة *</Label>
              <Select value={form.neighborhood} onValueChange={(v) => setForm((f) => ({ ...f, neighborhood: v }))}>
                <SelectTrigger data-testid="select-neighborhood" className={errors.neighborhood ? "border-destructive" : ""}>
                  <SelectValue placeholder="اختر الحي أو المنطقة" />
                </SelectTrigger>
                <SelectContent>
                  {NEIGHBORHOODS.map((n) => (
                    <SelectItem key={n} value={n}>{n}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.neighborhood && <p className="text-destructive text-xs mt-1">{errors.neighborhood}</p>}
            </div>
            <div>
              <Label htmlFor="address" className="text-sm font-medium mb-1 block">العنوان التفصيلي *</Label>
              <Input
                id="address"
                data-testid="input-address"
                placeholder="الشارع، رقم المنزل، معلم قريب..."
                value={form.address}
                onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                className={errors.address ? "border-destructive" : ""}
              />
              {errors.address && <p className="text-destructive text-xs mt-1">{errors.address}</p>}
            </div>
            <div>
              <Label htmlFor="notes" className="text-sm font-medium mb-1 block">ملاحظات (اختياري)</Label>
              <Textarea
                id="notes"
                data-testid="input-notes"
                placeholder="أي ملاحظات خاصة للمطعم..."
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                rows={2}
                className="resize-none"
              />
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="bg-white rounded-xl border border-border shadow-sm p-4">
          <h2 className="font-bold text-base mb-3">ملخص الطلب</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">المطعم</span>
              <span className="font-medium">{restaurantName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">عدد الأصناف</span>
              <span className="font-medium">{totalItems} صنف</span>
            </div>
            <div className="flex justify-between border-t pt-2 mt-2">
              <span className="font-bold">الإجمالي</span>
              <span className="font-bold text-primary text-base">{subtotal.toLocaleString()} د.ع</span>
            </div>
          </div>
        </div>
      </div>

      {/* Confirm Button */}
      <div className="fixed bottom-0 right-0 left-0 p-4 bg-white border-t z-50">
        <Button
          onClick={handleOrder}
          disabled={createOrder.isPending}
          data-testid="button-confirm-order"
          className="w-full h-12 text-base font-bold bg-green-600 hover:bg-green-700 text-white rounded-xl"
        >
          {createOrder.isPending ? "جاري إرسال الطلب..." : `تأكيد الطلب — ${subtotal.toLocaleString()} د.ع`}
        </Button>
      </div>
    </div>
  );
}
