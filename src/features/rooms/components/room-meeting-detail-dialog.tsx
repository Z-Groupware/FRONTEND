"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getMeetingSummaryAction,
  type MeetingSummary,
  updateMeetingAction,
  type UpdateMeetingState,
} from "@/features/meeting/actions";
import { MeetingCancelDialog } from "@/features/meeting/components/meeting-cancel-dialog";
import { MEETING_TITLE_MAX_LENGTH } from "@/features/meeting/lib";
import { canCancelMeeting, canEditMeeting } from "@/features/meeting/status";

const INITIAL_STATE: UpdateMeetingState = { error: null, saved: null };

type LoadState =
  | { status: "loading" }
  | { status: "ok"; summary: MeetingSummary }
  | { status: "locked"; title: string | null }
  | { status: "notFound" }
  | { status: "error" };

interface RoomMeetingDetailDialogProps {
  /** `null`이면 닫힌 상태 — 캘린더에서 예약 막대를 클릭하면 그 회의 id가 들어온다. */
  meetingId: string | null;
  onOpenChange: (open: boolean) => void;
  /** 제목 수정이 저장되면 캘린더 막대도 같이 바꾸라고 올려보낸다(재조회 없이 비관적 갱신). */
  onTitleUpdated: (meetingId: string, title: string) => void;
  /** 회의 취소가 성공하면 캘린더 막대를 지우라고 올려보낸다(§최적화: action 리턴값으로 화면 반영). */
  onCancelled: (meetingId: string) => void;
}

/**
 * 회의실 캘린더에서 **이미 있는 예약**을 클릭했을 때 뜨는 모달 — 조회가 기본이고, 개설자면
 * [수정] 버튼으로 같은 모달 안에서 인풋으로 바뀐다(2026-08-14 팀 확정).
 *
 * ⚠️ **예전엔 이 자리에 예약 생성 모달이 그대로 떴다** — 이미 있는 회의를 클릭해도 "새로
 *    예약하기" 폼이 열려 값이 비어 있었다(예외처리 누락, 별도 버그로 확인). `WeeklyRoomCalendar`가
 *    이제 `onSelectEvent`로 이 모달을 열고, 빈 칸 클릭(`onSelectSlot`)과 갈라 둔다.
 * ⚠️ **고칠 수 있는 건 제목뿐이다.** BE(MEET-05)는 시간·회의실도 받지만, 그건 예약 슬롯을
 *    다시 잡는 일이라 슬롯 피커·회의실 피커가 있어야 한다 — `MeetingEditDialog`(#436)는 그
 *    피커들을 넣을 자리가 있는 큰 폼이지만, 이 창은 캘린더 막대를 눌러 여는 420px 짜리 조회
 *    겸 수정 창이라 그 폼을 통째로 넣을 자리가 없다. 시간·회의실을 바꾸려면 상세 페이지의
 *    [회의 수정]을 쓴다 — 조회해 온 나머지 값(일정·회의실·참석자)은 수정 모드에서도 그대로
 *    텍스트로만 보여준다, 없는 기능을 감추지 않는다(§정직성).
 * ⚠️ `canEditMeeting`(host && SCHEDULED)이 아니면 [수정] 버튼 자체가 없다 — 화면 숨김은 UX일
 *    뿐이고, 실제 방어는 `updateMeetingAction`(서버)이 다시 한다(§권한).
 * ⚠️ 조회·수정 상태는 `MeetingSummaryPanel`을 `key={meetingId}`로 물려 초기화한다 — 이펙트
 *    안에서 직접 `setState`로 되돌리지 않는다(react-hooks/set-state-in-effect, §린트).
 */
