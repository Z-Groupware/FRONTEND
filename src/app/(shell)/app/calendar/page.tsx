import { format } from "date-fns";
import type { Metadata } from "next";

import { CalendarBoard } from "@/features/calendar/components/calendar-board";
import { getMonthEvents } from "@/features/calendar/server";

export const metadata: Metadata = {
  title: "캘린더",
};

const MONTH_PARAM_PATTERN = /^\d{4}-\d{2}$/;

function parseMonthParam(raw: string | undefined): Date {
  if (raw && MONTH_PARAM_PATTERN.test(raw)) {
    const [yearPart, monthPart] = raw.split("-");
    const month = Number(monthPart);
    if (month >= 1 && month <= 12) {
      return new Date(Number(yearPart), month - 1, 1);
    }
  }
  return new Date();
}

interface CalendarPageProps {
  searchParams: Promise<{ month?: string }>;
}

export default async function CalendarPage({ searchParams }: CalendarPageProps) {
  const { month: monthParam } = await searchParams;
  const month = parseMonthParam(monthParam);
  const events = await getMonthEvents(month);

  return (
    <main className="min-h-0 flex-1 overflow-y-auto px-8 py-7">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-4">
        <CalendarBoard
          key={format(month, "yyyy-MM")}
          initialEvents={events}
          month={format(month, "yyyy-MM")}
        />
      </div>
    </main>
  );
}
