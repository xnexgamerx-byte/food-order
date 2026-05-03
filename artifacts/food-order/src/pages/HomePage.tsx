import { useState } from "react";
import { useLocation } from "wouter";
import { Search, Star, Clock, ShoppingBag, Tag, Truck, Zap, SortAsc } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useListRestaurants, useListCategories } from "@workspace/api-client-react";
import { useCart } from "@/lib/cart-context";

const HERO_IMAGE = "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=900&q=85";

type FilterChip = {
  key: string;
  label: string;
  icon: React.ElementType;
  param: string;
};

const FILTER_CHIPS: FilterChip[] = [
  { key: "discount", label: "خصومات", icon: Tag, param: "hasDiscount" },
  { key: "freeDelivery", label: "توصيل مجاني", icon: Truck, param: "isFreeDelivery" },
  { key: "fastDelivery", label: "توصيل سريع", icon: Zap, param: "isFastDelivery" },
  { key: "rating", label: "الأعلى تقييماً", icon: SortAsc, param: "sortBy" },
];

export default function HomePage() {
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("الكل");
  const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set());
  const { totalItems, subtotal } = useCart();

  const { data: categories, isLoading: catsLoading } = useListCategories();

  const queryParams: Record<string, string | boolean> = {};
  if (activeCategory !== "الكل") queryParams.category = activeCategory;
  if (activeFilters.has("discount")) queryParams.hasDiscount = true;
  if (activeFilters.has("freeDelivery")) queryParams.isFreeDelivery = true;
  if (activeFilters.has("fastDelivery")) queryParams.isFastDelivery = true;
  if (activeFilters.has("rating")) queryParams.sortBy = "rating";

  const { data: restaurants, isLoading: restsLoading } = useListRestaurants(
    queryParams as Parameters<typeof useListRestaurants>[0],
    { query: { queryKey: ["restaurants", activeCategory, ...Array.from(activeFilters)] } }
  );

  const allCategories = [
    { id: 0, nameAr: "الكل", name: "All", icon: "🍽️" },
    ...(categories || []),
  ];

  const filtered = (restaurants || []).filter((r) => {
    if (!search) return true;
    return (
      r.nameAr.includes(search) ||
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.categoryAr.includes(search)
    );
  });

  const toggleFilter = (key: string) => {
    setActiveFilters((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-background pb-28">

      {/* Hero */}
      <div className="relative h-32 overflow-hidden">
        <img src={HERO_IMAGE} alt="food" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-blue-900/70 via-blue-900/40 to-transparent flex flex-col justify-center px-5">
          <h1 className="text-white text-lg font-bold leading-snug">ما الذي تشتهيه اليوم؟</h1>
          <p className="text-white/80 text-xs mt-0.5">اطلب من أفضل مطاعم صلاح الدين</p>
        </div>
      </div>

      {/* Search */}
      <div className="px-4 -mt-4 relative z-10">
        <div className="relative">
          <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="search"
            placeholder="ابحث عن مطعم أو صنف..."
            className="w-full h-11 pr-10 pl-4 bg-white rounded-xl border-0 shadow-md text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            data-testid="input-search"
          />
        </div>
      </div>

      {/* Categories */}
      <div className="mt-5 px-4">
        <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-hide flex-row-reverse">
          {catsLoading
            ? Array(7).fill(0).map((_, i) => (
                <div key={i} className="flex-shrink-0 flex flex-col items-center gap-1.5">
                  <Skeleton className="w-13 h-13 rounded-2xl" />
                  <Skeleton className="w-10 h-2.5 rounded" />
                </div>
              ))
            : allCategories.map((cat) => {
                const active = activeCategory === cat.nameAr;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.nameAr)}
                    data-testid={`category-${cat.nameAr}`}
                    className="flex-shrink-0 flex flex-col items-center gap-1.5 transition-all"
                  >
                    <div
                      className={`w-13 h-13 rounded-2xl flex items-center justify-center text-xl transition-all duration-200 ${
                        active
                          ? "bg-primary shadow-md scale-105"
                          : "bg-white shadow-xs border border-border"
                      }`}
                    >
                      {cat.icon}
                    </div>
                    <span
                      className={`text-xs font-semibold whitespace-nowrap ${
                        active ? "text-primary" : "text-muted-foreground"
                      }`}
                    >
                      {cat.nameAr}
                    </span>
                  </button>
                );
              })}
        </div>
      </div>

      {/* Smart Filter Chips */}
      <div className="mt-3 px-4">
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide flex-row-reverse">
          {FILTER_CHIPS.map((chip) => {
            const active = activeFilters.has(chip.key);
            const Icon = chip.icon;
            return (
              <button
                key={chip.key}
                onClick={() => toggleFilter(chip.key)}
                data-testid={`filter-${chip.key}`}
                className={`flex-shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-full border text-xs font-semibold transition-all duration-200 whitespace-nowrap ${
                  active
                    ? "bg-primary text-white border-primary shadow-sm"
                    : "bg-white text-foreground border-border hover:border-primary/50 hover:text-primary"
                }`}
              >
                <Icon className="h-3.5 w-3.5 flex-shrink-0" />
                {chip.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Restaurants */}
      <div className="mt-4 px-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-bold text-foreground">
            {activeCategory === "الكل" ? "جميع المطاعم" : activeCategory}
          </span>
          <span className="text-xs text-muted-foreground">
            {restsLoading ? "..." : `${filtered.length} مطعم`}
          </span>
        </div>

        {restsLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {Array(4).fill(0).map((_, i) => <CardSkeleton key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center py-16 gap-3">
            <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center text-3xl">🍽️</div>
            <p className="text-muted-foreground font-medium text-sm">لا توجد نتائج</p>
            <p className="text-xs text-muted-foreground">جرب فلتراً مختلفاً</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filtered.map((r) => (
              <RestaurantCard key={r.id} restaurant={r} onClick={() => setLocation(`/restaurant/${r.id}`)} />
            ))}
          </div>
        )}
      </div>

      {/* Floating Cart */}
      {totalItems > 0 && (
        <div className="fixed bottom-5 right-4 left-4 z-50">
          <button
            onClick={() => setLocation("/cart")}
            data-testid="button-cart-float"
            className="w-full bg-primary text-white rounded-2xl px-5 py-3.5 flex items-center justify-between shadow-lg hover:bg-primary/90 active:scale-98 transition-all"
          >
            <span className="font-bold text-sm">{subtotal.toLocaleString()} د.ع</span>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm">عرض السلة</span>
              <div className="bg-white/20 rounded-xl px-2.5 py-1 flex items-center gap-1.5">
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

type Restaurant = {
  id: number;
  nameAr: string;
  categoryAr: string;
  rating: number;
  deliveryTime: string;
  minOrder: number;
  imageUrl: string;
  isOpen: boolean;
  isFreeDelivery?: boolean;
  discountPercent?: number;
};

function RestaurantCard({ restaurant: r, onClick }: { restaurant: Restaurant; onClick: () => void }) {
  return (
    <button
      data-testid={`card-restaurant-${r.id}`}
      onClick={onClick}
      className="bg-white rounded-2xl overflow-hidden shadow-sm border border-border text-right hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 active:scale-95"
    >
      {/* Image */}
      <div className="relative h-28">
        <img src={r.imageUrl} alt={r.nameAr} className="w-full h-full object-cover" />

        {!r.isOpen && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="bg-black/70 text-white text-xs font-bold px-2.5 py-1 rounded-full">مغلق</span>
          </div>
        )}

        {/* Top badges row */}
        <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
          {/* Discount badge */}
          {r.discountPercent && r.discountPercent > 0 ? (
            <span className="bg-red-500 text-white text-xs font-black px-1.5 py-0.5 rounded-lg leading-tight">
              -{r.discountPercent}%
            </span>
          ) : null}
        </div>

        {/* Rating badge bottom-left */}
        <div className="absolute bottom-2 left-2 bg-white/95 backdrop-blur-sm rounded-full px-1.5 py-0.5 flex items-center gap-0.5 shadow-xs">
          <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />
          <span className="text-xs font-bold text-foreground">{r.rating}</span>
        </div>

        {/* Free delivery badge bottom-right */}
        {r.isFreeDelivery && (
          <div className="absolute bottom-2 right-2 bg-primary/90 text-white text-xs font-bold px-1.5 py-0.5 rounded-lg leading-tight">
            توصيل مجاني
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <p className="font-bold text-sm text-foreground line-clamp-1 leading-snug">{r.nameAr}</p>
        <p className="text-xs text-muted-foreground mt-0.5 mb-2">{r.categoryAr}</p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span className="text-xs">{r.deliveryTime}</span>
          </div>
          <span className="text-xs text-muted-foreground">{r.minOrder.toLocaleString()} د.ع</span>
        </div>
      </div>
    </button>
  );
}

function CardSkeleton() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-border">
      <Skeleton className="h-28 w-full" />
      <div className="p-3">
        <Skeleton className="h-4 w-3/4 mb-1.5" />
        <Skeleton className="h-3 w-1/2 mb-3" />
        <Skeleton className="h-3 w-full" />
      </div>
    </div>
  );
}
