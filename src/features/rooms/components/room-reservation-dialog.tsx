"use client";

import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { Bell } from "lucide-react";
import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

import { RESERVATION_DURATION_MINUTES } from "../constants";
import type {
  MeetingRoom,
  RoomMember,
  RoomProjectOption,
  RoomReservation,
  RoomTeamActionOption,
} from "../types";
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
  /** "상위 팀 액션" 필드를 보여줄지 — `page.tsx`(서버 컴포넌트)가 `requiresParentTeamAction`으로
   *  미리 계산해 내려준다. `lib/permission.ts`는 `server-only`라 이 클라이언트 컴포넌트에서
   *  직접 못 부른다. */
  showParentTeamAction: boolean;
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
 * 취소·제출 버튼 — `useFormStatus`는 `<form>`의 **자손** 컴포넌트에서만 호출할 수 있어서
 * `RoomReservationDialog`(그 `<form>`을 직접 그리는 컴포넌트) 안이 아니라 여기로 뺐다.
 */
function DialogActions({ onCancel }: { onCancel: () => void }) {
  const { pending } = useFormStatus();

  return (
    <div className="flex shrink-0 gap-2">
      <Button type="button" variant="outline" disabled={pending} onClick={onCancel}>
        취소
      </Button>
      <Button type="submit" variant="ink" disabled={pending}>
        {pending ? "예약 중" : "즉시 예약"}
      </Button>
    </div>
  );
}

/**
 * 회의실 예약 모달 — `/app/rooms` 예약이 유일한 회의 개설 진입점이다(CLAUDE.md §라우트 그룹).
 * 왼쪽 열(제목·회의실·프로젝트·상위 팀 액션·회의 주제)과 오른쪽 열(참석자)로 나눈 2단 레이아웃
 * (디자인 반영, 2026-08-07) — 좁은 화면에서는 1열로 쌓이고 `sm` 이상에서만 2열이 된다.
 * 폼 상태는 `useRoomReservationForm`, 왼쪽 열 필드는 `RoomReservationFields`로 뺐다
 * (CLAUDE.md §폴더·네이밍: 200줄↑ 분리·로직=커스텀훅) — 여기는 모달 뼈대만 조립한다.
 * ⚠️ **실제 `<form action={formAction}>`으로 제출한다.** `title`·회의 주제·참석자는 전부
 *    네이티브 입력(`name` 속성)이라 그대로 실리고, `roomId`·`projectId`·`parentTeamActionId`·
 *    `date`·`startTime`은 네이티브 입력이 아닌 값(위젯 상태·계산값)이라 hidden input으로
 *    따로 실어 보낸다.
 * ⚠️ 하단 알림 안내 문구는 **아직 실제로 안 보낸다** — SSE 알림 배너(WORKFLOW.md §9)는 별도
 *    이슈로 빠져 있다. 문구가 "아직 준비 중"이라고 정직하게 말하고, 실제 발송 연동은 그
 *    이슈에서 붙인다(CLAUDE.md §정직성).
 */
export function RoomReservationDialog({
  slotStart,
  onOpenChange,
  rooms,
  members,
  projects,
  showParentTeamAction,
  teamActions,
  onCreated,
}: RoomReservationDialogProps) {
  const { state, formAction, form, setForm, handleOpenChange } = useRoomReservationForm({
    slotStart,
    onCreated,
    onOpenChange,
  });

  return (
    <Dialog open={slotStart !== null} onOpenChange={handleOpenChange}>
      <DialogContent className="gap-0 p-0 sm:max-w-[720px]">
        <DialogHeader className="border-border border-b px-6 py-4">
          <DialogTitle>회의실 예약</DialogTitle>
        </DialogHeader>

        <form action={formAction}>
          <input
            type="hidden"
            name="date"
            value={slotStart ? format(slotStart, "yyyy-MM-dd") : ""}
          />
          <input
            type="hidden"
            name="startTime"
            value={slotStart ? format(slotStart, "HH:mm") : ""}
          />
          <input type="hidden" name="roomId" value={form.roomId} />
          <input type="hidden" name="projectId" value={form.projectId} />
          <input type="hidden" name="parentTeamActionId" value={form.parentTeamActionId} />

          <div className="flex max-h-[70vh] flex-col gap-4 overflow-y-auto px-6 py-4">
            {slotStart && <SlotSummary slotStart={slotStart} />}

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-[1fr_260px]">
              <RoomReservationFields
                form={form}
                setForm={setForm}
                errors={state.errors}
                rooms={rooms}
                projects={projects}
                showParentTeamAction={showParentTeamAction}
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
              예약 확정·시작 10분 전 알림 발송 기능은 아직 준비 중입니다.
            </p>
            <DialogActions onCancel={() => handleOpenChange(false)} />
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
