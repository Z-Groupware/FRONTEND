"use client";

import { Video, X } from "lucide-react";
import type { FormEvent } from "react";
import { useCallback, useRef, useState } from "react";
import { useFormStatus } from "react-dom";

import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { FieldError } from "@/components/common/field-error";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { AttendeeScopeViewer } from "@/features/rooms/attendee-scope";
import { RoomAttendeePicker } from "@/features/rooms/components/room-attendee-picker";
import type { RoomMember, RoomProjectOption, RoomTeamActionOption } from "@/features/rooms/types";

import { OnlineMeetingFields } from "./online-meeting-fields";
import { PendingReporter } from "./online-meeting-shared";
import { OnlineMeetingStep2 } from "./online-meeting-step2";
import { useOnlineMeetingForm } from "./use-online-meeting-form";

interface OnlineMeetingDialogProps {
  members: RoomMember[];
  projects: RoomProjectOption[];
  showParentTeamAction: boolean;
  teamActions: RoomTeamActionOption[];
  viewer: AttendeeScopeViewer;
  /** 트리거 버튼에 얹을 클래스 — 회의실 패널(280px)에서는 폭을 꽉 채운다(`room-list-panel.tsx`). */
  triggerClassName?: string;
}

/**
 * 취소·확인 2단계 제출 버튼 — 1단계(비대면 회의 등록)가 쓴다. `useFormStatus`는 `<form>`의
 * 자손에서만 읽을 수 있다(`RoomReservationDialog`와 같은 이유).
 */
function ConfirmStepActions({
  onCancel,
  onRequestSubmit,
}: {
  onCancel: () => void;
  onRequestSubmit: () => void;
}) {
  const { pending } = useFormStatus();

  return (
    <div className="flex shrink-0 gap-2">
      <Button type="button" variant="outline" disabled={pending} onClick={onCancel}>
        취소
      </Button>
      <Button type="button" variant="ink" disabled={pending} onClick={onRequestSubmit}>
        {pending ? "등록 중" : "등록"}
      </Button>
    </div>
  );
}

interface OnlineMeetingStep1Props {
  members: RoomMember[];
  projects: RoomProjectOption[];
  showParentTeamAction: boolean;
  teamActions: RoomTeamActionOption[];
  viewer: AttendeeScopeViewer;
  onCreated: (meetingId: string) => void;
  onPendingChange: (pending: boolean) => void;
  onCancel: () => void;
}

/**
 * 1단계 — 제목·프로젝트·안건·참석자(회의실·시간 없음). 성공하면 회의가 그 자리에서 완료
 * 처리되고 `onCreated`로 부모에 알린다 — 여기서는 페이지 이동도, 창 닫기도 하지 않는다
 * (2026-08-14 팀 확정, `use-online-meeting-form.ts` 주석).
 */
function OnlineMeetingStep1({
  members,
  projects,
  showParentTeamAction,
  teamActions,
  viewer,
  onCreated,
  onPendingChange,
  onCancel,
}: OnlineMeetingStep1Props) {
  const { state, formAction, form, setForm } = useOnlineMeetingForm({ onCreated });
  const formRef = useRef<HTMLFormElement>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const confirmedSubmitRef = useRef(false);

  function handleFormSubmit(event: FormEvent<HTMLFormElement>) {
    if (confirmedSubmitRef.current) {
      confirmedSubmitRef.current = false;
      return;
    }
    event.preventDefault();
    setShowConfirm(true);
  }

  return (
    <>
      <form ref={formRef} action={formAction} onSubmit={handleFormSubmit}>
        <PendingReporter onChange={onPendingChange} />
        <input type="hidden" name="projectId" value={form.projectId} />
        <input type="hidden" name="parentTeamActionId" value={form.parentTeamActionId} />

        <div className="flex max-h-[70vh] flex-col gap-4 overflow-y-auto px-6 py-4">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-[1fr_260px]">
            <OnlineMeetingFields
              form={form}
              setForm={setForm}
              errors={state.errors}
              projects={projects}
              showParentTeamAction={showParentTeamAction}
              teamActions={teamActions}
            />

            <div className="flex flex-col gap-4">
              <RoomAttendeePicker
                members={members}
                selectedIds={form.attendeeIds}
                onChange={(attendeeIds) => setForm((prev) => ({ ...prev, attendeeIds }))}
                viewer={viewer}
              />
              <FieldError reserveSpace message={state.errors.attendeeIds} />
            </div>
          </div>
        </div>

        <div className="border-border flex items-center justify-end gap-4 border-t px-6 py-4">
          <ConfirmStepActions onCancel={onCancel} onRequestSubmit={() => setShowConfirm(true)} />
        </div>
      </form>

      <ConfirmDialog
        isOpen={showConfirm}
        onOpenChange={setShowConfirm}
        title="이대로 등록하시겠습니까?"
        description="등록하면 곧바로 회의가 완료 처리됩니다."
        confirmLabel="등록"
        onConfirm={() => {
          setShowConfirm(false);
          confirmedSubmitRef.current = true;
          formRef.current?.requestSubmit();
        }}
      />
    </>
  );
}

