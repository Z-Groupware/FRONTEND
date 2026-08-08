"use client";

import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { Bell } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";

import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { FieldError } from "@/components/common/field-error";

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
 * 제출 중인지를 **창**에 알린다.
 *
 * ⚠️ `useFormStatus`는 `<form>`의 **자손**에서만 부를 수 있어서, 그 `<form>`을 그리는
 *    컴포넌트가 직접 못 읽는다 — 자식으로 한 겹 내려와 렌더 없이 값만 올려 보낸다.
 * ⚠️ 버튼은 여기서 안 그린다. 창(`ConfirmDialog`)이 그리는 게 다른 모달과 같은 모양이다.
 */
interface PendingReporterProps {
  /** ⚠️ 참조가 고정돼야 한다 — 매 렌더 새 함수면 아래 effect가 매번 돈다 */
  onChange: (isPending: boolean) => void;
}

function PendingReporter({ onChange }: PendingReporterProps) {
  const { pending } = useFormStatus();

  useEffect(() => {
    onChange(pending);
  }, [pending, onChange]);

  return null;
}

/**
 * 회의실 예약 모달 — `/app/rooms` 예약이 유일한 회의 개설 진입점이다(CLAUDE.md §라우트 그룹).
 * ⚠️ **`ConfirmDialog`를 쓴다**(2026-08-08 정리). 전에는 720px 2단(왼쪽 입력 + 오른쪽 참석자)
 *    이었는데, 폼 창마다 폭이 갈려(420·480·640·720) 한 화면에서 창을 두 번 열면 상자가
 *    들썩였다 — 폭은 420 하나로 두고 **칸을 세로로 쌓는다.** 세로는 창이 알아서 스크롤한다.
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

  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, setIsPending] = useState(false);
  // ⚠️ `PendingReporter`의 effect 의존성이라 참조를 고정한다 — 안 그러면 매 렌더 다시 돈다
  const handlePendingChange = useCallback((next: boolean) => setIsPending(next), []);

  return (
    <ConfirmDialog
      isOpen={slotStart !== null}
      onOpenChange={(next) => {
        // 제출 중엔 Esc·바깥 클릭으로 안 닫는다 — 요청은 계속 가는데 화면만 사라진다
        if (!next && isPending) return;
        handleOpenChange(next);
      }}
      title="이 시간에 회의를 잡을까요?"
      description="예약하면 회의가 함께 만들어집니다."
      confirmLabel="예약"
      pendingLabel="예약 중"
      isPending={isPending}
      onConfirm={() => formRef.current?.requestSubmit()}
    >
      <form ref={formRef} action={formAction} className="text-left">
        <PendingReporter onChange={handlePendingChange} />
        <input type="hidden" name="date" value={slotStart ? format(slotStart, "yyyy-MM-dd") : ""} />
        <input type="hidden" name="startTime" value={slotStart ? format(slotStart, "HH:mm") : ""} />
        <input type="hidden" name="roomId" value={form.roomId} />
        <input type="hidden" name="projectId" value={form.projectId} />
        <input type="hidden" name="parentTeamActionId" value={form.parentTeamActionId} />

        {/*
          ⚠️ **한 열로 쌓는다.** 참석자 고르는 칸만 오른쪽에 떼어 두었었는데, 그러려면 창이
             720이어야 했다 — 참석자는 고르고 나면 칩으로 접히는 자리라 계속 곁에 둘 필요가 없다.
          ⚠️ 창 자체가 화면 높이에 맞춰 스크롤하므로 여기서 `max-h`를 따로 잡지 않는다.
        */}
        <div className="flex flex-col gap-4">
          {slotStart && <SlotSummary slotStart={slotStart} />}

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
            <FieldError reserveSpace message={state.errors.attendeeIds} />
          </div>

          <p className="text-muted-foreground flex items-start gap-1.5 text-[11px] leading-4 break-keep">
            <span className="flex h-4 shrink-0 items-center">
              <Bell className="size-3.5" aria-hidden />
            </span>
            예약 확정·시작 10분 전 알림 발송 기능은 아직 준비 중입니다.
          </p>
        </div>
      </form>
    </ConfirmDialog>
  );
}
