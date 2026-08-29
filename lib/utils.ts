import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number | undefined | null): string {
  if (value === undefined || value === null || isNaN(value)) return "0";
  return new Intl.NumberFormat("ko-KR").format(value);
}

export function parseNumber(value: string | number | undefined | null): number {
  if (typeof value === "number") return isNaN(value) ? 0 : value;
  if (!value) return 0;
  const clean = value.toString().replace(/,/g, "").trim();
  const num = Number(clean);
  return isNaN(num) ? 0 : num;
}
