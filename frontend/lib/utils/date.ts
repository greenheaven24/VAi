import { format, parseISO } from "date-fns";

export function todayISO(): string {
  return format(new Date(), "yyyy-MM-dd");
}

export function formatDisplay(isoDate: string): string {
  return format(parseISO(isoDate), "EEEE, MMM d, yyyy");
}
