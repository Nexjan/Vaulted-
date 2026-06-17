// ─── CURRENCY FORMATTING ──────────────────────────────────────────────────────
// All price display in the app should go through formatPrice() rather than
// hardcoding "$". Listings carry an ISO 4217 currency field; this function
// maps it to the correct symbol.
//
// MULTI-CURRENCY INTEGRATION POINT ▼
// To support user-selected display currency or real-time conversion:
//   1. Add a `targetCurrency` param and an `exchangeRate` (or fetch from a rates
//      provider such as Open Exchange Rates, ECB, or Wise).
//   2. Multiply `amount` by the rate before formatting.
//   3. Swap `currency` → `targetCurrency` in the symbol lookup.
//   e.g. formatPrice(listing.pricePerNight, listing.currency, userCurrency, rates)
// ─────────────────────────────────────────────────────────────────────────────

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  AUD: 'A$',
  CAD: 'C$',
  SGD: 'S$',
  THB: '฿',
  IDR: 'Rp ',
  MXN: 'MX$',
  BRL: 'R$',
  AED: 'د.إ ',
  INR: '₹',
  KRW: '₩',
  CHF: 'Fr ',
};

/** Returns a formatted price string using the listing's own currency symbol. */
export function formatPrice(amount: number, currency: string = 'USD'): string {
  const symbol = CURRENCY_SYMBOLS[currency] ?? `${currency} `;
  return `${symbol}${Math.round(amount).toLocaleString()}`;
}
