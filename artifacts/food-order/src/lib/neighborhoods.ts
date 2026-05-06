export interface Neighborhood {
  name: string;
  lat: number;
  lng: number;
}

export const NEIGHBORHOODS: Neighborhood[] = [
  { name: "تكريت",       lat: 34.5948, lng: 43.6939 },
  { name: "العوجة",      lat: 34.5292, lng: 43.7750 },
  { name: "العلم",       lat: 34.6678, lng: 43.7597 },
  { name: "السطة",       lat: 34.5500, lng: 43.6600 },
  { name: "الدور",       lat: 34.4461, lng: 43.6714 },
  { name: "بيجي",        lat: 34.9306, lng: 43.4861 },
  { name: "الشرقاط",    lat: 35.5218, lng: 43.2656 },
  { name: "سامراء",     lat: 34.1985, lng: 43.8742 },
  { name: "بلد",         lat: 33.9403, lng: 44.1469 },
  { name: "الضلوعية",   lat: 33.8617, lng: 44.2417 },
  { name: "الدجيل",     lat: 33.8500, lng: 44.2333 },
  { name: "المكيشيفة",  lat: 34.6200, lng: 43.7200 },
  { name: "طوزخرماتو", lat: 34.8800, lng: 44.6367 },
];

export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function calcDeliveryFee(
  restaurantLat: number | null | undefined,
  restaurantLng: number | null | undefined,
  pricePerKm: number,
  baseFee: number,
  neighborhoodName: string,
  maxDeliveryFee?: number | null,
): { fee: number; distanceKm: number | null } {
  if (!restaurantLat || !restaurantLng || pricePerKm <= 0) {
    const fee = maxDeliveryFee ? Math.min(baseFee, maxDeliveryFee) : baseFee;
    return { fee, distanceKm: null };
  }
  const hood = NEIGHBORHOODS.find((n) => n.name === neighborhoodName);
  if (!hood) {
    const fee = maxDeliveryFee ? Math.min(baseFee, maxDeliveryFee) : baseFee;
    return { fee, distanceKm: null };
  }

  const distanceKm = haversineKm(restaurantLat, restaurantLng, hood.lat, hood.lng);
  const rawFee = distanceKm * pricePerKm;
  // Round up to nearest 250 IQD, minimum baseFee
  const roundedFee = Math.ceil(rawFee / 250) * 250;
  let fee = Math.max(baseFee, roundedFee);
  // Cap at maxDeliveryFee if set
  if (maxDeliveryFee && maxDeliveryFee > 0) fee = Math.min(fee, maxDeliveryFee);
  return { fee, distanceKm: Math.round(distanceKm * 10) / 10 };
}
