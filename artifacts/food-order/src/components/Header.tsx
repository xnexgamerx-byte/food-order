import { Link } from "wouter";
import { Headphones } from "lucide-react";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b border-border shadow-xs">
      <div className="px-4 h-12 flex items-center justify-between">

        {/* Customer Support */}
        <a
          href="tel:+9647000000000"
          data-testid="button-support"
          className="flex items-center gap-1.5 text-primary hover:opacity-80 transition-opacity"
        >
          <div className="w-7 h-7 bg-primary/10 rounded-full flex items-center justify-center">
            <Headphones className="h-3.5 w-3.5 text-primary" />
          </div>
          <span className="text-xs font-semibold text-primary hidden sm:block">خدمة العملاء</span>
        </a>

        {/* Logo Center */}
        <Link href="/" className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <span className="text-lg font-black text-primary tracking-tight">منصة الطلب</span>
        </Link>

        {/* Location Right */}
        <div className="flex flex-col items-end">
          <span className="text-xs font-bold text-foreground leading-none">مرحباً بك</span>
          <span className="text-xs text-muted-foreground leading-none mt-0.5">📍 صلاح الدين</span>
        </div>
      </div>
    </header>
  );
}
