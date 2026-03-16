import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a currency value, auto-abbreviating large numbers.
 * e.g. 1,234,567.00 → $ 1.2M | 982,700.00 → $ 982.7K | 1,500.00 → $ 1,500.00
 */
export function formatCurrency(value: number, forceCompact = false): string {
  if (forceCompact || Math.abs(value) >= 1_000_000) {
    if (Math.abs(value) >= 1_000_000) return `$ ${(value / 1_000_000).toFixed(1)}M`;
    if (Math.abs(value) >= 100_000) return `$ ${(value / 1_000).toFixed(1)}K`;
  }
  return `$ ${value.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
}

/**
 * Smart currency: uses compact format on small screens, full on large.
 * Returns { compact, full } strings.
 */
export function formatCurrencySmart(value: number) {
  const full = `$ ${value.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
  let compact = full;
  if (Math.abs(value) >= 1_000_000) compact = `$ ${(value / 1_000_000).toFixed(1)}M`;
  else if (Math.abs(value) >= 100_000) compact = `$ ${(value / 1_000).toFixed(1)}K`;
  return { compact, full };
}
