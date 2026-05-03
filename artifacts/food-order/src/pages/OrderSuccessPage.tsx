import { useLocation } from "wouter";
import { CheckCircle2, MessageCircle, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function OrderSuccessPage() {
  const [location, setLocation] = useLocation();

  // Parse query params from URL
  const search = typeof window !== "undefined" ? window.location.search : "";
  const params = new URLSearchParams(search);
  const whatsappUrl = params.get("whatsapp") || "";
  const orderNum = params.get("orderNum") || "";
  const restaurantName = params.get("restaurantName") || "";
  const total = params.get("total") || "0";

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm space-y-6">
        {/* Success Icon */}
        <div className="flex flex-col items-center text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle2 className="h-12 w-12 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">تم استلام طلبك</h1>
          <p className="text-muted-foreground mt-2 text-sm">
            سيصل طلبك مباشرة للمطعم عبر واتساب
          </p>
        </div>

        {/* Order Info Card */}
        <div className="bg-white rounded-2xl border border-border shadow-sm p-4 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground text-sm">رقم الطلب</span>
            <span className="font-bold text-primary text-lg">{orderNum}</span>
          </div>
          <div className="flex justify-between items-center border-t pt-3">
            <span className="text-muted-foreground text-sm">المطعم</span>
            <span className="font-semibold text-sm text-right max-w-[180px]">{restaurantName}</span>
          </div>
          <div className="flex justify-between items-center border-t pt-3">
            <span className="text-muted-foreground text-sm">إجمالي الطلب</span>
            <span className="font-bold text-primary">{Number(total).toLocaleString()} د.ع</span>
          </div>
        </div>

        {/* WhatsApp Button */}
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          data-testid="button-whatsapp"
          className="block"
        >
          <Button className="w-full h-13 bg-green-600 hover:bg-green-700 text-white rounded-xl flex items-center justify-center gap-3 text-base font-bold py-3.5">
            <MessageCircle className="h-6 w-6" />
            فتح واتساب لإرسال الطلب
          </Button>
        </a>

        <p className="text-center text-xs text-muted-foreground">
          سيفتح واتساب مع تفاصيل طلبك جاهزة للإرسال للمطعم
        </p>

        {/* Back Home */}
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
