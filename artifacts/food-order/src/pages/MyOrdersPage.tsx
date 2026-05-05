import { useState } from "react";
import { useLocation } from "wouter";
import { ArrowRight, Package, MessageCircle, Phone, ShoppingBag, Clock, CheckCircle2, XCircle, Star } from "lucide-react";
import { useGetOrdersByPhone, useGetReviewByOrder } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { getCustomer, saveCustomer } from "@/lib/customer";
import { RatingModal } from "@/components/RatingModal";

interface OrderItem {
  menuItemId: number;
  quantity: number;
  price: number;
  name: string;
  nameAr: string;
}

const STATUS_LABEL: Record<string, { ar: string; color: string; icon: typeof Clock }> = {
  pending: { ar: "قيد المراجعة", color: "bg-amber-100 text-amber-700", icon: Clock },
  confirmed: { ar: "تم التأكيد", color: "bg-blue-100 text-blue-700", icon: CheckCircle2 },
  delivered: { ar: "تم التوصيل", color: "bg-emerald-100 text-emerald-700", icon: CheckCircle2 },
  cancelled: { ar: "ملغي", color: "bg-rose-100 text-rose-700", icon: XCircle },
};

export default function MyOrdersPage() {
  const [, setLocation] = useLocation();
  const stored = getCustomer();
  const [phone, setPhone] = useState(stored.phone);
  const [activePhone, setActivePhone] = useState(stored.phone);

  const { data: orders = [], isLoading, isError } = useGetOrdersByPhone(activePhone, {
    query: {
      queryKey: ["orders-by-phone", activePhone],
      enabled: !!activePhone,
      refetchOnWindowFocus: true,
    },
  });

  const handleLookup = () => {
    const trimmed = phone.trim();
    if (!trimmed) return;
    saveCustomer({ phone: trimmed });
    setActivePhone(trimmed);
  };

  if (!activePhone) {
    return (
      <div className="min-h-screen bg-background">
        <div className="flex items-center gap-3 px-4 py-3 bg-white border-b sticky top-12 z-20">
          <button onClick={() => setLocation("/")} data-testid="button-back" className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center">
            <ArrowRight className="h-5 w-5" />
          </button>
          <h1 className="font-bold text-base">طلباتي</h1>
        </div>

        <div className="px-4 py-10 max-w-md mx-auto">
          <div className="flex flex-col items-center text-center gap-3 mb-6">
            <div className="w-16 h-16 bg-primary/10 rounded-3xl flex items-center justify-center">
              <Package className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-lg font-black">تتبع طلباتك</h2>
            <p className="text-sm text-muted-foreground">أدخل رقم هاتفك لعرض جميع طلباتك السابقة والحالية</p>
          </div>

          <div className="bg-white rounded-2xl border border-border shadow-xs p-4 space-y-3">
            <label className="block">
              <span className="block text-sm font-semibold mb-1.5">رقم الهاتف</span>
              <div className="relative">
                <Phone className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="tel"
                  inputMode="tel"
                  dir="ltr"
                  placeholder="07XXXXXXXXX"
                  className="w-full h-11 pr-10 pl-4 bg-muted/40 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleLookup();
                  }}
                  data-testid="input-phone"
                />
              </div>
            </label>
            <Button onClick={handleLookup} className="w-full h-11 rounded-xl" data-testid="button-lookup">
              عرض طلباتي
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const pending = orders.filter((o) => o.status === "pending" || o.status === "confirmed");
  const past = orders.filter((o) => o.status !== "pending" && o.status !== "confirmed");

  return (
    <div className="min-h-screen bg-background pb-10">
      <div className="flex items-center gap-3 px-4 py-3 bg-white border-b sticky top-12 z-20">
        <button onClick={() => setLocation("/")} data-testid="button-back" className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center">
          <ArrowRight className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <h1 className="font-bold text-base leading-none">طلباتي</h1>
          <p className="text-xs text-muted-foreground mt-0.5" dir="ltr">{activePhone}</p>
        </div>
        <button
          onClick={() => { saveCustomer({ phone: "" }); setActivePhone(""); setPhone(""); }}
          className="text-xs text-primary font-semibold"
          data-testid="button-change-phone"
        >
          تغيير الرقم
        </button>
      </div>

      <div className="px-4 mt-4 space-y-5 max-w-2xl mx-auto">
        {isLoading && (
          <div className="text-center py-10 text-muted-foreground text-sm">جاري التحميل...</div>
        )}

        {isError && (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-sm text-rose-700">
            تعذر تحميل الطلبات. حاول لاحقاً.
          </div>
        )}

        {!isLoading && !isError && orders.length === 0 && (
          <div className="flex flex-col items-center text-center gap-3 py-14">
            <div className="w-20 h-20 bg-muted rounded-3xl flex items-center justify-center text-4xl">📦</div>
            <p className="text-base font-bold">لا توجد طلبات بعد</p>
            <p className="text-sm text-muted-foreground">لم نجد أي طلبات مرتبطة بهذا الرقم</p>
            <Button onClick={() => setLocation("/")} className="mt-1 rounded-xl px-8">تصفح المطاعم</Button>
          </div>
        )}

        {pending.length > 0 && (
          <section>
            <h2 className="text-sm font-black mb-2 text-foreground flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-600" />
              طلبات حالية ({pending.length})
            </h2>
            <div className="space-y-3">
              {pending.map((o) => <OrderCard key={o.id} order={o} customerPhone={activePhone} />)}
            </div>
          </section>
        )}

        {past.length > 0 && (
          <section>
            <h2 className="text-sm font-black mb-2 text-foreground flex items-center gap-2">
              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
              طلبات سابقة ({past.length})
            </h2>
            <div className="space-y-3">
              {past.map((o) => <OrderCard key={o.id} order={o} customerPhone={activePhone} />)}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function OrderCard({ order, customerPhone }: { order: any; customerPhone: string }) {
  const status = STATUS_LABEL[order.status] || STATUS_LABEL.pending!;
  const StatusIcon = status.icon;
  const items: OrderItem[] = Array.isArray(order.items) ? order.items : [];
  const created = order.createdAt ? new Date(order.createdAt) : null;
  const isDelivered = order.status === "delivered";
  const [showRating, setShowRating] = useState(false);

  const { data: review, refetch: refetchReview } = useGetReviewByOrder(order.id, {
    query: {
      queryKey: ["review-by-order", order.id],
      enabled: isDelivered,
      refetchOnWindowFocus: false,
    },
  });

  return (
    <div className="bg-white rounded-2xl border border-border shadow-xs overflow-hidden" data-testid={`order-card-${order.id}`}>
      <div className="px-4 py-3 border-b border-border flex items-center justify-between bg-primary/5">
        <div className="flex items-center gap-2">
          <span className="font-black text-primary text-sm">{order.orderNumber}</span>
          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${status.color}`}>
            <StatusIcon className="h-3 w-3" />
            {status.ar}
          </span>
        </div>
        {created && (
          <span className="text-[11px] text-muted-foreground">
            {created.toLocaleString("ar-IQ", { dateStyle: "short", timeStyle: "short" })}
          </span>
        )}
      </div>

      <div className="px-4 py-3 space-y-2 text-sm">
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground text-xs">المطعم</span>
          <span className="font-semibold">{order.restaurantName}</span>
        </div>

        {items.length > 0 && (
          <ul className="space-y-1 text-xs text-muted-foreground border-t border-border pt-2">
            {items.map((it) => (
              <li key={it.menuItemId} className="flex justify-between">
                <span>{it.nameAr} × {it.quantity}</span>
                <span>{(it.price * it.quantity).toLocaleString()} د.ع</span>
              </li>
            ))}
          </ul>
        )}

        <div className="flex justify-between items-center pt-2 border-t border-border">
          <span className="font-bold text-xs">الإجمالي</span>
          <span className="font-black text-primary">{Number(order.total).toLocaleString()} د.ع</span>
        </div>

        {order.status === "pending" && order.whatsappUrl && (
          <a
            href={order.whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full mt-2 h-10 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold"
            data-testid={`button-resend-${order.id}`}
          >
            <MessageCircle className="h-4 w-4" />
            إعادة إرسال للواتساب
          </a>
        )}

        {isDelivered && review && (
          <div className="mt-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold text-amber-800">تقييمك</span>
              <div className="flex gap-0.5" dir="ltr">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star
                    key={n}
                    className={`h-3.5 w-3.5 ${n <= review.rating ? "fill-amber-500 text-amber-500" : "text-muted-foreground/30"}`}
                  />
                ))}
              </div>
            </div>
            {review.message && (
              <p className="text-xs text-amber-900/80 leading-relaxed mt-1">{review.message}</p>
            )}
          </div>
        )}

        {isDelivered && !review && (
          <button
            onClick={() => setShowRating(true)}
            className="mt-2 w-full flex items-center justify-center gap-2 h-10 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold"
            data-testid={`button-rate-${order.id}`}
          >
            <Star className="h-4 w-4 fill-white" />
            قيّم تجربتك
          </button>
        )}
      </div>

      {showRating && (
        <RatingModal
          orderId={order.id}
          customerPhone={customerPhone}
          restaurantName={order.restaurantName}
          onClose={() => setShowRating(false)}
          onSubmitted={() => { setShowRating(false); refetchReview(); }}
        />
      )}
    </div>
  );
}
