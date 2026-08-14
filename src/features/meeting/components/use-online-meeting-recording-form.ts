"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import {
  submitOnlineMeetingRecordingAction,
  type SubmitOnlineMeetingRecordingState,
} from "../actions";

const INITIAL_STATE: SubmitOnlineMeetingRecordingState = { error: null, submitted: null };

interface UseOnlineMeetingRecordingFormOptions {
  meetingId: string;
  /** 제출(성공)이 끝나면 다이얼로그를 닫는다 — 회의는 1단계에서 이미 완료 상태로 존재해서
   *  이 단계는 선택이다(닫아도 회의 자체는 그대로 남는다). */
  onSubmitted: () => void;
}

/**
 * 비대면 회의 만들기 다이얼로그의 **2단계**(녹음 파일 제출 + AI 요약 요청, 이슈 #473,
 * 2026-08-14 팀 확정) — 파일명만 드는 가벼운 상태라 `useOnlineMeetingForm`처럼 따로 뗀다.
 * ⚠️ **첨부는 실제 업로드가 아니다**(§정직한 목업) — 파일 이름만 hidden input으로 실어 보낸다,
 *    `online-meeting-dialog.tsx`가 전에 하던 것과 같다.
 */
export function useOnlineMeetingRecordingForm({
  meetingId,
  onSubmitted,
}: UseOnlineMeetingRecordingFormOptions) {
  const [state, formAction] = useActionState(submitOnlineMeetingRecordingAction, INITIAL_STATE);
  const [recordingFileName, setRecordingFileName] = useState<string | null>(null);
  const handledMeetingId = useRef<string | null>(null);

  useEffect(() => {
    if (state.submitted && state.submitted.meetingId !== handledMeetingId.current) {
      handledMeetingId.current = state.submitted.meetingId;
      toast.success("AI 요약을 요청했습니다");
      onSubmitted();
    }
  }, [state.submitted, onSubmitted]);

  return { state, formAction, recordingFileName, setRecordingFileName, meetingId };
}
