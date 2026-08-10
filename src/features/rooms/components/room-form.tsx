"use client";

import { useActionState, useEffect, useRef, useState } from "react";

import { FieldError } from "@/components/common/field-error";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import type { MeetingRoomFormState } from "../actions";
import { TIME_OPTIONS } from "../constants";
import type { MeetingRoom } from "../types";

interface RoomFormProps {
  /** 추가면 `createMeetingRoomAction`, 수정이면 `updateMeetingRoomAction` */
  action: (prev: MeetingRoomFormState, formData: FormData) => Promise<MeetingRoomFormState>;
  /** 수정일 때만 — 기존 값 채우기 + id 전달 */
  room?: MeetingRoom;
  onSuccess: (room: MeetingRoom) => void;
  onPendingChange?: (isPending: boolean) => void;
  /**
   * 창이 제출을 부를 수 있게 내어 주는 `<form>` 참조.
   *
   * ⚠️ 이 폼은 `ConfirmDialog` 안에서 쓰인다(2026-08-08 정리). 실행 버튼은 **창**이 그리므로
   *    실행 버튼은 **창**이 그리고, 창이 `formRef.current?.requestSubmit()`으로 제출을 건다 —
   *    `useActionState`는 폼이 그대로 들고 있어야 검증 오류가 칸 밑에 남는다.
   */
  formRef?: React.RefObject<HTMLFormElement | null>;
}

/**
 * 회의실 추가·수정 폼 — `notice-form.tsx`와 같은 골격(실제 `<form action={formAction}>`).
 * ⚠️ 이용 시작·종료는 공용 `Select`로 고른다 — base-ui `Select`는 네이티브 폼 필드가 아니라서
 *    `room-reservation-dialog.tsx`의 `projectId`와 같은 방식으로 `input type="hidden"`을
 *    같이 둬서 `formData.get("openTime"/"closeTime")`이 그대로 읽히게 한다.
 */
export function RoomForm({ action, room, onSuccess, onPendingChange, formRef }: RoomFormProps) {
  const [state, formAction, isPending] = useActionState(action, { errors: {} });
  const [name, setName] = useState(room?.name ?? "");
  const [location, setLocation] = useState(room?.location ?? "");
  const [openTime, setOpenTime] = useState(room?.openTime ?? "");
  const [closeTime, setCloseTime] = useState(room?.closeTime ?? "");
  const handledRoomId = useRef<string | null>(null);

  useEffect(() => {
    if (state.room && state.room.id !== handledRoomId.current) {
      handledRoomId.current = state.room.id;
      onSuccess(state.room);
    }
  }, [state.room, onSuccess]);

  useEffect(() => {
    onPendingChange?.(isPending);
  }, [isPending, onPendingChange]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-4 text-left">
      {room && <input type="hidden" name="id" value={room.id} />}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="room-name">이름</Label>
        <Input
          id="room-name"
          name="name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="예: 대회의실"
          aria-invalid={Boolean(state.errors.name)}
        />
        <FieldError reserveSpace message={state.errors.name} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="room-location">위치</Label>
        <Input
          id="room-location"
          name="location"
          value={location}
          onChange={(event) => setLocation(event.target.value)}
          placeholder="예: 3층 A동"
          aria-invalid={Boolean(state.errors.location)}
        />
        <FieldError reserveSpace message={state.errors.location} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="room-open-time">이용 시작</Label>
          <input type="hidden" name="openTime" value={openTime} />
          <Select value={openTime} onValueChange={(value) => setOpenTime(value ?? "")}>
            <SelectTrigger
              id="room-open-time"
              aria-invalid={Boolean(state.errors.openTime)}
              className="w-full"
            >
              <SelectValue placeholder="시작 시간 선택" />
            </SelectTrigger>
            <SelectContent>
              {TIME_OPTIONS.map((time) => (
                <SelectItem key={time} value={time}>
                  {time}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldError reserveSpace message={state.errors.openTime} />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="room-close-time">이용 종료</Label>
          <input type="hidden" name="closeTime" value={closeTime} />
          <Select value={closeTime} onValueChange={(value) => setCloseTime(value ?? "")}>
            <SelectTrigger
              id="room-close-time"
              aria-invalid={Boolean(state.errors.closeTime)}
              className="w-full"
            >
              <SelectValue placeholder="종료 시간 선택" />
            </SelectTrigger>
            <SelectContent>
              {TIME_OPTIONS.map((time) => (
                <SelectItem key={time} value={time}>
                  {time}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldError reserveSpace message={state.errors.closeTime} />
        </div>
      </div>
    </form>
  );
}
