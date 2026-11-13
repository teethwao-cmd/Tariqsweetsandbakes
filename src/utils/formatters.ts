import type { Order, StoreSettings } from '../types.ts';

export function formatPKR(amount: number): string {
  const safe = Number.isFinite(amount) ? Math.round(amount) : 0;
  return `PKR ${safe.toLocaleString('en-PK')}`;
}

export function normalizeWhatsAppDigits(raw: string): string {
  const digits = raw.replace(/[^0-9]/g, '');
  if (digits.startsWith('03') && digits.length === 11) {
    return `92${digits.slice(1)}`;
  }
  return digits;
}

export function buildWhatsAppOrderMessage(order: Order, settings: StoreSettings): string {
  const lines: string[] = [
    `*${settings.brandName.toUpperCase()} — NEW ORDER*`,
    `Order Ref: *${order.orderNumber}*`,
    `Fulfillment: ${order.fulfillmentType}`,
    `Payment: ${order.paymentMethod}`,
    '',
    '*Customer Details*',
    `Name: ${order.customerName}`,
    `Phone: ${order.phone}`,
    order.fulfillmentType === 'Store Pickup'
      ? `Pickup Branch: ${settings.storeAddress}`
      : `Delivery Address: ${order.address}`,
  ];

  if (order.notes && order.notes.trim()) {
    lines.push(`Notes: ${order.notes.trim()}`);
  }

  lines.push('', '*Ordered Items*');
  order.items.forEach((item, index) => {
    lines.push(
      `${index + 1}. ${item.name} (${item.variantLabel}) x ${item.quantity} — ${formatPKR(item.unitPrice)} each = ${formatPKR(item.lineTotal)}`
    );
  });

  lines.push('', '*Bill Summary*');
  lines.push(`Subtotal: ${formatPKR(order.subtotal)}`);
  if (order.discountAmount > 0 && order.discountCode) {
    lines.push(`Discount (${order.discountCode}): -${formatPKR(order.discountAmount)}`);
  }
  lines.push(
    `Delivery Charges: ${
      order.fulfillmentType === 'Store Pickup'
        ? 'Store Pickup (PKR 0)'
        : order.deliveryFee === 0
        ? 'FREE'
        : formatPKR(order.deliveryFee)
    }`
  );
  lines.push(`*Total Bill: ${formatPKR(order.total)}*`);
  lines.push('', 'Please confirm my order. Thank you!');

  return lines.join('\n');
}

export function buildWhatsAppUrl(phoneNumber: string, message: string): string {
  const cleanDigits = normalizeWhatsAppDigits(phoneNumber);
  return `https://wa.me/${cleanDigits}?text=${encodeURIComponent(message)}`;
}
