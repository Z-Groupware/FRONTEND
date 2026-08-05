"use client";

import dynamic from "next/dynamic";
import type { ReactNode } from "react";

import { Skeleton } from "@/components/ui/skeleton";

import type { PersonalCalendarEvent } from "../types";

/** `react-big-calendar`는 무겁다 — 첫 로드 번들에서 뺀다(CLAUDE.md §최적화). */
const PersonalCalendar = dynamic(
  () => import("./personal-calendar").then((m) => m.PersonalCalendar),
  { ssr: false, loading: () => <Skeleton className="h-[calc(100vh-216px)] w-full rounded-lg" /> },
);

interface PersonalCalendarLoaderProps {
  events: PersonalCalendarEvent[];
  month: string;
  toolbarAction?: ReactNode;
  onSelectDate: (date: Date) => void;
}

export function PersonalCalendarLoader(props: PersonalCalendarLoaderProps) {
  return <PersonalCalendar {...props} />;
}
