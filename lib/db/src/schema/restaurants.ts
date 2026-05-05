import { pgTable, text, serial, real, boolean, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const categoriesTable = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  nameAr: text("name_ar").notNull(),
  icon: text("icon").notNull(),
  imageUrl: text("image_url").notNull().default(""),
});

export const restaurantsTable = pgTable("restaurants", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  nameAr: text("name_ar").notNull(),
  description: text("description").notNull().default(""),
  descriptionAr: text("description_ar").notNull().default(""),
  category: text("category").notNull(),
  categoryAr: text("category_ar").notNull(),
  rating: real("rating").notNull().default(4.0),
  deliveryTime: text("delivery_time").notNull().default("20-35 د"),
  minOrder: real("min_order").notNull().default(5000),
  imageUrl: text("image_url").notNull(),
  isOpen: boolean("is_open").notNull().default(true),
  isFreeDelivery: boolean("is_free_delivery").notNull().default(false),
  deliveryFee: real("delivery_fee").notNull().default(2000),
  discountPercent: integer("discount_percent").notNull().default(0),
  deliveryMinutes: integer("delivery_minutes").notNull().default(30),
  phone: text("phone").notNull().default(""),
  whatsapp: text("whatsapp").notNull().default(""),
  address: text("address").notNull().default(""),
});

export const menuItemsTable = pgTable("menu_items", {
  id: serial("id").primaryKey(),
  restaurantId: integer("restaurant_id").notNull().references(() => restaurantsTable.id),
  name: text("name").notNull(),
  nameAr: text("name_ar").notNull(),
  description: text("description").notNull().default(""),
  descriptionAr: text("description_ar").notNull().default(""),
  price: real("price").notNull(),
  imageUrl: text("image_url").notNull(),
  category: text("category").notNull(),
  categoryAr: text("category_ar").notNull(),
  isAvailable: boolean("is_available").notNull().default(true),
});

export const ordersTable = pgTable("orders", {
  id: serial("id").primaryKey(),
  orderNumber: text("order_number").notNull(),
  customerName: text("customer_name").notNull(),
  customerPhone: text("customer_phone").notNull(),
  restaurantId: integer("restaurant_id").notNull(),
  restaurantName: text("restaurant_name").notNull(),
  items: text("items").notNull(),
  address: text("address").notNull(),
  neighborhood: text("neighborhood").notNull().default(""),
  notes: text("notes").notNull().default(""),
  total: real("total").notNull(),
  status: text("status").notNull().default("pending"),
  whatsappUrl: text("whatsapp_url").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertCategorySchema = createInsertSchema(categoriesTable).omit({ id: true });
export const insertRestaurantSchema = createInsertSchema(restaurantsTable).omit({ id: true });
export const insertMenuItemSchema = createInsertSchema(menuItemsTable).omit({ id: true });
export const insertOrderSchema = createInsertSchema(ordersTable).omit({ id: true, createdAt: true });

export type Category = typeof categoriesTable.$inferSelect;
export type Restaurant = typeof restaurantsTable.$inferSelect;
export type MenuItem = typeof menuItemsTable.$inferSelect;
export type Order = typeof ordersTable.$inferSelect;
export type InsertRestaurant = z.infer<typeof insertRestaurantSchema>;
export type InsertMenuItem = z.infer<typeof insertMenuItemSchema>;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
