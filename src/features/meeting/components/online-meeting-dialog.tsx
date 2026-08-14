"use client";

import { Paperclip, Video, X } from "lucide-react";
import type { ChangeEvent, FormEvent } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
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

import { RECORDING_FILE_ACCEPTED_EXTENSIONS, validateRecordingFile } from "../recording-file";
import { OnlineMeetingFields } from "./online-meeting-fields";
import { useOnlineMeetingForm } from "./use-online-meeting-form";
import { useOnlineMeetingRecordingForm } from "./use-online-meeting-recording-form";

/** 파일 피커의 `accept` 속성 — 확장자 앞에 점을 붙인다. 실제 차단은 `validateRecordingFile`이 한다. */
const RECORDING_FILE_ACCEPT = RECORDING_FILE_ACCEPTED_EXTENSIONS.map((ext) => `.${ext}`).join(",");

interface OnlineMeetingDialogProps {
  members: RoomMember[];
  projects: RoomProjectOption[];
  showParentTeamAction: boolean;
  teamActions: RoomTeamActionOption[];
  viewer: AttendeeScopeViewer;
}

/** 제출 중인지를 창에 올려 보낸다 — `RoomReservationDialog`의 `PendingReporter`와 같다. */
function PendingReporter({ onChange }: { onChange: (pending: boolean) => void }) {
  const { pending } = useFormStatus();

  useEffect(() => {
    onChange(pending);
  }, [pending, onChange]);

  return null;
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

/**
 * 건너뛰기·바로 제출 버튼 — 2단계(녹음 제출)가 쓴다. 확인 모달을 안 거친다 — 회의는 이미
 * 완료 상태로 존재해서 이 제출은 되돌릴 게 없는 부가 조작이다(§토스트: 파괴적 작업만 Dialog).
 */
function SkipOrSubmitActions({ onSkip }: { onSkip: () => void }) {
  const { pending } = useFormStatus();

  return (
    <div className="flex shrink-0 gap-2">
      <Button type="button" variant="outline" disabled={pending} onClick={onSkip}>
        나중에 하기
      </Button>
      <Button type="submit" variant="ink" disabled={pending}>
        {pending ? "요청 중" : "AI 요약 요청"}
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

interface OnlineMeetingStep2Props {
  meetingId: string;
  onSubmitted: () => void;
  onPendingChange: (pending: boolean) => void;
  onSkip: () => void;
}

/**
 * 2단계 — 녹음 파일 제출 + AI 요약 요청(2026-08-14 팀 확정). 회의는 1단계에서 이미 완료
 * 상태로 만들어져 있어 이 단계는 **선택**이다 — [나중에 하기]로 건너뛰어도 회의는 그대로 남는다.
 * ⚠️ **첨부는 실제 업로드가 아니다**(§정직한 목업) — 파일 이름만 hidden input으로 싣는다.
 * ⚠️ 실서버(`!isMock`)에서는 서버 액션이 "곧 지원됩니다" 오류를 그대로 돌려준다 — 컴포넌트가
 *    `isMock`을 직접 알면 안 된다(§Mock 격리막)는 규칙 그대로라, 여기서 따로 분기하지 않고
 *    `state.error`를 그대로 보여준다.
 */
function OnlineMeetingStep2({
  meetingId,
  onSubmitted,
  onPendingChange,
  onSkip,
}: OnlineMeetingStep2Props) {
  const { state, formAction, recordingFileName, setRecordingFileName } =
    useOnlineMeetingRecordingForm({ meetingId, onSubmitted });
  const fileInputRef = useRef<HTMLInputElement>(null);
  // ⚠️ 형식·용량은 여기서 1차로만 거른다 — 최종 검증은 서버 몫이다(§권한: 화면 검증은
  //    보안이 아니다). 서버 오류(`state.error`)와 자리가 같아 파일을 다시 고르면 없어진다.
  const [fileError, setFileError] = useState<string | null>(null);

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    if (!file) {
      setFileError(null);
      setRecordingFileName(null);
      return;
    }

    const error = validateRecordingFile(file);
    if (error) {
      setFileError(error);
      setRecordingFileName(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setFileError(null);
    setRecordingFileName(file.name);
  }

  function clearFile() {
    setFileError(null);
    setRecordingFileName(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  return (
    <form action={formAction}>
      <PendingReporter onChange={onPendingChange} />
      <input type="hidden" name="meetingId" value={meetingId} />
      <input type="hidden" name="recordingFileName" value={recordingFileName ?? ""} />

      <div className="flex flex-col gap-4 px-6 py-4">
        <p className="text-muted-foreground text-[13px] leading-5">
          녹음 파일을 제출해 주세요. 제출 없이도 회의는 이미 완료 처리돼 있습니다.
        </p>

        <div className="flex flex-col gap-1.5">
          <span id="online-meeting-recording-label" className="text-[13px] leading-5 font-medium">
            녹음 파일 첨부 (선택)
          </span>
          {/* ⚠️ 바이너리는 안 보낸다 — 파일명만 읽어 hidden input으로 싣는다(위 주석). */}
          <input
            ref={fileInputRef}
            type="file"
            accept={RECORDING_FILE_ACCEPT}
            className="hidden"
            onChange={handleFileChange}
          />
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="min-w-0 flex-1 justify-start"
              aria-labelledby="online-meeting-recording-label"
              onClick={() => fileInputRef.current?.click()}
            >
              <Paperclip aria-hidden />
              <span className="truncate">{recordingFileName ?? "파일 첨부 (선택)"}</span>
            </Button>
            {recordingFileName && (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="녹음 파일 선택 해제"
                onClick={clearFile}
              >
                <X aria-hidden />
              </Button>
            )}
          </div>
        </div>

        <FieldError reserveSpace message={fileError ?? state.error ?? undefined} />
      </div>

      <div className="border-border flex items-center justify-end gap-4 border-t px-6 py-4">
        <SkipOrSubmitActions onSkip={onSkip} />
      </div>
    </form>
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
      <DialogTrigger render={<Button type="button" variant="outline" />}>
        <Video aria-hidden />
        비대면 회의
      </DialogTrigger>

      {/*
        ⚠️ **닫기(X) 버튼을 헤더 안에 직접 그린다.** `DialogContent`의 기본 닫기 버튼은
           `p-4` 여백을 전제로 `top-2 right-2`에 절대 위치한다 — 이 다이얼로그는 `p-0`을 쓰고
           헤더가 직접 여백(`px-6 py-4`)을 잡아서, 기본값을 그대로 쓰면 버튼이 모서리 밖으로
           걸쳐 뜬다. `showCloseButton={false}`로 끄고 헤더 여백 안에 자연스럽게 배치한다.
      */}
      <DialogContent className="gap-0 p-0 sm:max-w-[720px]" showCloseButton={false}>
        <DialogHeader className="border-border flex-row items-center justify-between border-b px-6 py-4">
          <DialogTitle>{createdMeetingId ? "녹음 파일 제출" : "비대면 회의 만들기"}</DialogTitle>
          <DialogClose render={<Button type="button" variant="ghost" size="icon-sm" />}>
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
