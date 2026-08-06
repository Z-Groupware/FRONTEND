import type { RoomMember } from "../types";

/**
 * ⚠️ 목 데이터 — BE 연동 전. 참석자 검색 대상이 되는 사원 목록(전사 공용, 부서 무관).
 * 사원 도메인(`/manage/members`)과 별도로 이 화면 전용 경량 목록만 둔다 — 필요한 필드가
 * id·이름뿐이라 사원 도메인 전체 타입을 끌어오지 않는다.
 */
export const MEETING_MEMBERS: RoomMember[] = [
  { id: 1, name: "박대표" },
  { id: 2, name: "김서준" },
  { id: 3, name: "이하윤" },
  { id: 4, name: "박도현" },
  { id: 5, name: "최유진" },
  { id: 6, name: "정민석" },
  { id: 7, name: "강서연" },
  { id: 8, name: "임지안" },
  { id: 9, name: "오현우" },
  { id: 10, name: "한소율" },
];

export function listMockMembers(): RoomMember[] {
  return MEETING_MEMBERS;
}

export function findMockMember(id: number): RoomMember | null {
  return MEETING_MEMBERS.find((member) => member.id === id) ?? null;
}
