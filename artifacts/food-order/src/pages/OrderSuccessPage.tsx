import { useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { CheckCircle2, MessageCircle, Home, Receipt } from "lucide-react";

export default function OrderSuccessPage() {
  const [, setLocation] = useLocation();
  const openedRef = useRef(false);

  const search = typeof window !== "undefined" ? window.location.search : "";
  const params = new URLSearchParams(search);
  const whatsappUrl = params.get("whatsapp") || "";
  const orderNum = params.get("orderNum") || "";
  const restaurantName = params.get("restaurantName") || "";
  const total = params.get("total") || "0";

  // Auto-open WhatsApp once after order is created so the message is sent
  // immediately to the restaurant's WhatsApp number.
  useEffect(() => {
    if (!whatsappUrl || openedRef.current) return;
    openedRef.current = true;
    const t = setTimeout(() => {
      window.open(whatsappUrl, "_blank", "noopener,noreferrer");
    }, 800);
    return () => clearTimeout(t);
  }, [whatsappUrl]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-5">

        {/* Success */}
        <div className="flex flex-col items-center text-center gap-3">
          <div className="w-20 h-20 bg-emerald-100 rounded-3xl flex items-center justify-center">
            <CheckCircle2 className="h-11 w-11 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-xl font-black text-foreground">تم استلام طلبك</h1>
            <p className="text-muted-foreground text-sm mt-1">
              سيُفتح واتساب المطعم تلقائياً لإرسال الطلب
            </p>
          </div>
        </div>

        {/* Order Card */}
        <div className="bg-white rounded-2xl border border-border shadow-xs overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-primary/5">
            <Receipt className="h-4 w-4 text-primary" />
            <span className="text-sm font-bold text-primary">تفاصيل الطلب</span>
          </div>
          <div className="px-4 py-3 space-y-2.5 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">رقم الطلب</span>
              <span className="font-black text-primary text-base">{orderNum}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">المطعم</span>
              <span className="font-semibold text-right max-w-[180px]">{restaurantName}</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-border">
              <span className="font-bold">الإجمالي</span>
              <span className="font-black text-primary text-base">{Number(total).toLocaleString()} د.ع</span>
            </div>
          </div>
        </div>

        {/* WhatsApp CTA */}
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          data-testid="button-whatsapp"
        >
          <button className="w-full h-13 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl flex items-center justify-center gap-3 text-base font-bold py-3.5 shadow-md transition-all active:scale-98">
            <MessageCircle className="h-5 w-5" />
            فتح واتساب يدوياً
          </button>
        </a>

        <p className="text-center text-xs text-muted-foreground leading-relaxed">
          إذا لم يفتح واتساب تلقائياً، اضغط الزر أعلاه
        </p>

        <button
          onClick={() => setLocation("/")}
          data-testid="button-home"
          className="w-full flex items-center justify-center gap-2 py-3 text-muted-foreground hover:text-foreground transition-colors text-sm font-medium"
        >
          <Home className="h-4 w-4" />
          العودة للرئيسية
        </button>
      </div>
    </div>
  );
}
