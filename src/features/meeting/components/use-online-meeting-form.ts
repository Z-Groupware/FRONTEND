"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import type { MeetingTopicInput } from "@/features/rooms/types";

import { createOnlineMeetingAction, type OnlineMeetingFormState } from "../actions";

const INITIAL_STATE: OnlineMeetingFormState = { errors: {} };

const EMPTY_TOPIC: MeetingTopicInput = { main: "", sub: "" };

const EMPTY_FORM = {
  title: "",
  projectId: "",
  topics: [EMPTY_TOPIC] as MeetingTopicInput[],
  attendeeIds: [] as number[],
  /** Select 값은 문자열이라 여기서도 문자열로 든다 — `useRoomReservationForm`과 같은 관례. */
  parentTeamActionId: "",
  /** 첨부한 녹음 파일 이름 — 바이트는 안 든다(§정직한 목업, `Meeting.recordingFileName`). */
  recordingFileName: null as string | null,
};

export type OnlineMeetingFormValues = typeof EMPTY_FORM;

interface UseOnlineMeetingFormOptions {
  onOpenChange: (open: boolean) => void;
}

/**
 * 비대면 회의 만들기 모달의 폼 상태·제출 흐름(이슈 #473) — `useRoomReservationForm`과 같은
 * 골격이다(CLAUDE.md §폴더·네이밍: 로직=커스텀훅).
 * ⚠️ **성공 후 흐름이 회의실 예약과 다르다.** 예약은 같은 화면(캘린더)에 비관적으로 반영하지만,
 *    이 다이얼로그는 목록 화면 어디에도 그릴 자리가 없다 — 만들자마자 완료 처리되는 회의라
 *    상세로 바로 옮기는 편이 자연스럽다(`router.push`). 목록은 서버 액션이 이미 부른
 *    `revalidatePath`로 다음 방문 때 최신 상태다.
 */
export function useOnlineMeetingForm({ onOpenChange }: UseOnlineMeetingFormOptions) {
  const router = useRouter();
  const [state, formAction] = useActionState(createOnlineMeetingAction, INITIAL_STATE);
  const [form, setForm] = useState<OnlineMeetingFormValues>(EMPTY_FORM);
  const handledCreatedId = useRef<string | null>(null);

  useEffect(() => {
    if (state.created && state.created.id !== handledCreatedId.current) {
      handledCreatedId.current = state.created.id;
      onOpenChange(false);
      setForm(EMPTY_FORM);
      toast.success("비대면 회의를 등록했습니다");
      router.push(`/app/meeting/${state.created.id}`);
    }
  }, [state.created, onOpenChange, router]);

  function handleOpenChange(open: boolean) {
    if (!open) setForm(EMPTY_FORM);
    onOpenChange(open);
  }

  return { state, formAction, form, setForm, handleOpenChange };
}
