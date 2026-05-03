import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import type { OrderItemInput, Restaurant } from "@workspace/api-client-react";

export interface CartItem extends OrderItemInput {
  imageUrl: string;
}

interface CartContextType {
  items: CartItem[];
  restaurantId: number | null;
  restaurantName: string | null;
  addItem: (item: CartItem, rId: number, rName: string) => void;
  removeItem: (menuItemId: number) => void;
  updateQuantity: (menuItemId: number, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  subtotal: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const stored = localStorage.getItem("cart_items");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [restaurantId, setRestaurantId] = useState<number | null>(() => {
    try {
      const stored = localStorage.getItem("cart_restaurant_id");
      return stored ? parseInt(stored) : null;
    } catch {
      return null;
    }
  });
  
  const [restaurantName, setRestaurantName] = useState<string | null>(() => {
    try {
      return localStorage.getItem("cart_restaurant_name");
    } catch {
      return null;
    }
  });

  useEffect(() => {
    localStorage.setItem("cart_items", JSON.stringify(items));
    if (restaurantId) localStorage.setItem("cart_restaurant_id", restaurantId.toString());
    else localStorage.removeItem("cart_restaurant_id");
    if (restaurantName) localStorage.setItem("cart_restaurant_name", restaurantName);
    else localStorage.removeItem("cart_restaurant_name");
  }, [items, restaurantId, restaurantName]);

  const addItem = (item: CartItem, rId: number, rName: string) => {
    if (restaurantId !== null && restaurantId !== rId) {
      if (window.confirm("إضافة عناصر من مطعم آخر سيؤدي إلى مسح السلة الحالية. هل تريد المتابعة؟")) {
        setItems([item]);
        setRestaurantId(rId);
        setRestaurantName(rName);
      }
      return;
    }

    setRestaurantId(rId);
    setRestaurantName(rName);
    
    setItems((prev) => {
      const existing = prev.find((i) => i.menuItemId === item.menuItemId);
      if (existing) {
        return prev.map((i) => 
          i.menuItemId === item.menuItemId 
            ? { ...i, quantity: i.quantity + item.quantity } 
            : i
        );
      }
      return [...prev, item];
    });
  };

  const removeItem = (menuItemId: number) => {
    setItems((prev) => {
      const newItems = prev.filter((i) => i.menuItemId !== menuItemId);
      if (newItems.length === 0) {
        setRestaurantId(null);
        setRestaurantName(null);
      }
      return newItems;
    });
  };

  const updateQuantity = (menuItemId: number, quantity: number) => {
    if (quantity <= 0) {
      removeItem(menuItemId);
      return;
    }
    
    setItems((prev) => prev.map((i) => 
      i.menuItemId === menuItemId ? { ...i, quantity } : i
    ));
  };

  const clearCart = () => {
    setItems([]);
    setRestaurantId(null);
    setRestaurantName(null);
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <CartContext.Provider value={{
      items, restaurantId, restaurantName, addItem, removeItem, updateQuantity, clearCart, totalItems, subtotal
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
