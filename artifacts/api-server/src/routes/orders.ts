import { Router } from "express";
import { db } from "@workspace/db";
import { ordersTable, restaurantsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { CreateOrderBody } from "@workspace/api-zod";

const router = Router();

router.get("/orders/by-phone/:phone", async (req, res) => {
  try {
    const phone = String(req.params["phone"] || "").trim();
    if (!phone) {
      res.status(400).json({ error: "phone is required" }); return;
    }
    const rows = await db
      .select()
      .from(ordersTable)
      .where(eq(ordersTable.customerPhone, phone))
      .orderBy(desc(ordersTable.createdAt));
    const parsed = rows.map((o) => ({
      ...o,
      items: (() => {
        try { return JSON.parse(o.items); } catch { return []; }
      })(),
    }));
    res.json(parsed);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/orders", async (req, res) => {
  try {
    const parsed = CreateOrderBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid request body", details: parsed.error }); return;
    }

    const body = parsed.data;

    const [restaurant] = await db
      .select()
      .from(restaurantsTable)
      .where(eq(restaurantsTable.id, body.restaurantId));

    if (!restaurant) {
      res.status(404).json({ error: "Restaurant not found" }); return;
    }

    const orderNumber = `#${Math.floor(1000 + Math.random() * 9000)}`;

    // Build WhatsApp message
    const itemLines = body.items
      .map((item) => `• ${item.nameAr} × ${item.quantity} — ${(item.price * item.quantity).toLocaleString()} د.ع`)
      .join("\n");

    const whatsappMessage = encodeURIComponent(
      `🛒 *طلب جديد ${orderNumber}*\n\n` +
      `👤 *اسم العميل:* ${body.customerName}\n` +
      `📞 *الهاتف:* ${body.customerPhone}\n` +
      `🍽️ *المطعم:* ${restaurant.nameAr}\n\n` +
      `*الطلبات:*\n${itemLines}\n\n` +
      `💰 *المجموع:* ${body.total.toLocaleString()} د.ع\n` +
      `📍 *العنوان:* ${body.address}${body.neighborhood ? ` - ${body.neighborhood}` : ""}\n` +
      (body.notes ? `📝 *ملاحظات:* ${body.notes}\n` : "") +
      `\n⏰ الوقت: ${new Date().toLocaleString("ar-IQ", { timeZone: "Asia/Baghdad" })}`
    );

    const whatsappNumber = restaurant.whatsapp || restaurant.phone;
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`;

    const [order] = await db
      .insert(ordersTable)
      .values({
        orderNumber,
        customerName: body.customerName,
        customerPhone: body.customerPhone,
        restaurantId: body.restaurantId,
        restaurantName: restaurant.nameAr,
        items: JSON.stringify(body.items),
        address: body.address,
        neighborhood: body.neighborhood || "",
        notes: body.notes || "",
        total: body.total,
        status: "pending",
        whatsappUrl,
      })
      .returning();

    res.status(201).json({
      ...order,
      items: body.items,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
