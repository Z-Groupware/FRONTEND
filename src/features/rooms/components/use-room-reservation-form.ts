"use client";

import { format } from "date-fns";
import { useActionState, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { MEETING_TOPIC_SUB, type MeetingTopicMain } from "@/constants/meeting";

import { createRoomReservationAction, type RoomReservationFormState } from "../actions";
import type { RoomReservation } from "../types";

export const NO_PROJECT_VALUE = "__none__";

const INITIAL_STATE: RoomReservationFormState = { errors: {} };

const EMPTY_FORM = {
  title: "",
  roomId: "",
  projectId: NO_PROJECT_VALUE,
  topicMain: "",
  topicSub: "",
  attendeeIds: [] as number[],
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
 * ⚠️ shadcn `Select`는 네이티브 `<select>`가 아니라 `FormData`에 자동으로 안 실린다 —
 *    `add-todo-dialog.tsx`와 같은 방식으로 상태를 들고 있다가 제출 시 직접 `FormData`를 만든다.
 */
export function useRoomReservationForm({
  slotStart,
  onCreated,
  onOpenChange,
}: UseRoomReservationFormOptions) {
  const [state, formAction, isPending] = useActionState(createRoomReservationAction, INITIAL_STATE);
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

  function handleSubmit() {
    // ⚠️ 버튼도 `disabled={isPending}`지만, 클릭과 그 disabled가 반영되는 렌더 사이의 좁은 틈에
    //    두 번째 클릭이 끼어들면 예약이 두 번 생성될 수 있다 — 여기서도 같은 조건으로 막는다.
    if (isPending || !slotStart) return;
    const formData = new FormData();
    formData.set("title", form.title);
    formData.set("roomId", form.roomId);
    formData.set("date", format(slotStart, "yyyy-MM-dd"));
    formData.set("startTime", format(slotStart, "HH:mm"));
    if (form.projectId !== NO_PROJECT_VALUE) formData.set("projectId", form.projectId);
    formData.set("topicMain", form.topicMain);
    formData.set("topicSub", form.topicSub);
    for (const id of form.attendeeIds) formData.append("attendeeIds", String(id));
    formAction(formData);
  }

  const topicSubOptions = form.topicMain
    ? (MEETING_TOPIC_SUB[form.topicMain as MeetingTopicMain] ?? [])
    : [];

  return {
    state,
    isPending,
    form,
    setForm,
    topicSubOptions,
    handleOpenChange,
    handleSubmit,
  };
}
