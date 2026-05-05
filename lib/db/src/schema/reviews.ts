import { pgTable, serial, integer, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const reviewsTable = pgTable(
  "reviews",
  {
    id: serial("id").primaryKey(),
    orderId: integer("order_id").notNull(),
    restaurantId: integer("restaurant_id").notNull(),
    customerPhone: text("customer_phone").notNull(),
    rating: integer("rating").notNull(),
    message: text("message").notNull().default(""),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => ({
    orderUnique: uniqueIndex("reviews_order_id_unique").on(t.orderId),
  }),
);

export const insertReviewSchema = createInsertSchema(reviewsTable).omit({ id: true, createdAt: true });
export type Review = typeof reviewsTable.$inferSelect;
export type InsertReview = z.infer<typeof insertReviewSchema>;
