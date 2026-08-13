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
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { AttendeeScopeViewer } from "@/features/rooms/attendee-scope";
import { RoomAttendeePicker } from "@/features/rooms/components/room-attendee-picker";
import type { RoomMember, RoomProjectOption, RoomTeamActionOption } from "@/features/rooms/types";

import { OnlineMeetingFields } from "./online-meeting-fields";
import { useOnlineMeetingForm } from "./use-online-meeting-form";

interface OnlineMeetingDialogProps {
  members: RoomMember[];
  projects: RoomProjectOption[];
  showParentTeamAction: boolean;
  teamActions: RoomTeamActionOption[];
  viewer: AttendeeScopeViewer;
}

/** 취소·제출 버튼 — `useFormStatus`는 `<form>`의 자손에서만 읽을 수 있다(`RoomReservationDialog`와 같은 이유). */
function DialogActions({
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

/** 제출 중인지를 창에 올려 보낸다 — `RoomReservationDialog`의 `PendingReporter`와 같다. */
function PendingReporter({ onChange }: { onChange: (pending: boolean) => void }) {
  const { pending } = useFormStatus();

  useEffect(() => {
    onChange(pending);
  }, [pending, onChange]);

  return null;
}

/**
 * 비대면 회의 만들기 — `/app/meeting` 목록의 진입점(이슈 #473). `RoomReservationDialog`와
 * 같은 뼈대(`ConfirmDialog`를 안 쓰는 이유·확인 2단계 제출도 그대로)를 쓰되 **회의실·시간이
 * 없다.** 대신 녹음 파일 첨부 필드가 하나 더 있다.
 * ⚠️ **첨부는 실제 업로드가 아니다**(§정직한 목업). BE에 파일을 받을 자리가 없어(이슈 #473)
 *    파일 이름만 hidden input(`recordingFileName`)으로 실어 보낸다 — 바이트는 어디에도
 *    안 올라간다.
 */
export function OnlineMeetingDialog({
  members,
  projects,
  showParentTeamAction,
  teamActions,
  viewer,
}: OnlineMeetingDialogProps) {
  const [open, setOpen] = useState(false);
  const { state, formAction, form, setForm, handleOpenChange } = useOnlineMeetingForm({
    onOpenChange: setOpen,
  });

  const [isPending, setIsPending] = useState(false);
  const handlePendingChange = useCallback((next: boolean) => setIsPending(next), []);

  const fileInputRef = useRef<HTMLInputElement>(null);
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

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setForm((prev) => ({ ...prev, recordingFileName: file?.name ?? null }));
  }

  function clearFile() {
    setForm((prev) => ({ ...prev, recordingFileName: null }));
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        // ⚠️ 제출 중엔 Esc·바깥 클릭 전부 막는다 — 요청은 계속 가는데 창만 사라지면 결과를
        //    못 본다(`RoomReservationDialog`와 같은 이유).
        if (!next && isPending) return;
        // `handleOpenChange`가 폼 리셋 + `setOpen`까지 한 번에 한다(훅 안에서 `onOpenChange`로 위임).
        handleOpenChange(next);
      }}
    >
      <DialogTrigger render={<Button type="button" variant="outline" />}>
        <Video aria-hidden />
        비대면 회의
      </DialogTrigger>

      <DialogContent className="gap-0 p-0 sm:max-w-[720px]">
        <DialogHeader className="border-border border-b px-6 py-4">
          <DialogTitle>비대면 회의 만들기</DialogTitle>
        </DialogHeader>

        <form ref={formRef} action={formAction} onSubmit={handleFormSubmit}>
          <PendingReporter onChange={handlePendingChange} />
          <input type="hidden" name="projectId" value={form.projectId} />
          <input type="hidden" name="parentTeamActionId" value={form.parentTeamActionId} />
          <input type="hidden" name="recordingFileName" value={form.recordingFileName ?? ""} />

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

                <div className="flex flex-col gap-1.5">
                  <span
                    id="online-meeting-recording-label"
                    className="text-[13px] leading-5 font-medium"
                  >
                    녹음 파일 첨부 (선택)
                  </span>
                  {/* ⚠️ 바이너리는 안 보낸다 — 파일명만 읽어 hidden input으로 싣는다(위 주석). */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full min-w-0 justify-start"
                      aria-labelledby="online-meeting-recording-label"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Paperclip aria-hidden />
                      <span className="truncate">
                        {form.recordingFileName ?? "파일 첨부 (선택)"}
                      </span>
                    </Button>
                    {form.recordingFileName && (
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
              </div>
            </div>
          </div>

          <div className="border-border flex items-center justify-end gap-4 border-t px-6 py-4">
            <DialogActions
              onCancel={() => handleOpenChange(false)}
              onRequestSubmit={() => setShowConfirm(true)}
            />
          </div>
        </form>
      </DialogContent>

      <ConfirmDialog
        isOpen={showConfirm}
        onOpenChange={setShowConfirm}
        title="이대로 등록하시겠습니까?"
        description="등록하면 곧바로 회의가 완료 처리되고 AI 요약이 시작됩니다."
        confirmLabel="등록"
        onConfirm={() => {
          setShowConfirm(false);
          confirmedSubmitRef.current = true;
          formRef.current?.requestSubmit();
        }}
      />
    </Dialog>
  );
}
