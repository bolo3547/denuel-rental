function formatZambianPhone(phone: string): string {
  let cleaned = phone.replace(/[\s\-\(\)]/g, '').replace(/^\+/, '').replace(/^0/, '260');
  if (!cleaned.startsWith('260') && cleaned.length <= 10) {
    cleaned = '260' + cleaned;
  }
  return cleaned;
}

export function generateWhatsAppLink(phone: string, message: string): string {
  const formatted = formatZambianPhone(phone);
  return `https://wa.me/${formatted}?text=${encodeURIComponent(message)}`;
}

export function generatePropertyWhatsAppLink(
  phone: string,
  propertyTitle: string,
  propertyUrl?: string
): string {
  const message = `Hi, I'm interested in the property: "${propertyTitle}" on DENUEL Rental.${propertyUrl ? '\n\n' + propertyUrl : ''}\n\nCan you share more details?`;
  return generateWhatsAppLink(phone, message);
}

export function generateTransportWhatsAppLink(
  phone: string,
  fromLocation: string,
  toLocation: string
): string {
  const message = `Hi, I need transport from ${fromLocation} to ${toLocation}. Can you help?\n\nFound you on DENUEL Rental.`;
  return generateWhatsAppLink(phone, message);
}

export function generateServiceWhatsAppLink(
  phone: string,
  serviceName: string
): string {
  const message = `Hi, I'm interested in your service: "${serviceName}" listed on DENUEL Rental.\n\nCan we discuss details?`;
  return generateWhatsAppLink(phone, message);
}

export async function sendWhatsAppNotification(
  phone: string,
  message: string
): Promise<boolean> {
  const apiToken = process.env.WHATSAPP_API_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!apiToken || !phoneNumberId) {
    console.log(`[WHATSAPP-DEV] To: ${phone}`);
    console.log(`[WHATSAPP-DEV] Message: ${message}`);
    return false;
  }

  try {
    const formatted = formatZambianPhone(phone);
    const res = await fetch(
      `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: formatted,
          type: 'text',
          text: { body: message },
        }),
      }
    );
    return res.ok;
  } catch (error) {
    console.error('WhatsApp send error:', error);
    return false;
  }
}