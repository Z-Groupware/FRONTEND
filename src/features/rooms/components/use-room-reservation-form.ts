"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { createRoomReservationAction, type RoomReservationFormState } from "../actions";
import type { MeetingTopicInput, RoomReservation } from "../types";

const INITIAL_STATE: RoomReservationFormState = { errors: {} };

const EMPTY_TOPIC: MeetingTopicInput = { main: "", sub: "" };

const EMPTY_FORM = {
  title: "",
  roomId: "",
  projectId: "",
  topics: [EMPTY_TOPIC] as MeetingTopicInput[],
  attendeeIds: [] as number[],
  /** Select 값은 문자열이라 여기서도 문자열로 든다 — 없으면 빈 문자열("Owner 개설"이거나 아직 안 골랐을 때). */
  parentTeamActionId: "",
};

export type RoomReservationFormValues = typeof EMPTY_FORM;

interface UseRoomReservationFormOptions {
  slotStart: Date | null;
  onCreated: (created: RoomReservation) => void;
  onOpenChange: (open: boolean) => void;
}

/**
 * 예약 모달의 폼 상태·제출 흐름 — `RoomReservationDialog`를 200줄 아래로 유지하려고 뺐다
 * (CLAUDE.md §폴더·네이밍: 로직=커스텀훅).
 * ⚠️ 실제 `<form action={formAction}>`으로 제출한다(`notice-form.tsx`와 같은 패턴) — shadcn
 *    `Select`·`RoomPickerList`처럼 네이티브 입력이 아닌 위젯은 `RoomReservationDialog`가 hidden
 *    input으로 값을 따로 실어 보낸다. `title`·참석자 체크박스·안건 입력은 전부 진짜 네이티브
 *    입력이라 `name`만 있으면 된다 — 여기서 `FormData`를 직접 만들지 않는다.
 */
export function useRoomReservationForm({
  slotStart,
  onCreated,
  onOpenChange,
}: UseRoomReservationFormOptions) {
  const [state, formAction] = useActionState(createRoomReservationAction, INITIAL_STATE);
  const [form, setForm] = useState<RoomReservationFormValues>(EMPTY_FORM);
  const handledCreatedId = useRef<string | null>(null);

  useEffect(() => {
    if (state.created && state.created.id !== handledCreatedId.current) {
      handledCreatedId.current = state.created.id;
      onCreated(state.created);
      onOpenChange(false);
      setForm(EMPTY_FORM);
      toast.success(`'${state.created.title}' 회의실을 예약했습니다`);
    }
  }, [state.created, onCreated, onOpenChange]);

  function handleOpenChange(open: boolean) {
    if (!open) setForm(EMPTY_FORM);
    onOpenChange(open);
  }

  return {
    state,
    formAction,
    form,
    setForm,
    handleOpenChange,
    slotStart,
  };
}
