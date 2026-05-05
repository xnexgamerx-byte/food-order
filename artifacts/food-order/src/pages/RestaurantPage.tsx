import { useState } from "react";
import { useLocation, useParams } from "wouter";
import { ArrowRight, Star, Clock, Minus, Plus, ShoppingBag } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useGetRestaurant,
  useGetRestaurantMenu,
  getGetRestaurantQueryKey,
  getGetRestaurantMenuQueryKey,
} from "@workspace/api-client-react";
import { useCart } from "@/lib/cart-context";
import type { CartItem } from "@/lib/cart-context";

export default function RestaurantPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const { items, addItem, updateQuantity, totalItems, subtotal, restaurantId } = useCart();

  const { data: restaurant, isLoading: restLoading } = useGetRestaurant(id, {
    query: { enabled: !!id, queryKey: getGetRestaurantQueryKey(id) },
  });

  const { data: menuItems, isLoading: menuLoading } = useGetRestaurantMenu(id, {}, {
    query: { enabled: !!id, queryKey: getGetRestaurantMenuQueryKey(id, {}) },
  });

  const allTabs = menuItems ? [...new Set(menuItems.map((i) => i.categoryAr))] : [];
  const currentTab = activeTab || allTabs[0] || null;
  const filteredItems = menuItems
    ? currentTab ? menuItems.filter((i) => i.categoryAr === currentTab && i.isAvailable) : menuItems.filter((i) => i.isAvailable)
    : [];

  const getQty = (menuItemId: number) =>
    restaurantId !== id ? 0 : (items.find((i) => i.menuItemId === menuItemId)?.quantity || 0);

  const handleAdd = (item: NonNullable<typeof menuItems>[number]) => {
    const cartItem: CartItem = {
      menuItemId: item.id,
      quantity: 1,
      price: item.price,
      name: item.name,
      nameAr: item.nameAr,
      imageUrl: item.imageUrl,
    };
    const fee = restaurant?.isFreeDelivery ? 0 : (restaurant?.deliveryFee ?? 2000);
    addItem(cartItem, id, restaurant?.nameAr || "", fee);
  };

  return (
    <div className="min-h-screen bg-background pb-28">

      {/* Hero */}
      <div className="relative h-44">
        {restLoading ? (
          <Skeleton className="w-full h-44" />
        ) : (
          <>
            <img src={restaurant?.imageUrl} alt={restaurant?.nameAr} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-blue-950/80 via-blue-950/30 to-transparent" />
          </>
        )}

        <button
          onClick={() => setLocation("/")}
          data-testid="button-back"
          className="absolute top-3 right-4 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm"
        >
          <ArrowRight className="h-4 w-4 text-foreground" />
        </button>

        {restaurant && (
          <div className="absolute bottom-4 right-4 left-4 text-white">
            <h1 className="text-xl font-black">{restaurant.nameAr}</h1>
            <div className="flex items-center gap-4 mt-1.5">
              <div className="flex items-center gap-1">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                <span className="text-sm font-semibold">{restaurant.rating}</span>
              </div>
              <div className="flex items-center gap-1 text-white/80">
                <Clock className="h-3.5 w-3.5" />
                <span className="text-sm">{restaurant.deliveryTime}</span>
              </div>
              <span
                className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                  restaurant.isOpen
                    ? "bg-emerald-500/90 text-white"
                    : "bg-red-500/90 text-white"
                }`}
              >
                {restaurant.isOpen ? "مفتوح الآن" : "مغلق"}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-border sticky top-12 z-20">
        <div className="flex overflow-x-auto scrollbar-hide flex-row-reverse px-2">
          {menuLoading
            ? Array(3).fill(0).map((_, i) => (
                <div key={i} className="flex-shrink-0 px-4 py-3">
                  <Skeleton className="h-4 w-14 rounded" />
                </div>
              ))
            : allTabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  data-testid={`tab-${tab}`}
                  className={`flex-shrink-0 px-4 py-3.5 text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
                    currentTab === tab
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab}
                </button>
              ))}
        </div>
      </div>

      {/* Menu Items */}
      <div className="px-4 mt-4 space-y-3">
        {menuLoading
          ? Array(4).fill(0).map((_, i) => <MenuSkeleton key={i} />)
          : filteredItems.map((item) => {
              const qty = getQty(item.id);
              return (
                <div
                  key={item.id}
                  data-testid={`card-menu-item-${item.id}`}
                  className="bg-white rounded-2xl border border-border shadow-xs flex gap-3 p-3 items-center transition-shadow hover:shadow-sm"
                >
                  <img
                    src={item.imageUrl}
                    alt={item.nameAr}
                    className="w-20 h-20 rounded-xl object-cover flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-foreground leading-snug">{item.nameAr}</p>
                    {item.descriptionAr && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">
                        {item.descriptionAr}
                      </p>
                    )}
                    <div className="flex items-center justify-between mt-2.5">
                      <span className="text-primary font-black text-sm">
                        {item.price.toLocaleString()} د.ع
                      </span>
                      {qty === 0 ? (
                        <button
                          onClick={() => handleAdd(item)}
                          data-testid={`button-add-${item.id}`}
                          className="bg-primary text-white rounded-xl px-3.5 py-1.5 text-xs font-bold flex items-center gap-1 hover:bg-primary/90 active:scale-95 transition-all"
                        >
                          <Plus className="h-3 w-3" />
                          إضافة
                        </button>
                      ) : (
                        <div className="flex items-center gap-1.5 bg-primary/8 rounded-xl p-1">
                          <button
                            onClick={() => updateQuantity(item.id, qty - 1)}
                            data-testid={`button-minus-${item.id}`}
                            className="w-7 h-7 bg-primary text-white rounded-lg flex items-center justify-center hover:bg-primary/90 transition-colors"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="font-black text-sm text-primary w-5 text-center tabular-nums">
                            {qty}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, qty + 1)}
                            data-testid={`button-plus-${item.id}`}
                            className="w-7 h-7 bg-primary text-white rounded-lg flex items-center justify-center hover:bg-primary/90 transition-colors"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
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

function MenuSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-border shadow-xs flex gap-3 p-3">
      <Skeleton className="w-20 h-20 rounded-xl flex-shrink-0" />
      <div className="flex-1">
        <Skeleton className="h-4 w-3/4 mb-2" />
        <Skeleton className="h-3 w-full mb-1" />
        <Skeleton className="h-3 w-2/3 mb-3" />
        <div className="flex justify-between">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-7 w-16 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
