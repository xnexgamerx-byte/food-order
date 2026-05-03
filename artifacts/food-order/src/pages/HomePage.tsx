import { useState } from "react";
import { useLocation } from "wouter";
import { Search, Star, Clock, ShoppingBag, ChevronLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useListRestaurants, useListCategories, useGetFeatured } from "@workspace/api-client-react";
import { useCart } from "@/lib/cart-context";

const HERO_IMAGE = "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80";

export default function HomePage() {
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("الكل");
  const { totalItems, subtotal } = useCart();

  const { data: categories, isLoading: catsLoading } = useListCategories();
  const { data: restaurants, isLoading: restsLoading } = useListRestaurants(
    activeCategory !== "الكل" ? { category: activeCategory } : {},
    { query: { queryKey: ["restaurants", activeCategory] } }
  );

  const allCategories = [{ id: 0, nameAr: "الكل", name: "All", icon: "🍽️", imageUrl: "" }, ...(categories || [])];

  const filtered = (restaurants || []).filter((r) => {
    if (!search) return true;
    return r.nameAr.includes(search) || r.name.toLowerCase().includes(search.toLowerCase()) || r.categoryAr.includes(search);
  });

  return (
    <div className="min-h-screen bg-background pb-28">
      {/* Hero Banner */}
      <div className="relative h-36 overflow-hidden">
        <img src={HERO_IMAGE} alt="hero" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 to-black/20 flex flex-col justify-center px-4">
          <h1 className="text-white text-xl font-bold">ما الذي تشتهيه اليوم؟</h1>
          <p className="text-white/80 text-sm mt-1">اطلب من أفضل المطاعم في صلاح الدين</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="px-4 -mt-4 relative z-10">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="ابحث عن مطعم أو صنف..."
            className="pr-10 bg-white shadow-md border-0 h-11 text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            data-testid="input-search"
          />
        </div>
      </div>

      {/* Category Filter */}
      <div className="mt-4 px-4">
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide flex-row-reverse">
          {catsLoading
            ? Array(6).fill(0).map((_, i) => (
                <div key={i} className="flex-shrink-0 flex flex-col items-center gap-1">
                  <Skeleton className="w-14 h-14 rounded-full" />
                  <Skeleton className="w-12 h-3 rounded" />
                </div>
              ))
            : allCategories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.nameAr)}
                  data-testid={`category-${cat.nameAr}`}
                  className={`flex-shrink-0 flex flex-col items-center gap-1.5 transition-all`}
                >
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl shadow-sm border-2 transition-all ${activeCategory === cat.nameAr ? "border-primary bg-primary/10 scale-105" : "border-transparent bg-white"}`}>
                    {cat.icon}
                  </div>
                  <span className={`text-xs font-medium whitespace-nowrap ${activeCategory === cat.nameAr ? "text-primary font-bold" : "text-foreground"}`}>
                    {cat.nameAr}
                  </span>
                </button>
              ))}
        </div>
      </div>

      {/* Restaurants Grid */}
      <div className="mt-5 px-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-foreground">المطاعم</h2>
          <button className="flex items-center gap-1 text-primary text-xs font-medium">
            عرض الكل <ChevronLeft className="h-3 w-3" />
          </button>
        </div>

        {restsLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {Array(4).fill(0).map((_, i) => <RestaurantCardSkeleton key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">🍽️</p>
            <p className="text-muted-foreground font-medium">لا توجد مطاعم</p>
            <p className="text-sm text-muted-foreground mt-1">جرب فئة أخرى أو كلمة بحث مختلفة</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filtered.map((r) => (
              <button
                key={r.id}
                data-testid={`card-restaurant-${r.id}`}
                onClick={() => setLocation(`/restaurant/${r.id}`)}
                className="bg-white rounded-xl overflow-hidden shadow-sm border border-border text-right hover:shadow-md transition-shadow active:scale-95"
              >
                <div className="relative h-28">
                  <img src={r.imageUrl} alt={r.nameAr} className="w-full h-full object-cover" />
                  {!r.isOpen && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <Badge className="bg-black/70 text-white text-xs">مغلق</Badge>
                    </div>
                  )}
                  <div className="absolute top-2 right-2">
                    <Badge className="bg-white text-foreground text-xs font-bold px-1.5 py-0.5 shadow-sm flex items-center gap-0.5">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                      {r.rating}
                    </Badge>
                  </div>
                </div>
                <div className="p-2.5">
                  <p className="font-bold text-sm text-foreground line-clamp-1">{r.nameAr}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{r.categoryAr}</p>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span className="text-xs">{r.deliveryTime}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{r.minOrder.toLocaleString()} د.ع</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Floating Cart */}
      {totalItems > 0 && (
        <div className="fixed bottom-4 right-4 left-4 z-50">
          <button
            onClick={() => setLocation("/cart")}
            data-testid="button-cart-float"
            className="w-full bg-primary text-white rounded-xl px-4 py-3.5 flex items-center justify-between shadow-lg active:scale-98 transition-transform"
          >
            <span className="font-bold text-sm">{subtotal.toLocaleString()} د.ع</span>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm">عرض السلة</span>
              <div className="bg-white/20 rounded-lg px-2 py-0.5 flex items-center gap-1">
                <ShoppingBag className="h-4 w-4" />
                <span className="font-bold text-sm">{totalItems}</span>
              </div>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}

function RestaurantCardSkeleton() {
  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-border">
      <Skeleton className="h-28 w-full" />
      <div className="p-2.5">
        <Skeleton className="h-4 w-3/4 mb-1" />
        <Skeleton className="h-3 w-1/2 mb-2" />
        <Skeleton className="h-3 w-full" />
      </div>
    </div>
  );
}
