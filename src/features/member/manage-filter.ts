import { HANDOVER_TYPE } from "@/constants/handover";
import { MEMBER_STATUS } from "@/constants/member";

import { type ManagedMember, MEMBER_FILTER, type MemberFilter } from "./manage-types";

/**
 * 목록 추리기 — **순수 함수**라 화면 밖에서도 검증된다.
 *
 * ⚠️ 검색은 **이름·팀·이메일** 세 곳을 본다(WORKFLOW §9의 칸 안내문 그대로).
 *    직급·역할까지 넣으면 "사원"으로 검색했을 때 직급이 사원인 사람이 다 걸려 소용이 없다.
 */
export function searchMembers(members: ManagedMember[], keyword: string): ManagedMember[] {
  const needle = keyword.trim().toLowerCase();
  if (!needle) return members;

  return members.filter((member) =>
    [member.name, member.teamName ?? "", member.email].some((field) =>
      field.toLowerCase().includes(needle),
    ),
  );
}

/**
 * 승인 대기 필터.
 *
 * ⚠️ 목록 행에는 신청 종류가 없다(컬럼이 아니다) — 그래서 **대기 중인 신청의 사람 id**를
 *    따로 받아 거른다. 상태만 보면 휴직 대기와 오프보딩 대기를 구분할 수 없다.
 */
export function filterMembers(
  members: ManagedMember[],
  filter: MemberFilter,
  pendingTypeById: Record<number, string | undefined>,
): ManagedMember[] {
  if (filter === MEMBER_FILTER.ALL) return members;

  const wanted =
    filter === MEMBER_FILTER.VACATION_PENDING ? HANDOVER_TYPE.VACATION : HANDOVER_TYPE.OFFBOARDING;

  return members.filter(
    (member) => member.status === MEMBER_STATUS.WAITING && pendingTypeById[member.id] === wanted,
  );
}