export function RoomMeetingDetailDialog({
  meetingId,
  onOpenChange,
  onTitleUpdated,
  onCancelled,
}: RoomMeetingDetailDialogProps) {
  return (
    <Dialog open={meetingId !== null} onOpenChange={(next) => !next && onOpenChange(false)}>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-[420px]">
        <DialogHeader className="border-border border-b px-6 py-4">
          <DialogTitle>회의 상세</DialogTitle>
        </DialogHeader>

        {meetingId && (
          <MeetingSummaryPanel
            key={meetingId}
            meetingId={meetingId}
            onClose={() => onOpenChange(false)}
            onTitleUpdated={onTitleUpdated}
            onCancelled={onCancelled}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

interface MeetingSummaryPanelProps {
  meetingId: string;
  onClose: () => void;
  onTitleUpdated: (meetingId: string, title: string) => void;
  onCancelled: (meetingId: string) => void;
}

function MeetingSummaryPanel({
  meetingId,
  onClose,
  onTitleUpdated,
  onCancelled,
}: MeetingSummaryPanelProps) {
  const [load, setLoad] = useState<LoadState>({ status: "loading" });
  const [editing, setEditing] = useState(false);
  const [state, formAction, isPending] = useActionState(updateMeetingAction, INITIAL_STATE);
  const handledSave = useRef<UpdateMeetingState["saved"]>(null);

  /*
    ⚠️ **`.catch()`가 반드시 있어야 한다**(CodeRabbit 지적, PR #547) — 없으면 요청이 거부됐을
       때(네트워크 오류 등) `.then()` 콜백이 아예 안 돌아 `load`가 영원히 `"loading"`에 멈춘다.
       스켈레톤이 계속 떠 있어서 사용자는 뭐가 잘못됐는지도 모른다(§정직성 위반).
  */
  useEffect(() => {
    let canceled = false;
    getMeetingSummaryAction(meetingId)
      .then((result) => {
        if (canceled) return;
        if (result.kind === "ok") setLoad({ status: "ok", summary: result.summary });
        else if (result.kind === "locked") setLoad({ status: "locked", title: result.title });
        else setLoad({ status: "notFound" });
      })
      .catch(() => {
        if (!canceled) setLoad({ status: "error" });
      });
    return () => {
      canceled = true;
    };
  }, [meetingId]);

  useEffect(() => {
    if (state.saved && handledSave.current !== state.saved && load.status === "ok") {
      handledSave.current = state.saved;
      const title = state.saved.title;
      setLoad({ status: "ok", summary: { ...load.summary, title } });
      setEditing(false);
      onTitleUpdated(meetingId, title);
      toast.success("회의 정보를 수정했습니다");
    }
  }, [state.saved, load, meetingId, onTitleUpdated]);

  if (load.status === "loading") {
    return (
      <div className="flex flex-col gap-3 px-6 py-5">
        <Skeleton className="h-5 w-2/3" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-4 w-1/3" />
      </div>
    );
  }

  if (load.status === "notFound") {
    return (
      <p className="text-muted-foreground px-6 py-5 text-[13px] leading-5">
        회의를 찾을 수 없습니다.
      </p>
    );
  }

  if (load.status === "error") {
    return (
      <p className="text-muted-foreground px-6 py-5 text-[13px] leading-5">
        회의 정보를 불러오지 못했습니다 — 잠시 후 다시 시도해 주세요.
      </p>
    );
  }

  if (load.status === "locked") {
    return (
      <p className="text-muted-foreground px-6 py-5 text-[13px] leading-5">
        참석자만 열람 가능합니다.
      </p>
    );
  }

  if (editing) {
    return (
      <form action={formAction}>
        <input type="hidden" name="meetingId" value={meetingId} />

        <div className="flex flex-col gap-2 px-6 py-5">
          <Label htmlFor="room-meeting-title">회의 제목</Label>
          <Input
            key={load.summary.title}
            id="room-meeting-title"
            name="title"
            defaultValue={load.summary.title}
            maxLength={MEETING_TITLE_MAX_LENGTH}
            required
            aria-describedby={state.error ? "room-meeting-title-error" : undefined}
            aria-invalid={state.error ? true : undefined}
          />
          {state.error && (
            <p id="room-meeting-title-error" className="text-destructive text-[12px] leading-4">
              {state.error}
            </p>
          )}
          <p className="text-muted-foreground text-[12px] leading-4">
            시간·회의실을 바꾸려면 회의를 취소하고 다시 예약해 주세요.
          </p>
        </div>

        <div className="border-border flex items-center justify-end gap-2 border-t px-6 py-4">
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            onClick={() => setEditing(false)}
          >
            취소
          </Button>
          <Button type="submit" variant="ink" disabled={isPending}>
            {isPending ? "저장 중" : "저장"}
          </Button>
        </div>
      </form>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-3 px-6 py-5">
        <div>
          <p className="text-muted-foreground text-[12px] leading-4">제목</p>
          <p className="text-[14px] leading-5">{load.summary.title}</p>
        </div>
        <div>
          <p className="text-muted-foreground text-[12px] leading-4">일정</p>
          <p className="text-[14px] leading-5">{load.summary.schedule}</p>
        </div>
        <div>
          <p className="text-muted-foreground text-[12px] leading-4">회의실</p>
          <p className="text-[14px] leading-5">{load.summary.roomName}</p>
        </div>
        {load.summary.agenda && (
          <div>
            <p className="text-muted-foreground text-[12px] leading-4">안건</p>
            <p className="text-[14px] leading-5">
              {load.summary.agenda.main}
              {load.summary.agenda.subs.length > 0 && ` · ${load.summary.agenda.subs.join(", ")}`}
            </p>
          </div>
        )}
        <div>
          <p className="text-muted-foreground text-[12px] leading-4">참석자</p>
          <p className="text-[14px] leading-5">
            {load.summary.attendees.map((attendee) => attendee.name).join(", ")}
          </p>
        </div>
      </div>

      <div className="border-border flex items-center justify-end gap-2 border-t px-6 py-4">
        {canCancelMeeting({
          isHost: load.summary.isHost,
          pendingReason: load.summary.pendingReason,
        }) && (
          <MeetingCancelDialog
            meetingId={meetingId}
            onCancelled={() => {
              onCancelled(meetingId);
              onClose();
            }}
          />
        )}
        {canEditMeeting({
          isHost: load.summary.isHost,
          pendingReason: load.summary.pendingReason,
        }) && (
          <Button type="button" variant="outline" onClick={() => setEditing(true)}>
            수정
          </Button>
        )}
        <Button type="button" variant="ink" onClick={onClose}>
          닫기
        </Button>
      </div>
    </>
  );
}
