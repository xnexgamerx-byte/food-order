import { Router } from "express";
import { db } from "@workspace/db";
import { restaurantsTable, menuItemsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

router.get("/featured", async (req, res) => {
  try {
    const allRestaurants = await db.select().from(restaurantsTable);
    const featuredRestaurants = allRestaurants
      .filter((r) => r.isOpen)
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 6);

    const popularItems = await db
      .select()
      .from(menuItemsTable)
      .where(eq(menuItemsTable.isAvailable, true))
      .limit(8);

    res.json({ featuredRestaurants, popularItems });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
