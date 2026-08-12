"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RoomAttendeePicker } from "@/features/rooms/components/room-attendee-picker";
import type { RoomMember } from "@/features/rooms/types";

import { updateMeetingAttendeesAction } from "../actions";

const INITIAL_STATE = { error: null, attendeeIds: null } as const;

interface MeetingAttendeesEditDialogProps {
  meetingId: string;
  currentAttendeeIds: number[];
  members: RoomMember[];
  /** "내 부서만"·"팀장급만" 필터 기준 — `RoomAttendeePicker`로 그대로 흘려보낸다. */
  viewerTeamName: string | null;
}

/**
 * 참석자 명단 교체(MEET-09) — 회의 상세에서 host가 여는 다이얼로그.
 * ⚠️ **WORKFLOW.md §3-2에 새로 추가된 화면이다**(2026-08-12 사용자 확정) — 예약 시 참석자를
 *    고르는 `RoomAttendeePicker`를 그대로 재사용한다(중복 컴포넌트를 새로 안 만든다).
 * ⚠️ 트리거·노출 조건(host·SCHEDULED/IN_PROGRESS)은 `MeetingDetailView`가 정한다 — 이 컴포넌트는
 *    "지금 열렸는지"만 안다.
 */
export function MeetingAttendeesEditDialog({
  meetingId,
  currentAttendeeIds,
  members,
  viewerTeamName,
}: MeetingAttendeesEditDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState(currentAttendeeIds);
  const [state, formAction, isPending] = useActionState(
    updateMeetingAttendeesAction,
    INITIAL_STATE,
  );
  const handledAt = useRef<number>(0);

  useEffect(() => {
    if (state.attendeeIds && handledAt.current !== state.attendeeIds.length) {
      handledAt.current = state.attendeeIds.length;
      setOpen(false);
      toast.success("참석자 명단을 바꿨습니다");
    }
  }, [state.attendeeIds]);

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setSelectedIds(currentAttendeeIds);
          setOpen(true);
        }}
        className="text-muted-foreground hover:text-foreground focus-visible:ring-ring rounded-md text-[12px] leading-4 underline underline-offset-2 transition-colors focus-visible:ring-2 focus-visible:outline-hidden"
      >
        참석자 수정
      </button>

      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (!next && isPending) return;
          setOpen(next);
        }}
      >
        <DialogContent className="gap-0 p-0 sm:max-w-[420px]">
          <DialogHeader className="border-border border-b px-6 py-4">
            <DialogTitle>참석자 수정</DialogTitle>
          </DialogHeader>

          <form action={formAction}>
            <input type="hidden" name="meetingId" value={meetingId} />

            <div className="flex h-[360px] flex-col px-6 py-4">
              <RoomAttendeePicker
                members={members}
                selectedIds={selectedIds}
                onChange={setSelectedIds}
                viewerTeamName={viewerTeamName}
              />
              {state.error && <p className="text-destructive pt-2 text-[12px]">{state.error}</p>}
            </div>

            <div className="border-border flex items-center justify-end gap-2 border-t px-6 py-4">
              <Button
                type="button"
                variant="outline"
                disabled={isPending}
                onClick={() => setOpen(false)}
              >
                취소
              </Button>
              <Button type="submit" variant="ink" disabled={isPending}>
                {isPending ? "저장 중" : "저장"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
