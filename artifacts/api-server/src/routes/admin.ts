import { Router } from "express";
import { db } from "@workspace/db";
import { restaurantsTable, menuItemsTable, ordersTable, reviewsTable } from "@workspace/db";
import { eq, desc, avg } from "drizzle-orm";
import { adminAuth, generateAdminToken, checkAdminPassword } from "../middleware/adminAuth";

const router = Router();

/* ─── Auth ─── */
router.post("/admin/login", async (req, res) => {
  const { password } = req.body as { password?: string };
  if (!password || !checkAdminPassword(password)) {
    res.status(401).json({ error: "كلمة المرور غير صحيحة" }); return;
  }
  const token = generateAdminToken();
  res.json({ token });
});

/* ─── Stats ─── */
router.get("/admin/stats", adminAuth, async (req, res) => {
  try {
    const restaurants = await db.select().from(restaurantsTable);
    const orders = await db.select().from(ordersTable).orderBy(desc(ordersTable.createdAt));
    const totalRevenue = orders.reduce((s, o) => s + o.total, 0);
    const pending = orders.filter((o) => o.status === "pending").length;
    res.json({
      restaurantCount: restaurants.length,
      orderCount: orders.length,
      totalRevenue,
      pendingOrders: pending,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/* ─── Restaurants ─── */
router.get("/admin/restaurants", adminAuth, async (req, res) => {
  try {
    const rows = await db.select().from(restaurantsTable);
    res.json(rows);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/admin/restaurants", adminAuth, async (req, res) => {
  try {
    const { nameAr, categoryAr, deliveryTime, deliveryMinutes, minOrder, maxDeliveryFee, deliveryFee,
            imageUrl, whatsapp, isOpen, isFreeDelivery, discountPercent,
            pricePerKm, lat, lng } = req.body;
    const [created] = await db.insert(restaurantsTable).values({
      nameAr: nameAr || "مطعم جديد",
      name: nameAr || "New Restaurant",
      categoryAr: categoryAr || "متنوع",
      category: categoryAr || "Various",
      deliveryTime: deliveryTime || "20-35 د",
      deliveryMinutes: Number(deliveryMinutes) || 30,
      minOrder: Number(minOrder) || 5000,
      maxDeliveryFee: maxDeliveryFee !== undefined && maxDeliveryFee !== "" && maxDeliveryFee !== null ? Number(maxDeliveryFee) : null,
      deliveryFee: deliveryFee !== undefined ? Number(deliveryFee) : 2000,
      pricePerKm: pricePerKm !== undefined ? Number(pricePerKm) : 500,
      lat: lat !== undefined && lat !== "" && lat !== null ? Number(lat) : null,
      lng: lng !== undefined && lng !== "" && lng !== null ? Number(lng) : null,
      imageUrl: imageUrl || "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&q=80",
      whatsapp: whatsapp || "",
      rating: 4.0,
      isOpen: isOpen !== undefined ? Boolean(isOpen) : true,
      isFreeDelivery: isFreeDelivery !== undefined ? Boolean(isFreeDelivery) : false,
      discountPercent: Number(discountPercent) || 0,
    }).returning();
    res.status(201).json(created);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/admin/restaurants/:id", adminAuth, async (req, res) => {
  try {
    const id = Number(req.params.id);
    await db.delete(menuItemsTable).where(eq(menuItemsTable.restaurantId, id));
    await db.delete(restaurantsTable).where(eq(restaurantsTable.id, id));
    res.json({ success: true });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/admin/restaurants/:id", adminAuth, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { nameAr, categoryAr, rating, deliveryTime, deliveryMinutes, minOrder, maxDeliveryFee, deliveryFee,
            isOpen, isFreeDelivery, discountPercent, imageUrl, whatsapp,
            pricePerKm, lat, lng } = req.body;

    const [updated] = await db
      .update(restaurantsTable)
      .set({
        ...(nameAr !== undefined && { nameAr }),
        ...(categoryAr !== undefined && { categoryAr }),
        ...(rating !== undefined && { rating: Number(rating) }),
        ...(deliveryTime !== undefined && { deliveryTime }),
        ...(deliveryMinutes !== undefined && { deliveryMinutes: Number(deliveryMinutes) }),
        ...(minOrder !== undefined && { minOrder: Number(minOrder) }),
        ...(maxDeliveryFee !== undefined && { maxDeliveryFee: maxDeliveryFee === "" || maxDeliveryFee === null ? null : Number(maxDeliveryFee) }),
        ...(deliveryFee !== undefined && { deliveryFee: Number(deliveryFee) }),
        ...(pricePerKm !== undefined && { pricePerKm: Number(pricePerKm) }),
        ...(lat !== undefined && { lat: lat === "" || lat === null ? null : Number(lat) }),
        ...(lng !== undefined && { lng: lng === "" || lng === null ? null : Number(lng) }),
        ...(isOpen !== undefined && { isOpen: Boolean(isOpen) }),
        ...(isFreeDelivery !== undefined && { isFreeDelivery: Boolean(isFreeDelivery) }),
        ...(discountPercent !== undefined && { discountPercent: Number(discountPercent) }),
        ...(imageUrl !== undefined && { imageUrl }),
        ...(whatsapp !== undefined && { whatsapp }),
      })
      .where(eq(restaurantsTable.id, id))
      .returning();

    if (!updated) { res.status(404).json({ error: "Not found" }); return; }
    res.json(updated);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/* ─── Menu Items ─── */
router.get("/admin/restaurants/:id/menu", adminAuth, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const items = await db.select().from(menuItemsTable).where(eq(menuItemsTable.restaurantId, id));
    res.json(items);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/admin/restaurants/:id/menu", adminAuth, async (req, res) => {
  try {
    const restaurantId = Number(req.params.id);
    const { nameAr, name, descriptionAr, description, price, imageUrl, categoryAr, category } = req.body;
    const [item] = await db.insert(menuItemsTable).values({
      restaurantId, nameAr, name: name || nameAr, descriptionAr: descriptionAr || "",
      description: description || "", price: Number(price),
      imageUrl: imageUrl || "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&q=80",
      categoryAr, category: category || categoryAr, isAvailable: true,
    }).returning();
    res.status(201).json(item);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/admin/menu/:id", adminAuth, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { nameAr, descriptionAr, price, imageUrl, categoryAr, isAvailable } = req.body;
    const [updated] = await db.update(menuItemsTable).set({
      ...(nameAr !== undefined && { nameAr }),
      ...(descriptionAr !== undefined && { descriptionAr }),
      ...(price !== undefined && { price: Number(price) }),
      ...(imageUrl !== undefined && { imageUrl }),
      ...(categoryAr !== undefined && { categoryAr, category: categoryAr }),
      ...(isAvailable !== undefined && { isAvailable: Boolean(isAvailable) }),
    }).where(eq(menuItemsTable.id, id)).returning();
    if (!updated) { res.status(404).json({ error: "Not found" }); return; }
    res.json(updated);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/admin/menu/:id", adminAuth, async (req, res) => {
  try {
    const id = Number(req.params.id);
    await db.delete(menuItemsTable).where(eq(menuItemsTable.id, id));
    res.json({ success: true });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/* ─── Orders ─── */
router.get("/admin/orders", adminAuth, async (req, res) => {
  try {
    const orders = await db.select().from(ordersTable).orderBy(desc(ordersTable.createdAt));
    res.json(orders);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/admin/orders/:id/status", adminAuth, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { status } = req.body as { status: string };
    const [updated] = await db.update(ordersTable)
      .set({ status })
      .where(eq(ordersTable.id, id))
      .returning();
    if (!updated) { res.status(404).json({ error: "Not found" }); return; }
    res.json(updated);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/* ─── Reviews ─── */
router.get("/admin/reviews", adminAuth, async (req, res) => {
  try {
    const rows = await db
      .select({
        id: reviewsTable.id,
        orderId: reviewsTable.orderId,
        restaurantId: reviewsTable.restaurantId,
        customerPhone: reviewsTable.customerPhone,
        rating: reviewsTable.rating,
        message: reviewsTable.message,
        createdAt: reviewsTable.createdAt,
        restaurantName: restaurantsTable.nameAr,
        orderNumber: ordersTable.orderNumber,
        customerName: ordersTable.customerName,
      })
      .from(reviewsTable)
      .leftJoin(restaurantsTable, eq(reviewsTable.restaurantId, restaurantsTable.id))
      .leftJoin(ordersTable, eq(reviewsTable.orderId, ordersTable.id))
      .orderBy(desc(reviewsTable.createdAt));
    res.json(rows);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/admin/reviews/:id", adminAuth, async (req, res) => {
  try {
    const id = Number(req.params["id"]);
    const [removed] = await db
      .delete(reviewsTable)
      .where(eq(reviewsTable.id, id))
      .returning();
    if (!removed) { res.status(404).json({ error: "Not found" }); return; }

    // Recompute restaurant rating after deletion
    const [agg] = await db
      .select({ avgRating: avg(reviewsTable.rating) })
      .from(reviewsTable)
      .where(eq(reviewsTable.restaurantId, removed.restaurantId));

    await db
      .update(restaurantsTable)
      .set({ rating: agg?.avgRating ? Number(agg.avgRating) : 4.0 })
      .where(eq(restaurantsTable.id, removed.restaurantId));

    res.json({ success: true });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
