"use client";

import { useActionState, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import type { MeetingRoomFormState } from "../actions";
import type { MeetingRoom } from "../types";

interface RoomFormProps {
  /** 추가면 `createMeetingRoomAction`, 수정이면 `updateMeetingRoomAction` */
  action: (prev: MeetingRoomFormState, formData: FormData) => Promise<MeetingRoomFormState>;
  /** 수정일 때만 — 기존 값 채우기 + id 전달 */
  room?: MeetingRoom;
  submitLabel: string;
  onCancel: () => void;
  onSuccess: (room: MeetingRoom) => void;
  onPendingChange?: (isPending: boolean) => void;
}

/**
 * 회의실 추가·수정 폼 — `notice-form.tsx`와 같은 골격(실제 `<form action={formAction}>`,
 * 필드가 전부 plain input이라 shadcn `Select` 우회 없이 그대로 쓴다).
 */
export function RoomForm({
  action,
  room,
  submitLabel,
  onCancel,
  onSuccess,
  onPendingChange,
}: RoomFormProps) {
  const [state, formAction, isPending] = useActionState(action, { errors: {} });
  const [name, setName] = useState(room?.name ?? "");
  const [location, setLocation] = useState(room?.location ?? "");
  const [openTime, setOpenTime] = useState(room?.openTime ?? "");
  const [closeTime, setCloseTime] = useState(room?.closeTime ?? "");
  const canSubmit =
    name.trim().length > 0 &&
    location.trim().length > 0 &&
    openTime.length > 0 &&
    closeTime.length > 0;
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
    <form action={formAction} className="flex flex-col gap-4">
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
        {state.errors.name && <p className="text-destructive text-xs">{state.errors.name}</p>}
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
        {state.errors.location && (
          <p className="text-destructive text-xs">{state.errors.location}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="room-open-time">이용 시작</Label>
          <Input
            id="room-open-time"
            name="openTime"
            type="time"
            value={openTime}
            onChange={(event) => setOpenTime(event.target.value)}
            aria-invalid={Boolean(state.errors.openTime)}
          />
          {state.errors.openTime && (
            <p className="text-destructive text-xs">{state.errors.openTime}</p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="room-close-time">이용 종료</Label>
          <Input
            id="room-close-time"
            name="closeTime"
            type="time"
            value={closeTime}
            onChange={(event) => setCloseTime(event.target.value)}
            aria-invalid={Boolean(state.errors.closeTime)}
          />
          {state.errors.closeTime && (
            <p className="text-destructive text-xs">{state.errors.closeTime}</p>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" size="sm" disabled={isPending} onClick={onCancel}>
          취소
        </Button>
        <Button type="submit" size="sm" variant="ink" disabled={isPending || !canSubmit}>
          {isPending ? "저장 중…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}
