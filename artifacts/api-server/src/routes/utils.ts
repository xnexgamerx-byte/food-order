import { Router } from "express";

const router = Router();

function extractCoordsFromText(text: string): { lat: number; lng: number } | null {
  const patterns = [
    /@(-?\d+\.\d+),(-?\d+\.\d+)/,
    /[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/,
    /[?&]ll=(-?\d+\.\d+),(-?\d+\.\d+)/,
    /\/place\/[^/]+\/@(-?\d+\.\d+),(-?\d+\.\d+)/,
    /!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/,
    /"lat"\s*:\s*(-?\d+\.\d+)\s*,\s*"lng"\s*:\s*(-?\d+\.\d+)/,
    /\blat\s*:\s*(-?\d+\.\d+)\s*,\s*lng\s*:\s*(-?\d+\.\d+)/,
    /\[\s*(-?\d{2,3}\.\d{4,})\s*,\s*(-?\d{2,3}\.\d{4,})\s*,/,
    /center=(-?\d+\.\d+)%2C(-?\d+\.\d+)/,
  ];
  for (const re of patterns) {
    const m = text.match(re);
    if (m) {
      const lat = parseFloat(m[1]);
      const lng = parseFloat(m[2]);
      if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        return { lat, lng };
      }
    }
  }
  return null;
}

router.get("/resolve-maps-url", async (req, res) => {
  const { url } = req.query as { url?: string };
  if (!url) return res.status(400).json({ error: "url is required" });

  const direct = extractCoordsFromText(url);
  if (direct) return res.json({ lat: direct.lat, lng: direct.lng });

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (Linux; Android 12; Pixel 6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "ar,en;q=0.5",
      },
    });
    clearTimeout(timeout);

    const finalUrl = response.url;

    const fromUrl = extractCoordsFromText(finalUrl);
    if (fromUrl) return res.json({ lat: fromUrl.lat, lng: fromUrl.lng });

    const html = await response.text();

    const fromHtml = extractCoordsFromText(html);
    if (fromHtml) return res.json({ lat: fromHtml.lat, lng: fromHtml.lng });

    // Try to find coordinates in the canonical URL inside the HTML
    const canonicalMatch = html.match(/rel="canonical"\s+href="([^"]+)"/);
    if (canonicalMatch) {
      const fromCanonical = extractCoordsFromText(canonicalMatch[1]);
      if (fromCanonical) return res.json({ lat: fromCanonical.lat, lng: fromCanonical.lng });
    }

    // Look for coordinates in window.APP_INITIALIZATION_STATE or similar
    const appStateMatch = html.match(/\[\s*null\s*,\s*null\s*,\s*(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)\s*\]/);
    if (appStateMatch) {
      return res.json({ lat: parseFloat(appStateMatch[1]), lng: parseFloat(appStateMatch[2]) });
    }

    // Look for place ID coordinates pattern embedded in Google Maps data
    const placeDataMatch = html.match(/place_id.*?(-?\d{2,3}\.\d{5,}).*?(-?\d{2,3}\.\d{5,})/s);
    if (placeDataMatch) {
      const lat = parseFloat(placeDataMatch[1]);
      const lng = parseFloat(placeDataMatch[2]);
      if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        return res.json({ lat, lng });
      }
    }

    req.log.warn({ finalUrl }, "Could not extract coordinates from resolved URL");
    return res.status(422).json({ error: "تعذّر استخراج الإحداثيات — الصق الرابط من شريط العنوان في المتصفح بدلاً من مشاركة الجوال" });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Failed to resolve URL" });
  }
});

export default router;
