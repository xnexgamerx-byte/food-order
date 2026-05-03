import { Link } from "wouter";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-xs font-semibold text-primary">مرحباً بك 👋</span>
          <span className="text-sm text-muted-foreground flex items-center gap-1">
            📍 صلاح الدين، العراق
          </span>
        </div>
        
        <Link href="/" className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <span className="text-xl font-bold text-primary tracking-tight">منصة الطلب</span>
        </Link>
        
        <div>
          <Button variant="ghost" size="icon" asChild className="text-green-600 hover:text-green-700 hover:bg-green-50">
            <a href="https://wa.me/9647000000000" target="_blank" rel="noopener noreferrer">
              <MessageCircle className="h-6 w-6" />
            </a>
          </Button>
        </div>
      </div>
    </header>
  );
}
