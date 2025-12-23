/**
 * Formats a phone number into WhatsApp-compatible E.164 format
 * Default country: Kenya (+254)
 */
export function formatPhoneForWhatsApp(
  rawPhone?: string | null,
  countryCode = "254"
): string | null {
  if (!rawPhone) return null;

  // Trim & remove everything except digits and +
  let phone = rawPhone.trim().replace(/[^\d+]/g, "");

  // Remove leading +
  if (phone.startsWith("+")) {
    phone = phone.slice(1);
  }

  // Convert local Kenyan format (07xx / 01xx) → 2547xx / 2541xx
  if (/^0\d{9}$/.test(phone)) {
    phone = `${countryCode}${phone.slice(1)}`;
  }

  // Validate final Kenyan length (254 + 9 digits)
  if (!new RegExp(`^${countryCode}\\d{9}$`).test(phone)) {
    return null;
  }

  return phone;
}

/**
 * Generates a WhatsApp deep link with a prefilled message
 */
export function generateWhatsAppLink(
  phone?: string | null,
  message = ""
): string {
  const formattedPhone = formatPhoneForWhatsApp(phone);
  const encodedMessage = encodeURIComponent(message.trim());

  // Fallback: WhatsApp chat without a number
  if (!formattedPhone) {
    return encodedMessage
      ? `https://wa.me/?text=${encodedMessage}`
      : `https://wa.me/`;
  }

  return encodedMessage
    ? `https://wa.me/${formattedPhone}?text=${encodedMessage}`
    : `https://wa.me/${formattedPhone}`;
}
