"use client";

import { DateSelector } from "@/components/shared/DateSelector";
import { Board } from "@/components/tasks/Board";

export default function TasksPage() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-xl font-bold text-slate-900">Task Board</h1>
        <DateSelector />
      </div>
      <Board />
    </div>
  );
}
