"use client";

import { addDays, format, parseISO } from "date-fns";
import { useDateStore } from "@/store/dateStore";
import { formatDisplay, todayISO } from "@/lib/utils/date";

export function DateSelector() {
  const selectedDate = useDateStore((s) => s.selectedDate);
  const setSelectedDate = useDateStore((s) => s.setSelectedDate);

  function shiftDay(amount: number) {
    const next = addDays(parseISO(selectedDate), amount);
    setSelectedDate(format(next, "yyyy-MM-dd"));
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => shiftDay(-1)}
          aria-label="Previous day"
          className="grid h-8 w-8 place-items-center rounded-md border border-slate-300 text-slate-500 transition hover:bg-slate-100"
        >
          ‹
        </button>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
        />
        <button
          type="button"
          onClick={() => shiftDay(1)}
          aria-label="Next day"
          className="grid h-8 w-8 place-items-center rounded-md border border-slate-300 text-slate-500 transition hover:bg-slate-100"
        >
          ›
        </button>
      </div>
      {selectedDate !== todayISO() && (
        <button
          type="button"
          onClick={() => setSelectedDate(todayISO())}
          className="text-sm font-medium text-brand hover:underline"
        >
          Today
        </button>
      )}
      <span className="text-sm text-slate-500">{formatDisplay(selectedDate)}</span>
    </div>
  );
}
