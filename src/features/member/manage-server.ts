import "server-only";

import { isMock } from "@/mocks/config";

import type { ManagedMember, ManagedMemberDetail } from "./manage-types";
import {
  findMockManagedMember,
  listMockManagedMembers,
  listMockMemberEmails,
} from "./mock/managed";

/**
 * 사원 조회 — **격리막**(CLAUDE.md §Mock 격리막).
 *
 * ⚠️ 컴포넌트는 반환 타입만 본다. 연동되면 여기 `isMock` 분기만 실서버 호출로 바꾸고
 *    매퍼가 shape을 흡수한다 — 화면은 안 바뀐다.
 * ⚠️ 회사는 세션(`companyId`)으로 정해진다 — 인자로 받지 않는다(§라우트 그룹).
 * ⚠️ 소프트 딜리트된 사람은 **매퍼가 거른다**(`isVisibleMemberStatus`) — 퇴사자는 남고
 *    지워진 사람만 빠진다(§도메인 상수).
 */
export async function listManagedMembers(): Promise<ManagedMember[]> {
  if (isMock) return listMockManagedMembers();

  // TODO(BE 협의): `GET /companies/me/members` — 응답 봉투는 아직 모른다(매퍼가 벗긴다)
  throw new Error("사원 목록 조회 API가 아직 연결되지 않았습니다.");
}

/** 없는 사람이면 `null` — 화면이 `notFound()`를 부른다 */
export async function getManagedMember(id: number): Promise<ManagedMemberDetail | null> {
  if (isMock) return findMockManagedMember(id);

  // TODO(BE 협의): `GET /companies/me/members/{id}`
  throw new Error("사원 조회 API가 아직 연결되지 않았습니다.");
}

/**
 * 계정 발급 화면이 고를 팀 목록.
 *
 * ⚠️ 지금은 **이미 있는 사원의 팀에서 뽑는다.** 정본은 기업 설정의 팀 체계이지만 아직
 *    그 값이 이 도메인으로 오지 않는다 — 없는 목록을 지어내지 않고, 연동되면 여기만 고친다.
 * ⚠️ Owner는 팀이 없어 `null`이라 빠진다.
 */
export async function listTeamNames(): Promise<string[]> {
  const members = await listManagedMembers();
  return [...new Set(members.map((member) => member.teamName).filter((name) => name !== null))];
}

/** 이미 쓰고 있는 메일 주소 — 중복 발급을 막는다 */
export async function listMemberEmails(): Promise<string[]> {
  if (isMock) return listMockMemberEmails();

  // TODO(BE 협의): 발급 API가 서버에서 중복을 보면 이 조회는 사라진다
  throw new Error("사원 목록 조회 API가 아직 연결되지 않았습니다.");
}
