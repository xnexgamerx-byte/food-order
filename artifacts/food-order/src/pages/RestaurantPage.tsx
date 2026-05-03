import { useState } from "react";
import { useLocation, useParams } from "wouter";
import { ArrowRight, Star, Clock, Minus, Plus, ShoppingBag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetRestaurant, useGetRestaurantMenu, getGetRestaurantQueryKey, getGetRestaurantMenuQueryKey } from "@workspace/api-client-react";
import { useCart } from "@/lib/cart-context";
import type { CartItem } from "@/lib/cart-context";

export default function RestaurantPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const { items, addItem, updateQuantity, totalItems, subtotal, restaurantId } = useCart();

  const { data: restaurant, isLoading: restLoading } = useGetRestaurant(id, {
    query: { enabled: !!id, queryKey: getGetRestaurantQueryKey(id) }
  });

  const { data: menuItems, isLoading: menuLoading } = useGetRestaurantMenu(id, {}, {
    query: { enabled: !!id, queryKey: getGetRestaurantMenuQueryKey(id, {}) }
  });

  const allCategories = menuItems
    ? [...new Set(menuItems.map((i) => i.categoryAr))]
    : [];

  const currentTab = activeTab || allCategories[0] || null;

  const filteredItems = menuItems
    ? currentTab ? menuItems.filter((i) => i.categoryAr === currentTab) : menuItems
    : [];

  const getItemQty = (menuItemId: number) => {
    if (restaurantId !== id) return 0;
    return items.find((i) => i.menuItemId === menuItemId)?.quantity || 0;
  };

  const handleAdd = (item: typeof menuItems extends (infer T)[] | undefined ? T : never) => {
    if (!item) return;
    const cartItem: CartItem = {
      menuItemId: item.id,
      quantity: 1,
      price: item.price,
      name: item.name,
      nameAr: item.nameAr,
      imageUrl: item.imageUrl,
    };
    addItem(cartItem, id, restaurant?.nameAr || "");
  };

  return (
    <div className="min-h-screen bg-background pb-28">
      {/* Restaurant Hero */}
      <div className="relative h-44">
        {restLoading ? (
          <Skeleton className="w-full h-44" />
        ) : (
          <>
            <img
              src={restaurant?.imageUrl}
              alt={restaurant?.nameAr}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          </>
        )}
        <button
          onClick={() => setLocation("/")}
          data-testid="button-back"
          className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-md"
        >
          <ArrowRight className="h-5 w-5 text-foreground" />
        </button>
        {restaurant && (
          <div className="absolute bottom-3 right-4 left-4 text-white">
            <h1 className="text-xl font-bold">{restaurant.nameAr}</h1>
            <div className="flex items-center gap-3 mt-1">
              <div className="flex items-center gap-1">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                <span className="text-sm">{restaurant.rating}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                <span className="text-sm">{restaurant.deliveryTime}</span>
              </div>
              <Badge className={restaurant.isOpen ? "bg-green-500 text-white text-xs" : "bg-red-500 text-white text-xs"}>
                {restaurant.isOpen ? "مفتوح" : "مغلق"}
              </Badge>
            </div>
          </div>
        )}
      </div>

      {/* Category Tabs */}
      <div className="bg-white border-b sticky top-0 z-30">
        <div className="flex overflow-x-auto scrollbar-hide flex-row-reverse">
          {menuLoading ? (
            <div className="flex gap-2 px-4 py-3">
              {Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-8 w-16 rounded-lg" />)}
            </div>
          ) : (
            allCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveTab(cat)}
                data-testid={`tab-${cat}`}
                className={`flex-shrink-0 px-4 py-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
                  currentTab === cat
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {cat}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Menu Items */}
      <div className="px-4 mt-4 space-y-3">
        {menuLoading
          ? Array(4).fill(0).map((_, i) => <MenuItemSkeleton key={i} />)
          : filteredItems.filter((i) => i.isAvailable).map((item) => {
              const qty = getItemQty(item.id);
              return (
                <div
                  key={item.id}
                  data-testid={`card-menu-item-${item.id}`}
                  className="bg-white rounded-xl border border-border shadow-sm flex gap-3 p-3 items-start"
                >
                  <img
                    src={item.imageUrl}
                    alt={item.nameAr}
                    className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-foreground">{item.nameAr}</p>
                    {item.descriptionAr && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{item.descriptionAr}</p>
                    )}
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-primary font-bold text-sm">{item.price.toLocaleString()} د.ع</span>
                      {qty === 0 ? (
                        <button
                          onClick={() => handleAdd(item)}
                          data-testid={`button-add-${item.id}`}
                          className="bg-primary text-white rounded-lg px-3 py-1.5 text-sm font-semibold flex items-center gap-1 active:scale-95 transition-transform"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          إضافة
                        </button>
                      ) : (
                        <div className="flex items-center gap-2 bg-primary/10 rounded-lg p-1">
                          <button
                            onClick={() => updateQuantity(item.id, qty - 1)}
                            data-testid={`button-minus-${item.id}`}
                            className="w-6 h-6 bg-primary text-white rounded-md flex items-center justify-center"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="font-bold text-sm text-primary w-5 text-center">{qty}</span>
                          <button
                            onClick={() => updateQuantity(item.id, qty + 1)}
                            data-testid={`button-plus-${item.id}`}
                            className="w-6 h-6 bg-primary text-white rounded-md flex items-center justify-center"
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

function MenuItemSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-border shadow-sm flex gap-3 p-3">
      <Skeleton className="w-20 h-20 rounded-lg flex-shrink-0" />
      <div className="flex-1">
        <Skeleton className="h-4 w-3/4 mb-1.5" />
        <Skeleton className="h-3 w-full mb-1" />
        <Skeleton className="h-3 w-2/3 mb-2" />
        <div className="flex justify-between">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-7 w-16 rounded-lg" />
        </div>
      </div>
    </div>
  );
}
