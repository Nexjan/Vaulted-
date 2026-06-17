// ─── CURRENCY FORMATTING & CONVERSION ─────────────────────────────────────────
// All price display in the app goes through formatPrice().
// All currency conversion goes through convertPrice().

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

// ─── STATIC EXCHANGE RATES ───────────────────────────────────────────────────
// Base currency: USD. Approximate rates as of 2026-06.
// INTEGRATION POINT: Replace with a live exchange-rate API call
// (e.g., Open Exchange Rates, ECB, Wise) — only this function needs updating.
const RATES_FROM_USD: Record<string, number> = {
  USD: 1.000,
  EUR: 0.925,
  GBP: 0.792,
  CAD: 1.362,
  AUD: 1.535,
  JPY: 149.50,
  SGD: 1.340,
  THB: 35.20,
  IDR: 15800,
  MXN: 17.15,
  BRL: 4.97,
  AED: 3.673,
  INR: 83.50,
  KRW: 1325,
  CHF: 0.895,
};

/**
 * Convert `amount` from one currency to another using the static rate table.
 * This is the single authoritative conversion function for the entire app.
 */
export function convertPrice(amount: number, from: string, to: string): number {
  if (from === to) return amount;
  const fromRate = RATES_FROM_USD[from] ?? 1;
  const toRate   = RATES_FROM_USD[to]   ?? 1;
  return (amount / fromRate) * toRate;
}

/**
 * Format a price for display.
 * - 2-arg form (existing callers): formatPrice(amount, currency)
 *   Shows the amount in its native currency — no conversion.
 * - 3-arg form (currency switcher): formatPrice(amount, fromCurrency, displayCurrency)
 *   Converts amount from fromCurrency → displayCurrency before rendering.
 */
export function formatPrice(amount: number, fromCurrency: string = 'USD', displayCurrency?: string): string {
  const target    = displayCurrency ?? fromCurrency;
  const converted = (displayCurrency && displayCurrency !== fromCurrency)
    ? convertPrice(amount, fromCurrency, displayCurrency)
    : amount;
  const symbol = CURRENCY_SYMBOLS[target] ?? `${target} `;
  return `${symbol}${Math.round(converted).toLocaleString()}`;
}
