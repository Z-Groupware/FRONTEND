"use client";

import { format } from "date-fns";
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
  /** "YYYY-MM-DD" — `SlotPicker`가 고른다. 열릴 때 `slotStart`로 한 번 채워진다(아래 effect). */
  date: "",
  /** "HH:mm" */
  startTime: "",
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

  /*
    ⚠️ **연 시점의 슬롯으로 요일·시간을 채운다** — 격자 빈 칸 클릭이든 [회의 추가] 기본값
       (`getNextAvailableSlot`)이든, 열릴 때 값은 `slotStart` 하나뿐이다. 그 뒤로는
       `SlotPicker`가 `form.date`·`form.startTime`을 직접 바꾸므로, 여기서는 **열릴 때만** 채운다.
  */
  useEffect(() => {
    if (!slotStart) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setForm((prev) => ({
      ...prev,
      date: format(slotStart, "yyyy-MM-dd"),
      startTime: format(slotStart, "HH:mm"),
    }));
  }, [slotStart]);

  useEffect(() => {
    if (state.created && state.created.id !== handledCreatedId.current) {
      handledCreatedId.current = state.created.id;
      onCreated(state.created);
      onOpenChange(false);
      setForm(EMPTY_FORM);
      toast.success("회의실을 예약했습니다");
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
