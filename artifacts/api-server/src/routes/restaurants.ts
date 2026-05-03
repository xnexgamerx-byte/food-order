import { Router } from "express";
import { db } from "@workspace/db";
import { restaurantsTable, menuItemsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

router.get("/restaurants", async (req, res) => {
  try {
    const { category, search, hasDiscount, isFreeDelivery, isFastDelivery, sortBy } = req.query as {
      category?: string;
      search?: string;
      hasDiscount?: string;
      isFreeDelivery?: string;
      isFastDelivery?: string;
      sortBy?: string;
    };

    let restaurants = await db.select().from(restaurantsTable);

    if (category && category !== "all" && category !== "الكل") {
      restaurants = restaurants.filter(
        (r) => r.category === category || r.categoryAr === category
      );
    }

    if (search) {
      const q = search.toLowerCase();
      restaurants = restaurants.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.nameAr.toLowerCase().includes(q) ||
          r.category.toLowerCase().includes(q) ||
          r.categoryAr.includes(q)
      );
    }

    if (hasDiscount === "true") {
      restaurants = restaurants.filter((r) => r.discountPercent > 0);
    }

    if (isFreeDelivery === "true") {
      restaurants = restaurants.filter((r) => r.isFreeDelivery);
    }

    if (isFastDelivery === "true") {
      restaurants = restaurants.filter((r) => r.deliveryMinutes <= 20);
    }

    if (sortBy === "rating") {
      restaurants = restaurants.sort((a, b) => b.rating - a.rating);
    } else if (sortBy === "deliveryTime") {
      restaurants = restaurants.sort((a, b) => a.deliveryMinutes - b.deliveryMinutes);
    }

    res.json(restaurants);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/restaurants/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });

    const [restaurant] = await db
      .select()
      .from(restaurantsTable)
      .where(eq(restaurantsTable.id, id));

    if (!restaurant) return res.status(404).json({ error: "Not found" });

    res.json(restaurant);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/restaurants/:id/menu", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });

    const { category } = req.query as { category?: string };

    let items = await db
      .select()
      .from(menuItemsTable)
      .where(eq(menuItemsTable.restaurantId, id));

    if (category) {
      items = items.filter(
        (i) => i.category === category || i.categoryAr === category
      );
    }

    res.json(items);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
