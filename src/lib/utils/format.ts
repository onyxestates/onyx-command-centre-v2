import { format, formatDistanceToNowStrict, isValid } from "date-fns";
import type { FirestoreTimestampLike } from "@/types/app";

export function toDate(value?: FirestoreTimestampLike | Date | string | null) {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === "string") {
    const parsed = new Date(value);
    return isValid(parsed) ? parsed : null;
  }
  if (typeof value.toDate === "function") return value.toDate();
  if (typeof value.seconds === "number") return new Date(value.seconds * 1000);
  return null;
}

export function formatDate(value?: FirestoreTimestampLike | Date | string | null, pattern = "dd MMM yyyy") {
  const date = toDate(value);
  return date ? format(date, pattern) : "—";
}

export function formatDateTime(value?: FirestoreTimestampLike | Date | string | null) {
  return formatDate(value, "dd MMM yyyy • HH:mm");
}

export function formatRelative(value?: FirestoreTimestampLike | Date | string | null) {
  const date = toDate(value);
  return date ? formatDistanceToNowStrict(date, { addSuffix: true }) : "—";
}

export function formatCurrency(amount = 0, currency = "GBP") {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);
}

export function formatPercent(value = 0) {
  return `${Math.round(value)}%`;
}
