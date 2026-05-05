export const SUPPORT_PHONE = "9647821989856";

export const SUPPORT_WHATSAPP_DEFAULT_MESSAGE =
  "مرحباً، أحتاج مساعدة بخصوص منصة الطلب";

export function supportWhatsAppUrl(message: string = SUPPORT_WHATSAPP_DEFAULT_MESSAGE) {
  return `https://wa.me/${SUPPORT_PHONE}?text=${encodeURIComponent(message)}`;
}
