import { useState } from "react";
import { Star, X, Loader2 } from "lucide-react";
import { useCreateReview } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

interface RatingModalProps {
  orderId: number;
  customerPhone: string;
  restaurantName: string;
  onClose: () => void;
  onSubmitted: () => void;
}

export function RatingModal({ orderId, customerPhone, restaurantName, onClose, onSubmitted }: RatingModalProps) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const qc = useQueryClient();

  const { mutateAsync, isPending } = useCreateReview();

  const requireMessage = rating > 0 && rating < 3;
  const canSubmit = rating >= 1 && (!requireMessage || message.trim().length >= 3);

  const submit = async () => {
    setError(null);
    if (!canSubmit) {
      if (rating === 0) setError("اختر عدد النجوم");
      else if (requireMessage) setError("يرجى كتابة سبب التقييم المنخفض");
      return;
    }
    try {
      await mutateAsync({
        data: { orderId, customerPhone, rating, message: message.trim() },
      });
      await qc.invalidateQueries({ queryKey: ["orders-by-phone", customerPhone] });
      onSubmitted();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } }; message?: string };
      setError(e?.response?.data?.error || e?.message || "تعذر إرسال التقييم");
    }
  };

  const labels = ["", "سيئ جداً", "سيئ", "مقبول", "جيد", "ممتاز"];
  const colors = ["", "text-rose-500", "text-orange-500", "text-amber-500", "text-lime-600", "text-emerald-600"];
  const display = hover || rating;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center" onClick={onClose}>
      <div
        className="bg-white w-full sm:max-w-md sm:rounded-3xl rounded-t-3xl shadow-2xl p-5 space-y-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        data-testid="rating-modal"
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-black text-base">قيّم تجربتك</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{restaurantName}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center"
            data-testid="button-close-rating"
            aria-label="إغلاق"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Stars */}
        <div className="bg-muted/30 rounded-2xl p-4 flex flex-col items-center gap-3">
          <div className="flex gap-1.5" dir="ltr">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setRating(n)}
                onMouseEnter={() => setHover(n)}
                onMouseLeave={() => setHover(0)}
                className="transition-transform hover:scale-110 active:scale-95"
                data-testid={`star-${n}`}
                aria-label={`${n} نجوم`}
              >
                <Star
                  className={`h-9 w-9 transition-colors ${
                    n <= display ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40"
                  }`}
                />
              </button>
            ))}
          </div>
          {display > 0 && (
            <p className={`text-sm font-bold ${colors[display]}`}>{labels[display]}</p>
          )}
        </div>

        {/* Message field */}
        <div>
          <label className="text-xs font-semibold text-muted-foreground mb-1.5 flex items-center justify-between">
            <span>
              {requireMessage ? (
                <>سبب التقييم <span className="text-rose-500">*</span></>
              ) : (
                <>رسالة (اختيارية)</>
              )}
            </span>
            {requireMessage && (
              <span className="text-[10px] text-rose-500 font-bold">مطلوب للتقييمات الأقل من 3 نجوم</span>
            )}
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={requireMessage ? "أخبرنا ما الذي لم يعجبك حتى نتحسّن..." : "شاركنا رأيك..."}
            rows={3}
            className={`w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none ${
              requireMessage ? "border-rose-300 bg-rose-50/30" : "border-border"
            }`}
            data-testid="textarea-message"
          />
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold px-3 py-2 rounded-lg">
            ⚠️ {error}
          </div>
        )}

        <div className="flex gap-2 pt-1">
          <button
            onClick={submit}
            disabled={isPending || !canSubmit}
            className="flex-1 h-11 bg-primary text-white rounded-xl text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-2"
            data-testid="button-submit-rating"
          >
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {isPending ? "جاري الإرسال..." : "إرسال التقييم"}
          </button>
          <button
            onClick={onClose}
            className="flex-1 h-11 bg-muted rounded-xl text-sm font-semibold"
          >
            لاحقاً
          </button>
        </div>
      </div>
    </div>
  );
}
