"use server";

import { revalidatePath } from "next/cache";

import { getMockActor } from "@/lib/mock-actor";
import { isMock } from "@/mocks/config";

import { addMockReservation, listMockReservationsByRoom } from "./mock/reservations";
import type { RoomReservation, RoomReservationDraft, RoomReservationFormErrors } from "./types";
import { RESERVATION_DURATION_MINUTES, validateRoomReservationDraft } from "./validate";

const ROOMS_PATH = "/app/rooms";

/** 예약 폼 결과 — `useActionState`가 그대로 들고 있는 모양. */
export interface RoomReservationFormState {
  errors: RoomReservationFormErrors;
  /** 성공 시 서버 확정값 — 화면은 재조회 없이 이 값을 바로 반영한다(비관적 갱신, §토스트). */
  created?: RoomReservation;
}

function readDraft(formData: FormData): RoomReservationDraft {
  const projectId = formData.get("projectId");
  return {
    title: String(formData.get("title") ?? ""),
    roomId: String(formData.get("roomId") ?? ""),
    date: String(formData.get("date") ?? ""),
    startTime: String(formData.get("startTime") ?? ""),
    projectId: projectId ? String(projectId) : undefined,
    topicMain: String(formData.get("topicMain") ?? ""),
    topicSub: String(formData.get("topicSub") ?? ""),
    attendeeIds: formData.getAll("attendeeIds").map(Number),
  };
}

function toReservedRange(draft: RoomReservationDraft): { start: Date; end: Date } {
  const start = new Date(`${draft.date}T${draft.startTime}:00`);
  const end = new Date(start.getTime() + RESERVATION_DURATION_MINUTES * 60_000);
  return { start, end };
}

/**
 * 회의실 예약 생성 — 격리막(CLAUDE.md §Mock 격리막).
 * ⚠️ **비관적 갱신**이다 — 화면은 이 액션이 성공(created 반환)한 뒤에만 캘린더에 반영한다.
 *    드래그로 즉시 그려지는 예약이 아니라 모달 확인을 거치는 흐름이라 낙관적으로 먼저
 *    그릴 이유가 없다(요구사항: 선택→모달 확인→서버 성공 후에만 반영).
 * ⚠️ 같은 회의실·겹치는 시간대 예약은 여기서 막는다(도메인 정책: 동시간대 회의실 중복 불가) —
 *    화면에서 빈 슬롯만 눌러도 그 사이 다른 사람이 먼저 예약했을 수 있어 **서버에서 다시
 *    확인**해야 한다(§권한: 화면 숨김은 UX일 뿐 보안이 아니다).
 */
export async function createRoomReservationAction(
  _prev: RoomReservationFormState,
  formData: FormData,
): Promise<RoomReservationFormState> {
  const draft = readDraft(formData);
  const errors = validateRoomReservationDraft(draft);
  if (Object.keys(errors).length > 0) return { errors };

  if (!isMock) {
    // ⚠️ 미구현 — API 스펙 확정 후 BFF 경로로 예약 생성 요청을 보낸다.
    throw new Error("회의실 예약 API가 아직 연결되지 않았습니다.");
  }

  const { start, end } = toReservedRange(draft);
  const overlapping = listMockReservationsByRoom(draft.roomId).some(
    (reservation) => reservation.start < end && reservation.end > start,
  );
  if (overlapping) {
    return { errors: { roomId: "그 시간에는 이미 예약된 회의실이에요" } };
  }

  const actor = getMockActor();
  const created = addMockReservation(draft, actor.id);
  revalidatePath(ROOMS_PATH);
  return { errors: {}, created };
}
