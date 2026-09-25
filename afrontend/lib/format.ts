/**
 * Indian number & currency formatting utilities.
 *
 * Uses `Intl.NumberFormat('en-IN')` so digit grouping follows the
 * lakh/crore convention (₹12,34,567.89) rather than Western grouping.
 */

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const currencyFormatterDecimals = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const numberFormatter = new Intl.NumberFormat("en-IN");

/**
 * Format a number as Indian Rupees without decimals.
 * `formatINR(1234567)` → `"₹12,34,567"`
 */
export function formatINR(amount: number | string): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(num)) return "₹0";
  return currencyFormatter.format(num);
}

/**
 * Format a number as Indian Rupees with 2 decimal places.
 * `formatINRExact(1234567.5)` → `"₹12,34,567.50"`
 */
export function formatINRExact(amount: number | string): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(num)) return "₹0.00";
  return currencyFormatterDecimals.format(num);
}

/**
 * Format a number with Indian digit grouping (no currency symbol).
 * `formatNumber(1234567)` → `"12,34,567"`
 */
export function formatNumber(n: number | string): string {
  const num = typeof n === "string" ? parseFloat(n) : n;
  if (isNaN(num)) return "0";
  return numberFormatter.format(num);
}

/**
 * Compact Indian notation for large amounts.
 * `formatCompact(1500000)` → `"₹15L"`
 * `formatCompact(25000000)` → `"₹2.5Cr"`
 */
export function formatCompact(amount: number | string): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(num)) return "₹0";

  const abs = Math.abs(num);
  const sign = num < 0 ? "-" : "";

  if (abs >= 1_00_00_000) {
    const cr = abs / 1_00_00_000;
    return `${sign}₹${cr % 1 === 0 ? cr.toFixed(0) : cr.toFixed(1)}Cr`;
  }
  if (abs >= 1_00_000) {
    const lakh = abs / 1_00_000;
    return `${sign}₹${lakh % 1 === 0 ? lakh.toFixed(0) : lakh.toFixed(1)}L`;
  }
  if (abs >= 1_000) {
    const k = abs / 1_000;
    return `${sign}₹${k % 1 === 0 ? k.toFixed(0) : k.toFixed(1)}K`;
  }
  return `${sign}₹${abs}`;
}

/**
 * Format a percentage to one decimal place.
 * `formatPercent(0.55)` → `"55.0%"`
 */
export function formatPercent(ratio: number): string {
  return `${(ratio * 100).toFixed(1)}%`;
}
