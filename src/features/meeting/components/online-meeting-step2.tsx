"use client";

import { Paperclip, X } from "lucide-react";
import type { ChangeEvent } from "react";
import { useRef, useState } from "react";
import { useFormStatus } from "react-dom";

import { FieldError } from "@/components/common/field-error";
import { Button } from "@/components/ui/button";

import { RECORDING_FILE_ACCEPTED_EXTENSIONS, validateRecordingFile } from "../recording-file";
import { PendingReporter } from "./online-meeting-shared";
import { useOnlineMeetingRecordingForm } from "./use-online-meeting-recording-form";

/** 파일 피커의 `accept` 속성 — 확장자 앞에 점을 붙인다. 실제 차단은 `validateRecordingFile`이 한다. */
const RECORDING_FILE_ACCEPT = RECORDING_FILE_ACCEPTED_EXTENSIONS.map((ext) => `.${ext}`).join(",");

/**
 * 건너뛰기·바로 제출 버튼 — 2단계(녹음 제출)가 쓴다. 확인 모달을 안 거친다 — 회의는 이미
 * 완료 상태로 존재해서 이 제출은 되돌릴 게 없는 부가 조작이다(§토스트: 파괴적 작업만 Dialog).
 * ⚠️ **녹음 파일은 선택이 아니다** — AI 요약 요청은 파일이 있어야만 눌린다(`canSubmit`).
 *    [나중에 하기]로 이 단계 자체를 건너뛰는 건 여전히 자유다(회의는 이미 완료 상태).
 */
function SkipOrSubmitActions({ onSkip, canSubmit }: { onSkip: () => void; canSubmit: boolean }) {
  const { pending } = useFormStatus();

  return (
    <div className="flex shrink-0 gap-2">
      <Button type="button" variant="outline" disabled={pending} onClick={onSkip}>
        나중에 하기
      </Button>
      <Button type="submit" variant="ink" disabled={pending || !canSubmit}>
        {pending ? "요청 중" : "AI 요약 요청"}
      </Button>
    </div>
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
 * 상태로 만들어져 있어 이 **단계**는 선택이다 — [나중에 하기]로 건너뛰어도 회의는 그대로 남는다.
 * 다만 **녹음 파일 자체는 선택이 아니다** — AI 요약을 요청하려면 파일을 첨부해야 한다.
 * ⚠️ **첨부는 실제 업로드가 아니다**(§정직한 목업) — 파일 이름만 hidden input으로 싣는다.
 * ⚠️ 실서버(`!isMock`)에서는 서버 액션이 `notice`(안내, 오류 아님)를 돌려준다 — 컴포넌트가
 *    `isMock`을 직접 알면 안 된다(§Mock 격리막)는 규칙 그대로라, 여기서 따로 분기하지 않고
 *    `state.notice`를 그대로 보여준다.
 */
export function OnlineMeetingStep2({
  meetingId,
  onSubmitted,
  onPendingChange,
  onSkip,
}: OnlineMeetingStep2Props) {
  const { state, formAction, recordingFileName, setRecordingFileName } =
    useOnlineMeetingRecordingForm({ meetingId, onSubmitted });
  const fileInputRef = useRef<HTMLInputElement>(null);
  // ⚠️ 형식·용량은 여기서 1차로만 거른다 — 최종 검증은 서버 몫이다(§권한: 화면 검증은
  //    보안이 아니다). 파일을 다시 고르면 **이 클라이언트 오류만** 사라진다 — 서버 오류
  //    (`state.error`)는 다음 제출(`useActionState`의 다음 dispatch) 전까지 그대로 남아서,
  //    `fileError`가 `null`이 되면 아래 `FieldError`는 `state.error`로 바로 돌아간다.
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
          AI 요약을 요청하려면 녹음 파일을 첨부해야 합니다. 지금 건너뛰어도 회의는 이미 완료 처리돼
          있습니다.
        </p>

        <div className="flex flex-col gap-1.5">
          <span id="online-meeting-recording-label" className="text-[13px] leading-5 font-medium">
            녹음 파일 첨부
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
              aria-labelledby="online-meeting-recording-label online-meeting-recording-filename"
              onClick={() => fileInputRef.current?.click()}
            >
              <Paperclip aria-hidden />
              {/*
                ⚠️ **`aria-labelledby`는 버튼의 시각적 자식을 완전히 대신한다** — 스크린리더는
                   여기 참조된 요소들의 글만 읽고 버튼 안의 다른 텍스트는 안 읽는다. 그래서 고른
                   파일명이 접근성 이름에 들어가려면 이 span도 `id`로 같이 참조돼야 한다.
              */}
              <span id="online-meeting-recording-filename" className="truncate">
                {recordingFileName ?? "선택된 파일 없음"}
              </span>
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
        {state.notice && (
          <p className="text-muted-foreground text-[12px] leading-4">{state.notice}</p>
        )}
      </div>

      <div className="border-border flex items-center justify-end gap-4 border-t px-6 py-4">
        <SkipOrSubmitActions onSkip={onSkip} canSubmit={Boolean(recordingFileName)} />
      </div>
    </form>
  );
}
