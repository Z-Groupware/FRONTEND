"use client";

import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { Bell } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { Authority } from "@/constants/authority";

import type {
  MeetingRoom,
  RoomMember,
  RoomProjectOption,
  RoomReservation,
  RoomTeamActionOption,
} from "../types";
import { RESERVATION_DURATION_MINUTES } from "../validate";
import { RoomAttendeePicker } from "./room-attendee-picker";
import { RoomReservationFields } from "./room-reservation-fields";
import { useRoomReservationForm } from "./use-room-reservation-form";

interface RoomReservationDialogProps {
  /** 클릭한 30분 슬롯의 시작 시각 — null이면 닫힌 상태다. 날짜·시작 시각은 이 값으로 고정된다
   *  (30분 한 타임 고정, CLAUDE.md §브라우저 API — 모달에서 시간을 다시 고르지 않는다). */
  slotStart: Date | null;
  onOpenChange: (open: boolean) => void;
  rooms: MeetingRoom[];
  members: RoomMember[];
  projects: RoomProjectOption[];
  /** 지금 모달을 여는 사람의 권한 — Owner가 아니면 "상위 팀 액션" 필드가 뜬다(WORKFLOW.md §3-1). */
  hostAuthority: Authority;
  teamActions: RoomTeamActionOption[];
  /** 생성 성공 시 호출 — 재조회 없이 부모 화면에 바로 얹는다(§최적화: action 리턴값 그대로 반영). */
  onCreated: (created: RoomReservation) => void;
}

/** 상단 슬롯 요약 — 요일·날짜 / 시간대 / "30분 · 즉시 확정" 세 칸을 한 줄에 나눠 보여준다. */
function SlotSummary({ slotStart }: { slotStart: Date }) {
  const slotEnd = new Date(slotStart.getTime() + RESERVATION_DURATION_MINUTES * 60_000);

  return (
    <div className="border-border bg-secondary/50 flex items-center gap-3 rounded-lg border px-3.5 py-2.5 text-[13px]">
      <span className="font-medium">{format(slotStart, "EEE M/d", { locale: ko })}</span>
      <span className="text-border" aria-hidden>
        |
      </span>
      <span className="tabular-nums">
        {format(slotStart, "HH:mm")} - {format(slotEnd, "HH:mm")}
      </span>
      <span className="text-border" aria-hidden>
        |
      </span>
      <span className="text-muted-foreground">{RESERVATION_DURATION_MINUTES}분 · 즉시 확정</span>
    </div>
  );
}

/**
 * 회의실 예약 모달 — `/app/rooms` 예약이 유일한 회의 개설 진입점이다(CLAUDE.md §라우트 그룹).
 * 왼쪽 열(제목·회의실·프로젝트·상위 팀 액션·회의 주제)과 오른쪽 열(참석자)로 나눈 2단 레이아웃
 * (디자인 반영, 2026-08-07).
 * 폼 상태·제출 로직은 `useRoomReservationForm`, 왼쪽 열 필드는 `RoomReservationFields`로 뺐다
 * (CLAUDE.md §폴더·네이밍: 200줄↑ 분리·로직=커스텀훅) — 여기는 모달 뼈대만 조립한다.
 * ⚠️ 하단 알림 안내 문구는 **아직 실제로 안 보낸다** — SSE 알림 배너(WORKFLOW.md §9)는 별도
 *    이슈로 빠져 있다. 문구만 먼저 넣어 둔 것이고, 실제 발송 연동은 그 이슈에서 붙인다.
 */
export function RoomReservationDialog({
  slotStart,
  onOpenChange,
  rooms,
  members,
  projects,
  hostAuthority,
  teamActions,
  onCreated,
}: RoomReservationDialogProps) {
  const { state, isPending, form, setForm, handleOpenChange, handleSubmit } =
    useRoomReservationForm({ slotStart, onCreated, onOpenChange });

  return (
    <Dialog open={slotStart !== null} onOpenChange={handleOpenChange}>
      <DialogContent className="gap-0 p-0 sm:max-w-[720px]">
        <DialogHeader className="border-border border-b px-6 py-4">
          <DialogTitle>회의실 예약</DialogTitle>
        </DialogHeader>

        <div className="flex max-h-[70vh] flex-col gap-4 overflow-y-auto px-6 py-4">
          {slotStart && <SlotSummary slotStart={slotStart} />}

          <div className="grid grid-cols-[1fr_260px] gap-6">
            <RoomReservationFields
              form={form}
              setForm={setForm}
              errors={state.errors}
              rooms={rooms}
              projects={projects}
              hostAuthority={hostAuthority}
              teamActions={teamActions}
            />

            <div className="flex flex-col gap-1.5">
              <RoomAttendeePicker
                members={members}
                selectedIds={form.attendeeIds}
                onChange={(attendeeIds) => setForm((prev) => ({ ...prev, attendeeIds }))}
              />
              {state.errors.attendeeIds && (
                <p className="text-destructive text-xs">{state.errors.attendeeIds}</p>
              )}
            </div>
          </div>
        </div>

        <div className="border-border flex items-center justify-between gap-4 border-t px-6 py-4">
          <p className="text-muted-foreground flex min-w-0 items-center gap-1.5 text-[11px] break-keep">
            <Bell className="size-3.5 shrink-0" aria-hidden />
            예약 확정 시 + 시작 10분 전, 참석자에게 알림이 발송됩니다.
          </p>
          <div className="flex shrink-0 gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
              onClick={() => handleOpenChange(false)}
            >
              취소
            </Button>
            <Button type="button" variant="ink" disabled={isPending} onClick={handleSubmit}>
              {isPending ? "예약 중" : "즉시 예약"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
