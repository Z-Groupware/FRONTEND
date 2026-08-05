import { format } from "date-fns";
import type { Metadata } from "next";

import { PersonalCalendarLoader } from "@/features/calendar/components/personal-calendar-loader";
import { getMonthEvents } from "@/features/calendar/server";

export const metadata: Metadata = {
  title: "캘린더",
};

const MONTH_PARAM_PATTERN = /^\d{4}-\d{2}$/;

function parseMonthParam(raw: string | undefined): Date {
  if (raw && MONTH_PARAM_PATTERN.test(raw)) {
    const [yearPart, monthPart] = raw.split("-");
    return new Date(Number(yearPart), Number(monthPart) - 1, 1);
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
    <main className="min-h-0 flex-1 overflow-y-auto p-6">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-4">
        <PersonalCalendarLoader events={events} month={format(month, "yyyy-MM")} />
      </div>
    </main>
  );
}
