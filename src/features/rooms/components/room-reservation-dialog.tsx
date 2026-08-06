"use client";

import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { useActionState, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MEETING_TOPIC_MAIN_LABEL,
  MEETING_TOPIC_SUB,
  type MeetingTopicMain,
} from "@/constants/meeting";

import { createRoomReservationAction, type RoomReservationFormState } from "../actions";
import type { MeetingRoom, RoomMember, RoomProjectOption, RoomReservation } from "../types";
import { RoomAttendeePicker } from "./room-attendee-picker";

interface RoomReservationDialogProps {
  /** 클릭한 30분 슬롯의 시작 시각 — null이면 닫힌 상태다. 날짜·시작 시각은 이 값으로 고정된다
   *  (30분 한 타임 고정, CLAUDE.md §브라우저 API — 모달에서 시간을 다시 고르지 않는다). */
  slotStart: Date | null;
  onOpenChange: (open: boolean) => void;
  rooms: MeetingRoom[];
  members: RoomMember[];
  projects: RoomProjectOption[];
  /** 생성 성공 시 호출 — 재조회 없이 부모 화면에 바로 얹는다(§최적화: action 리턴값 그대로 반영). */
  onCreated: (created: RoomReservation) => void;
}

const NO_PROJECT_VALUE = "__none__";

const INITIAL_STATE: RoomReservationFormState = { errors: {} };

const EMPTY_FORM = {
  title: "",
  roomId: "",
  projectId: NO_PROJECT_VALUE,
  topicMain: "",
  topicSub: "",
  attendeeIds: [] as number[],
};

/**
 * 회의실 예약 모달 — `/app/rooms` 예약이 유일한 회의 개설 진입점이다(CLAUDE.md §라우트 그룹).
 * ⚠️ `ConfirmDialog`를 안 쓴다 — 필드가 여러 개라 두 버튼 동일폭 레이아웃이 안 맞는다. 대신
 *    같은 표식 없는 순수 `Dialog`로 만들고, 제출 버튼은 하단 우측에 둔다(DESIGN.md §4 여백).
 * ⚠️ shadcn `Select`는 네이티브 `<select>`가 아니라 `FormData`에 자동으로 안 실린다 —
 *    `add-todo-dialog.tsx`와 같은 방식으로 상태를 들고 있다가 제출 시 직접 `FormData`를 만들어
 *    `formAction`에 넘긴다.
 */
export function RoomReservationDialog({
  slotStart,
  onOpenChange,
  rooms,
  members,
  projects,
  onCreated,
}: RoomReservationDialogProps) {
  const [state, formAction, isPending] = useActionState(createRoomReservationAction, INITIAL_STATE);
  const [form, setForm] = useState(EMPTY_FORM);
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
    if (!slotStart) return;
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

  return (
    <Dialog open={slotStart !== null} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>회의실을 예약할까요?</DialogTitle>
          <DialogDescription>
            {slotStart &&
              `${format(slotStart, "M월 d일(EEE)", { locale: ko })} ${format(slotStart, "HH:mm")}부터 30분간 진행됩니다.`}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="reservation-title">회의 제목</Label>
            <Input
              id="reservation-title"
              value={form.title}
              onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
              placeholder="회의 제목을 입력해 주세요"
              aria-invalid={Boolean(state.errors.title)}
            />
            {state.errors.title && <p className="text-destructive text-xs">{state.errors.title}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="reservation-room">회의실</Label>
            <Select
              value={form.roomId}
              onValueChange={(value) => setForm((prev) => ({ ...prev, roomId: value ?? "" }))}
            >
              <SelectTrigger
                id="reservation-room"
                aria-invalid={Boolean(state.errors.roomId)}
                className="w-full"
              >
                <SelectValue placeholder="회의실을 선택해 주세요" />
              </SelectTrigger>
              <SelectContent>
                {rooms.map((room) => (
                  <SelectItem key={room.id} value={room.id}>
                    {room.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {state.errors.roomId && (
              <p className="text-destructive text-xs">{state.errors.roomId}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="reservation-project">프로젝트</Label>
            <Select
              value={form.projectId}
              onValueChange={(value) =>
                setForm((prev) => ({ ...prev, projectId: value ?? NO_PROJECT_VALUE }))
              }
            >
              <SelectTrigger id="reservation-project" className="w-full">
                <SelectValue placeholder="프로젝트를 선택해 주세요" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_PROJECT_VALUE}>없음</SelectItem>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {state.errors.projectId && (
              <p className="text-destructive text-xs">{state.errors.projectId}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="reservation-topic-main">대주제</Label>
              <Select
                value={form.topicMain}
                onValueChange={(value) =>
                  setForm((prev) => ({ ...prev, topicMain: value ?? "", topicSub: "" }))
                }
              >
                <SelectTrigger
                  id="reservation-topic-main"
                  aria-invalid={Boolean(state.errors.topicMain)}
                  className="w-full"
                >
                  <SelectValue placeholder="대주제" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(MEETING_TOPIC_MAIN_LABEL).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {state.errors.topicMain && (
                <p className="text-destructive text-xs">{state.errors.topicMain}</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="reservation-topic-sub">소주제</Label>
              <Select
                value={form.topicSub}
                onValueChange={(value) => setForm((prev) => ({ ...prev, topicSub: value ?? "" }))}
                disabled={!form.topicMain}
              >
                <SelectTrigger
                  id="reservation-topic-sub"
                  aria-invalid={Boolean(state.errors.topicSub)}
                  className="w-full"
                >
                  <SelectValue placeholder="소주제" />
                </SelectTrigger>
                <SelectContent>
                  {topicSubOptions.map((sub) => (
                    <SelectItem key={sub.value} value={sub.value}>
                      {sub.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {state.errors.topicSub && (
                <p className="text-destructive text-xs">{state.errors.topicSub}</p>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>참석자</Label>
            <RoomAttendeePicker
              members={members}
              selectedIds={form.attendeeIds}
              onChange={(attendeeIds) => setForm((prev) => ({ ...prev, attendeeIds }))}
            />
            {state.errors.attendeeIds && (
              <p className="text-destructive text-xs">{state.errors.attendeeIds}</p>
            )}
          </div>
        </div>

        <div className="mt-2 flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            onClick={() => handleOpenChange(false)}
          >
            취소
          </Button>
          <Button type="button" variant="ink" disabled={isPending} onClick={handleSubmit}>
            {isPending ? "등록 중" : "등록"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