/**
 * 비대면 회의 만들기 — `/app/meeting` 목록의 진입점(이슈 #473). 2026-08-14 팀 확정으로 **2단계
 * 다이얼로그**가 됐다:
 *  1) 제목·프로젝트·안건·참석자를 받아 `POST /api/meetings/online`을 부른다(회의실·시간 없음).
 *  2) 같은 창에서 곧바로 녹음 파일 제출 + AI 요약 요청으로 넘어간다(페이지 이동 없음).
 * ⚠️ 회의는 1단계 성공 시점에 이미 완료 상태다 — 2단계는 선택이고, 건너뛰어도 회의는 남는다.
 */
export function OnlineMeetingDialog({
  members,
  projects,
  showParentTeamAction,
  teamActions,
  viewer,
  triggerClassName,
}: OnlineMeetingDialogProps) {
  const [open, setOpen] = useState(false);
  const [createdMeetingId, setCreatedMeetingId] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const handlePendingChange = useCallback((next: boolean) => setIsPending(next), []);

  function closeDialog() {
    setOpen(false);
    setCreatedMeetingId(null);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        // ⚠️ 제출 중엔 Esc·바깥 클릭 전부 막는다 — 요청은 계속 가는데 창만 사라지면 결과를
        //    못 본다(`RoomReservationDialog`와 같은 이유).
        if (!next && isPending) return;
        if (!next) setCreatedMeetingId(null);
        setOpen(next);
      }}
    >
      <DialogTrigger
        render={<Button type="button" variant="outline" size="sm" className={triggerClassName} />}
      >
        <Video aria-hidden />
        비대면 회의
      </DialogTrigger>

      {/*
        ⚠️ **닫기(X) 버튼을 헤더 안에 직접 그린다.** `DialogContent`의 기본 닫기 버튼은
           `p-4` 여백을 전제로 `top-2 right-2`에 절대 위치한다 — 이 다이얼로그는 `p-0`을 쓰고
           헤더가 직접 여백(`px-6 py-4`)을 잡아서, 기본값을 그대로 쓰면 버튼이 모서리 밖으로
           걸쳐 뜬다. `showCloseButton={false}`로 끄고 헤더 여백 안에 자연스럽게 배치한다.
      */}
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-[720px]" showCloseButton={false}>
        <DialogHeader className="border-border flex-row items-center justify-between border-b px-6 py-4">
          <DialogTitle>{createdMeetingId ? "녹음 파일 제출" : "비대면 회의 만들기"}</DialogTitle>
          <DialogClose
            disabled={isPending}
            render={<Button type="button" variant="ghost" size="icon-sm" />}
          >
            <X aria-hidden />
            <span className="sr-only">닫기</span>
          </DialogClose>
        </DialogHeader>

        {createdMeetingId ? (
          <OnlineMeetingStep2
            meetingId={createdMeetingId}
            onSubmitted={closeDialog}
            onPendingChange={handlePendingChange}
            onSkip={closeDialog}
          />
        ) : (
          <OnlineMeetingStep1
            members={members}
            projects={projects}
            showParentTeamAction={showParentTeamAction}
            teamActions={teamActions}
            viewer={viewer}
            onCreated={setCreatedMeetingId}
            onPendingChange={handlePendingChange}
            onCancel={() => setOpen(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
