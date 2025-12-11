export function formatPhoneForWhatsApp(rawPhone: string | null | undefined) {
  if (!rawPhone) return null;
  let phone = rawPhone.trim();
  // Remove spaces, dashes and parentheses
  phone = phone.replace(/[^\d\+]/g, "");
  // Remove leading + if present
  if (phone.startsWith("+")) phone = phone.slice(1);
  // If local Kenyan format starts with 0, convert to 254
  if (phone.startsWith("0")) phone = `254${phone.slice(1)}`;
  // If already starts with country code (e.g., 254...) leave as is
  return phone;
}

export function generateWhatsAppLink(phone: string | null | undefined, message: string) {
  const formatted = formatPhoneForWhatsApp(phone);
  const encoded = encodeURIComponent(message);
  if (!formatted) return `https://wa.me/?text=${encoded}`;
  return `https://wa.me/${formatted}?text=${encoded}`;
}
