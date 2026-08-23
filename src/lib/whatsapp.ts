// Utilidades para integración con WhatsApp (click-to-chat vía wa.me)

/**
 * Normaliza un teléfono a formato internacional sin '+' (para wa.me).
 * Por defecto asume prefijo español (+34) para números de 9 dígitos.
 * Devuelve null si el número no es válido.
 */
export function normalizePhoneForWhatsApp(phone: string, defaultCountryCode = "34"): string | null {
  const digits = (phone || "").replace(/\D/g, "");
  if (!digits) return null;
  // Formato 00XX... -> internacional
  if (digits.startsWith("00")) return digits.slice(2);
  // Número español de 9 dígitos (móvil 6/7, fijo 8/9)
  if (digits.length === 9) return `${defaultCountryCode}${digits}`;
  // Ya incluye prefijo internacional (más de 9 dígitos)
  if (digits.length >= 10 && digits.length <= 15) return digits;
  // Número corto asumible como nacional
  if (digits.length >= 6) return `${defaultCountryCode}${digits}`;
  return null;
}

export function buildWhatsAppUrl(phone: string, message?: string): string | null {
  const normalized = normalizePhoneForWhatsApp(phone);
  if (!normalized) return null;
  const params = new URLSearchParams({ phone: normalized });
  if (message) params.set("text", message);
  return `https://web.whatsapp.com/send?${params.toString()}`;
}

/** Abre WhatsApp en una pestaña nueva. Devuelve false si el teléfono no es válido. */
export function openWhatsApp(phone: string, message?: string): boolean {
  const url = buildWhatsAppUrl(phone, message);
  if (!url) return false;
  window.open(url, "_blank", "noopener,noreferrer");
  return true;
}

/** Saludo genérico para contactar con un cliente. */
export function clientGreetingMessage(clientName: string): string {
  return `Hola ${clientName}, te escribo de tu inmobiliaria. ¿Tienes un momento?`;
}

interface WhatsAppPropertyInfo {
  title: string;
  address?: string;
  price?: number;
  monthly_rent?: number;
  surface?: number;
  bedrooms?: number;
  operationType?: string;
}

/** Mensaje con la ficha resumida de una vivienda para enviar a un cliente. */
export function propertyShareMessage(clientName: string, property: WhatsAppPropertyInfo): string {
  const isRent = property.operationType === "alquiler" || property.operationType === "alquiler_opcion_compra";
  const priceText = isRent && property.monthly_rent
    ? `${property.monthly_rent.toLocaleString("es-ES")} €/mes`
    : property.price
      ? `${property.price.toLocaleString("es-ES")} €`
      : null;

  const lines = [
    `Hola ${clientName},`,
    ``,
    `Creemos que esta vivienda puede encajar con lo que buscas:`,
    `🏠 ${property.title}`,
    property.address ? `📍 ${property.address}` : null,
    priceText ? `💶 ${priceText}` : null,
    property.surface ? `📐 ${property.surface} m²` : null,
    property.bedrooms ? `🛏️ ${property.bedrooms} hab.` : null,
    ``,
    `¿Quieres más información o concertar una visita?`,
  ];

  return lines.filter((l): l is string => l !== null).join("\n");
}
