import "server-only";

import { isVisibleMemberStatus } from "@/constants/member";
import { requireAccessToken } from "@/features/auth/session";
import { ApiError, serverApi } from "@/lib/api";
import { ep } from "@/lib/endpoints";
import { paginate, type PaginatedResult } from "@/lib/paginate";
import { isMock } from "@/mocks/config";

import { filterMembers, searchMembers } from "./manage-filter";
import {
  type BeMemberDetail,
  type BeMemberListItem,
  toBeFilter,
  toManagedMember,
} from "./manage-mapper";
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

  /*
    ⚠️ **전체를 한 번에 받는 길은 안 만든다.** 사원이 수백 명이면 그 수백을 다 받아 오게 되고,
       BE도 목록은 페이지 단위로만 연다(`GET /api/members?page&size`). 목으로 돌 때만 쓰는
       편의 함수로 남긴다 — 부르는 곳은 `getManagedMembersPage`다.
  */
  throw new Error("사원 목록은 페이지 단위로 조회합니다 — getManagedMembersPage를 쓰세요.");
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
  if (isMock) {
    const all = await listManagedMembers();
    return paginate(searchMembers(filterMembers(all, query.filter), query.keyword), page, pageSize);
  }

  /*
    ⚠️ **검색·필터·자르기를 전부 서버가 한다**(`GET /api/members`, [확인] BE `MemberController.list`).
       받아 와서 화면이 거르면 지금 페이지 안에서만 찾게 되어 "없습니다"가 거짓말이 된다.
    ⚠️ 회사는 **토큰의 `companyId`** 로 정해진다 — 파라미터로 안 보낸다. 보내면 남의 회사
       사원을 조회할 수 있는 구멍이 된다(BE도 principal에서만 읽는다).
    ⚠️ `filter`는 이름이 갈린다 — 우리 `VACATION_PENDING` ↔ BE `LEAVE_PENDING`(`toBeFilter`).
    ⚠️ **번호 기준이 다르다.** 우리 `paginate`는 1부터, BE는 **0부터**다 — 그대로 넘기면
       첫 페이지를 건너뛰고 두 번째부터 보여준다. 여기서 한 칸 내려 보내고, 돌려줄 때
       다시 올린다.
  */
  const accessToken = await requireAccessToken();
  const params = new URLSearchParams({
    filter: toBeFilter(query.filter),
    page: String(Math.max(0, page - 1)),
    size: String(pageSize),
  });
  if (query.keyword.trim()) params.set("q", query.keyword.trim());

  /*
    ⚠️ **`totalCount`다**(`totalElements` 아님 — [확인] BE `MemberPageResponse`). 이름을 잘못
       읽으면 `undefined`가 되어 `전체 N건`이 비고 `totalPages`가 `NaN`이 된다 — 다음 페이지가
       있는지 아무도 모르게 된다.
  */
  const response = await serverApi<{
    totalCount: number;
    page: number;
    size: number;
    content: BeMemberListItem[];
  }>(`${ep.members()}?${params}`, { accessToken });

  /*
    ⚠️ **지워진 사람은 여기서 뺀다**(§도메인 상수). 퇴사자(`RESIGNED`)는 남는다 — 그 사람이
       남긴 회의·액션의 출처라 이름이 사라지면 추적이 끊긴다.
    ⚠️ 거른 만큼 `totalCount`를 줄이지 않는다. 그 숫자는 **서버가 센 전체**이고, 화면의
       `전체 N건`은 그 값을 말해야 다음 페이지가 있는지와 어긋나지 않는다.
  */
  const items = response.content
    .map(toManagedMember)
    .filter((member) => isVisibleMemberStatus(member.status));

  return {
    items,
    page: response.page + 1,
    /* ⚠️ `size`가 0으로 오면 0으로 나눠 `Infinity`가 된다 — 요청한 값으로 되돌린다 */
    totalPages: Math.max(1, Math.ceil(response.totalCount / (response.size || pageSize))),
    totalCount: response.totalCount,
  };
}

