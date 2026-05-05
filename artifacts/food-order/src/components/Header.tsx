import { Link } from "wouter";
import { Phone } from "lucide-react";
import { SUPPORT_PHONE } from "@/lib/contact";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b border-border shadow-xs">
      <div className="px-4 h-12 flex items-center justify-between">

        {/* Customer Support — phone icon only */}
        <a
          href={`tel:+${SUPPORT_PHONE}`}
          data-testid="button-support"
          aria-label="خدمة العملاء"
          className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-muted transition-colors"
        >
          <Phone className="h-5 w-5 text-primary" />
        </a>

        {/* Logo Center */}
        <Link href="/" className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <span className="text-lg font-black text-primary tracking-tight">طلبات اوفرلك</span>
        </Link>

        {/* Location — left side */}
        <div className="flex items-center gap-1 text-muted-foreground">
          <span className="text-xs">📍</span>
          <span className="text-xs font-semibold text-foreground">صلاح الدين</span>
        </div>
      </div>
    </header>
  );
}
