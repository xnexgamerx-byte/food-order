import { Router } from "express";
import { db } from "@workspace/db";
import { reviewsTable, ordersTable, restaurantsTable } from "@workspace/db";
import { eq, and, avg } from "drizzle-orm";
import { CreateReviewBody } from "@workspace/api-zod";

const router = Router();

router.get("/reviews/by-order/:orderId", async (req, res) => {
  try {
    const orderId = Number(req.params["orderId"]);
    if (!Number.isFinite(orderId)) {
      res.status(400).json({ error: "invalid orderId" }); return;
    }
    const [review] = await db
      .select()
      .from(reviewsTable)
      .where(eq(reviewsTable.orderId, orderId));
    res.json(review || null);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/restaurants/:id/reviews", async (req, res) => {
  try {
    const id = Number(req.params["id"]);
    if (!Number.isFinite(id)) {
      res.status(400).json({ error: "invalid id" }); return;
    }
    const rows = await db
      .select()
      .from(reviewsTable)
      .where(eq(reviewsTable.restaurantId, id));
    res.json(rows);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/reviews", async (req, res) => {
  try {
    const parsed = CreateReviewBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "بيانات التقييم غير صحيحة" }); return;
    }
    const { orderId, customerPhone, rating, message } = parsed.data;

    if (rating < 3 && (!message || message.trim().length < 3)) {
      res.status(400).json({ error: "يرجى كتابة سبب التقييم المنخفض" }); return;
    }

    const [order] = await db
      .select()
      .from(ordersTable)
      .where(eq(ordersTable.id, orderId));

    if (!order) { res.status(404).json({ error: "الطلب غير موجود" }); return; }
    if (order.customerPhone !== customerPhone) {
      res.status(403).json({ error: "هذا الطلب لا يخصك" }); return;
    }
    if (order.status !== "delivered") {
      res.status(400).json({ error: "يمكن التقييم بعد توصيل الطلب فقط" }); return;
    }

    const [existing] = await db
      .select()
      .from(reviewsTable)
      .where(eq(reviewsTable.orderId, orderId));
    if (existing) { res.status(409).json({ error: "تم تقييم هذا الطلب مسبقاً" }); return; }

    const [created] = await db
      .insert(reviewsTable)
      .values({
        orderId,
        restaurantId: order.restaurantId,
        customerPhone,
        rating,
        message: message?.trim() || "",
      })
      .returning();

    // Recompute restaurant aggregate rating
    const [agg] = await db
      .select({ avgRating: avg(reviewsTable.rating) })
      .from(reviewsTable)
      .where(eq(reviewsTable.restaurantId, order.restaurantId));

    if (agg?.avgRating) {
      await db
        .update(restaurantsTable)
        .set({ rating: Number(agg.avgRating) })
        .where(eq(restaurantsTable.id, order.restaurantId));
    }

    res.status(201).json(created);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
