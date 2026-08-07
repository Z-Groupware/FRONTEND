import "server-only";

import { paginate, type PaginatedResult } from "@/lib/paginate";
import { isMock } from "@/mocks/config";

import { filterMembers, searchMembers } from "./manage-filter";
import type { ManagedMember, ManagedMemberDetail, MemberQuery } from "./manage-types";
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

/** 한 화면에 그리는 줄 수 — 첫 페이지를 서버가 렌더하고 그 아래부터 이어 붙인다 */
export const MEMBER_PAGE_SIZE = 20;

/**
 * 목록 한 페이지 — **거르기·자르기를 서버가 한다.**
 *
 * ⚠️ 전부 받아 화면에서 `slice`하지 않는다(CLAUDE.md §목록·페이지네이션). 사원이 수백
 *    명이면 그 수백을 다 받아 오고, 화면만 잘릴 뿐이다.
 * ⚠️ 지금은 목이라 메모리에서 자른다. 연동되면 이 함수만 질의 파라미터를 그대로 넘기면
 *    되고, 부르는 쪽(page.tsx·액션)은 안 바뀐다(§격리막).
 * ⚠️ 검색·필터도 **여기서** 건다. 화면에서 걸면 지금 받아 온 페이지 안에서만 찾게 되어,
 *    "없습니다"가 거짓말이 된다.
 */
export async function getManagedMembersPage(
  query: MemberQuery,
  page: number,
  pageSize: number = MEMBER_PAGE_SIZE,
): Promise<PaginatedResult<ManagedMember>> {
  const all = await listManagedMembers();
  return paginate(searchMembers(filterMembers(all, query.filter), query.keyword), page, pageSize);
}

/** 없는 사람이면 `null` — 화면이 `notFound()`를 부른다 */
export async function getManagedMember(id: number): Promise<ManagedMemberDetail | null> {
  if (isMock) return findMockManagedMember(id);

  // TODO(BE 협의): `GET /companies/me/members/{id}`
  throw new Error("사원 조회 API가 아직 연결되지 않았습니다.");
}

/** 이미 쓰고 있는 메일 주소 — 중복 발급을 막는다 */
export async function listMemberEmails(): Promise<string[]> {
  if (isMock) return listMockMemberEmails();

  // TODO(BE 협의): 발급 API가 서버에서 중복을 보면 이 조회는 사라진다
  throw new Error("사원 목록 조회 API가 아직 연결되지 않았습니다.");
}
