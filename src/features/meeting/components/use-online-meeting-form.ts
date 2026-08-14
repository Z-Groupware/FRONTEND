"use client";

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
};

export type OnlineMeetingFormValues = typeof EMPTY_FORM;

interface UseOnlineMeetingFormOptions {
  /** 1단계 성공 뒤 다이얼로그가 2단계(녹음 제출)로 넘어갈 수 있게 방금 만든 회의 id를 알린다. */
  onCreated: (meetingId: string) => void;
}

/**
 * 비대면 회의 만들기 모달의 **1단계**(제목·프로젝트·안건·참석자) 폼 상태·제출 흐름(이슈 #473) —
 * `useRoomReservationForm`과 같은 골격이다(CLAUDE.md §폴더·네이밍: 로직=커스텀훅).
 * ⚠️ **성공해도 창을 안 닫는다**(2026-08-14 팀 확정 — 이전엔 상세로 `router.push`했다). 비대면
 *    회의는 만들자마자 완료 처리되지만, 같은 다이얼로그가 이어서 녹음 파일 제출·AI 요약 요청을
 *    받는 **2단계**로 넘어간다 — 페이지 전환 없이 `onCreated`로 부모(다이얼로그)에 알리기만 한다.
 * ⚠️ 폼은 여기서 안 비운다 — 성공하면 부모(`OnlineMeetingDialog`)가 2단계로 갈아 끼워 이
 *    컴포넌트(와 이 훅)를 **언마운트**한다. 다시 1단계로 돌아오는 유일한 길은 다이얼로그를
 *    닫았다 여는 것뿐이라, 그때는 이 훅이 처음부터 다시 마운트돼 `EMPTY_FORM`으로 시작한다 —
 *    되돌리는 함수가 따로 없다.
 */
export function useOnlineMeetingForm({ onCreated }: UseOnlineMeetingFormOptions) {
  const [state, formAction] = useActionState(createOnlineMeetingAction, INITIAL_STATE);
  const [form, setForm] = useState<OnlineMeetingFormValues>(EMPTY_FORM);
  const handledCreatedId = useRef<string | null>(null);

  useEffect(() => {
    if (state.created && state.created.id !== handledCreatedId.current) {
      handledCreatedId.current = state.created.id;
      toast.success("비대면 회의를 등록했습니다");
      onCreated(state.created.id);
    }
  }, [state.created, onCreated]);

  return { state, formAction, form, setForm };
}
