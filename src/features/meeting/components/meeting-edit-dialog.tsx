"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { updateMeetingAction, type UpdateMeetingState } from "../actions";
import { MEETING_TITLE_MAX_LENGTH } from "../lib";

const INITIAL_STATE: UpdateMeetingState = { error: null, saved: null };

interface MeetingEditDialogProps {
  meetingId: string;
  currentTitle: string;
}

/**
 * 회의 수정(MEET-05) — 상세 머리글의 [회의 수정] 버튼이 연다.
 *
 * ⚠️ 트리거·노출 조건(host·SCHEDULED)은 `MeetingDetailView`가 정한다(`canEditMeeting`) —
 *    여기는 "지금 열렸는지"만 안다. `MeetingCancelDialog`·`MeetingAttendeesEditDialog`와 같은 자리 나눔이다.
 * ⚠️ **제목 한 칸이다.** 시간·회의실·프로젝트·녹음 동의도 BE는 받지만(MEET-05) 그쪽은 예약
 *    슬롯을 다시 잡는 일이라 회의실 예약 화면의 슬롯 피커가 있어야 한다 — 지금 여기 두면
 *    30분 그리드·운영시간·중복 검사 없이 보내 서버가 400·409로 되돌린다(§정직성, #419 후속).
 * ⚠️ 검증 오류는 **토스트가 아니라 필드 밑**이다(§토스트: 폼 검증 오류는 인라인). 성공만
 *    토스트로 알린다 — 창이 닫히므로 알릴 자리가 그것뿐이다.
 */
export function MeetingEditDialog({ meetingId, currentTitle }: MeetingEditDialogProps) {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(updateMeetingAction, INITIAL_STATE);
  const handled = useRef<UpdateMeetingState["saved"]>(null);

  useEffect(() => {
    if (state.saved && handled.current !== state.saved) {
      handled.current = state.saved;
      setOpen(false);
      toast.success("회의 정보를 수정했습니다");
    }
  }, [state.saved]);

  return (
    <>
      <Button type="button" variant="outline" onClick={() => setOpen(true)}>
        회의 수정
      </Button>

      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (!next && isPending) return;
          setOpen(next);
        }}
      >
        <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-[420px]">
          <DialogHeader className="border-border border-b px-6 py-4">
            <DialogTitle>회의 수정</DialogTitle>
          </DialogHeader>

          <form action={formAction}>
            <input type="hidden" name="meetingId" value={meetingId} />

            <div className="flex flex-col gap-2 px-6 py-5">
              <Label htmlFor="meeting-title">회의 제목</Label>
              {/*
                ⚠️ `key`로 현재 제목을 물린다 — 창을 닫았다 다시 열면 방금 취소한 입력이 아니라
                   **저장된 제목**에서 시작해야 한다(`defaultValue`는 다시 안 읽힌다).
                ⚠️ `maxLength`는 거들 뿐이다. 붙여넣기·IME로 넘어오는 값이 있어 검증은
                   `checkMeetingTitle`(서버 액션)이 하고, BE도 한 번 더 본다.
              */}
              <Input
                key={currentTitle}
                id="meeting-title"
                name="title"
                defaultValue={currentTitle}
                maxLength={MEETING_TITLE_MAX_LENGTH}
                required
                aria-describedby={state.error ? "meeting-title-error" : undefined}
                aria-invalid={state.error ? true : undefined}
              />
              {state.error && (
                <p id="meeting-title-error" className="text-destructive text-[12px] leading-4">
                  {state.error}
                </p>
              )}
              {/*
                ⚠️ 못 고치는 것을 적어 둔다. 「회의 수정」이라 열었는데 제목 한 칸만 있으면
                   시간·회의실은 어디서 바꾸는지 알 수 없다 — 없는 기능을 감추면 사람은
                   자기가 못 찾는 줄 안다(§정직성).
              */}
              <p className="text-muted-foreground text-[12px] leading-4">
                시간·회의실을 바꾸려면 회의를 취소하고 다시 예약해 주세요.
              </p>
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
