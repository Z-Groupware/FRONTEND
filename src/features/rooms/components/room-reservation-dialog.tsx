"use client";

import { format } from "date-fns";
import { ko } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import type { MeetingRoom, RoomMember, RoomProjectOption, RoomReservation } from "../types";
import { RoomReservationFields } from "./room-reservation-fields";
import { useRoomReservationForm } from "./use-room-reservation-form";

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

/**
 * 회의실 예약 모달 — `/app/rooms` 예약이 유일한 회의 개설 진입점이다(CLAUDE.md §라우트 그룹).
 * ⚠️ `ConfirmDialog`를 안 쓴다 — 필드가 여러 개라 두 버튼 동일폭 레이아웃이 안 맞는다. 대신
 *    같은 표식 없는 순수 `Dialog`로 만들고, 제출 버튼은 하단 우측에 둔다(DESIGN.md §4 여백).
 * 폼 상태·제출 로직은 `useRoomReservationForm`, 입력 필드는 `RoomReservationFields`로 뺐다
 * (CLAUDE.md §폴더·네이밍: 200줄↑ 분리·로직=커스텀훅) — 여기는 모달 뼈대만 조립한다.
 */
export function RoomReservationDialog({
  slotStart,
  onOpenChange,
  rooms,
  members,
  projects,
  onCreated,
}: RoomReservationDialogProps) {
  const { state, isPending, form, setForm, topicSubOptions, handleOpenChange, handleSubmit } =
    useRoomReservationForm({ slotStart, onCreated, onOpenChange });

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

        <RoomReservationFields
          form={form}
          setForm={setForm}
          errors={state.errors}
          rooms={rooms}
          members={members}
          projects={projects}
          topicSubOptions={topicSubOptions}
        />

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