/**
 * 없는 사람이면 `null` — 화면이 `notFound()`를 부른다.
 *
 * ⚠️ **탈퇴 처리된 계정도 없는 사람이다.** 목록만 거르고 상세를 안 거르면 비대칭이 생긴다 —
 *    목록에서 사라진 계정의 주소를 그대로 열 수 있고(탈퇴 직후 뒤로 가기가 흔한 길이다),
 *    상태 라벨이 빈칸으로 뜨는 데다 직급·권한 폼까지 열려서 **없는 사람에게 Admin 겸직을
 *    얹을 수 있다**. 액션들도 이 함수로 대상을 찾으므로 여기서 막으면 서버 재검사까지 함께 닫힌다.
 */
export async function getManagedMember(id: number): Promise<ManagedMemberDetail | null> {
  if (isMock) {
    const found = findMockManagedMember(id);
    return found && isVisibleMemberStatus(found.member.status) ? found : null;
  }

  /*
    [확인] BE `MemberController.detail` — `GET /api/members/{memberId}`.
    ⚠️ **액션·대기 신청은 이 응답에 없다.** BE `MemberDetailResponse`가 주는 건 사람 정보뿐이라,
       지금은 그 둘을 빈 값으로 둔다 — 지어내지 않는다(§정직성). 액션 목록 API가 붙으면
       여기서 함께 읽어 채운다.
  */
  const accessToken = await requireAccessToken();
  let detail: BeMemberDetail;
  try {
    detail = await serverApi<BeMemberDetail>(ep.member(id), { accessToken });
  } catch (error) {
    /*
      ⚠️ **모든 실패를 "없는 사람"으로 만들지 않는다.** 통신 장애나 500까지 `null`로 바꾸면
         화면이 `notFound()`를 띄워 **사원이 지워진 것처럼 보인다** — 실제로는 서버가 잠깐
         맛이 간 것이다(§정직성).
      ⚠️ 404·403만 `null`이다. 있는지 없는지를 알려 주지 않으려고 둘을 같이 묶는다.
    */
    if (error instanceof ApiError && (error.status === 404 || error.status === 403)) return null;
    throw error;
  }

  const member = toManagedMember(detail);
  if (!isVisibleMemberStatus(member.status)) return null;

  return { member, actions: [], pendingHandover: null };
}

/** 이미 쓰고 있는 메일 주소 — 중복 발급을 막는다 */
export async function listMemberEmails(): Promise<string[]> {
  if (isMock) return listMockMemberEmails();

  /*
    ⚠️ **중복 판정은 서버가 한다.** 발급 API(`POST /api/manage/members`)가 이미 쓰는 주소를
       거르므로, 전체 메일 주소를 받아 와 화면에서 비교할 이유가 없다 — 그 목록은 그 자체로
       개인정보이기도 하다. 목으로 돌 때 폼 검증을 보여 주려고 남겨 둔다.
  */
  return [];
}

/**
 * 팀별 현재 팀장 — **팀당 한 명 규칙**을 서버에서 재검사할 때 쓴다.
 *
 * ⚠️ **명부 전체를 받아 거르지 않는다.** 사원이 수백 명이면 그 수백을 다 받아 오는데,
 *    필요한 건 팀마다 한 명뿐이다 — BE의 팀 조회가 `leaderMemberId`·`leaderName`을
 *    이미 얹어 준다([확인] `TeamNodeResponse`).
 * ⚠️ 목으로 돌 때는 명부에서 뽑는다 — 목에는 팀 조회가 따로 없다.
 */
export async function getTeamLeaders(): Promise<Map<string, { id: number; name: string }>> {
  if (isMock) {
    const leaders = new Map<string, { id: number; name: string }>();
    for (const member of listMockManagedMembers()) {
      if (!member.teamName) continue;
      if (member.authority !== "LEADER") continue;
      if (member.status === "RESIGNED") continue;
      leaders.set(member.teamName, { id: member.id, name: member.name });
    }
    return leaders;
  }

  const accessToken = await requireAccessToken();
  const teams = await serverApi<
    { name: string; leaderMemberId: number | null; leaderName: string | null }[]
  >(ep.teams(), { accessToken });

  const leaders = new Map<string, { id: number; name: string }>();
  for (const team of teams) {
    if (team.leaderMemberId === null) continue;
    leaders.set(team.name, { id: team.leaderMemberId, name: team.leaderName ?? "" });
  }
  return leaders;
}
