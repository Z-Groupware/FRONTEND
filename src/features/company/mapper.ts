import type { AssignableRole } from "@/features/onboarding/types";

import type { CompanyProfile, DepartmentNode, Position } from "./types";

/**
 * BE shape → UI 계약 (§Mock 격리막 — 흡수하는 곳은 여기 하나다).
 *
 * ⚠️ 기업 설정 화면은 **세 API에서 값을 모은다**(`/companies/me` · `/teams` · `/job-positions`).
 *    한 번에 주는 엔드포인트가 BE에 없어서다 — 그 사실을 화면이 알 필요는 없다.
 */

/** [확인] BE `CompanyProfileResponse` */
export interface BeCompanyProfile {
  companyId: number;
  code: string;
  name: string;
  businessNumber: string | null;
  representativeName: string | null;
  address: string | null;
  phone: string | null;
  plan: string;
  onboardedAt: string | null;
}

/** [확인] BE `TeamNode` */
export interface BeTeam {
  teamId: number;
  name: string;
  leaderMemberId: number | null;
  leaderName: string | null;
  memberCount: number;
}

/**
 * [확인] BE `PositionResponse` — ⚠️ **`id`가 아니라 `jobPositionId`다.**
 * 이름을 잘못 읽으면 모든 직급 id가 `undefined`가 되어, 저장할 때 전부 **새 직급으로 잡힌다**.
 */
export interface BePosition {
  jobPositionId: number;
  name: string;
  authority: string;
  description: string | null;
  memberCount: number;
}

/**
 * 기업 기본 정보.
 *
 * ⚠️ **좌표가 없다.** BE는 `address` 문자열만 들고 우리 계약은 `PickedPlace`(위도·경도)다 —
 *    지도에서 고른 자리가 **저장도 복원도 안 된다.** 주소는 남으므로 글자는 그대로 보이지만,
 *    다시 열면 핀이 사라진다. 좌표 칸이 생기기 전까지 `lat`·`lng`를 0으로 둔다
 *    (기업 등록 신청이 지도를 못 쓸 때 쓰는 것과 같은 규칙).
 * ⚠️ **`plan`을 안 쓴다.** BE가 `"FREE"`를 고정으로 내려주는데(결제 연동 전), 우리 규칙은
 *    **무료 요금제가 없다**는 것이다 — 그 값을 화면에 올리면 돈을 안 받는 것처럼 읽힌다
 *    (CLAUDE.md §요금제).
 * ⚠️ **`representativeName`·`phone`도 안 쓴다.** 우리 `CompanyProfile`에 자리가 없다 —
 *    지금 화면이 안 보여 주는 값이라 버리는 게 아니라 **아직 안 받는 것**이다.
 */
export function toCompanyProfile(profile: BeCompanyProfile): CompanyProfile {
  return {
    name: profile.name,
    businessNumber: profile.businessNumber ?? "",
    place: profile.address ? { address: profile.address, lat: 0, lng: 0 } : null,
    code: profile.code,
  };
}

/**
 * 팀 목록 → 트리.
 *
 * ⚠️ **팀은 계층이 없다**(CLAUDE.md §권한 ③ — 플랫 목록, 2026-08-06 BE 스키마 확정).
 *    `DepartmentNode`가 `children`을 들고 있는 건 온보딩과 타입을 공유해서지, 팀이 중첩된다는
 *    뜻이 아니다 — 항상 빈 배열이다.
 * ⚠️ **팀장(`leaderMemberId`·`leaderName`)을 못 담는다.** 우리 노드에 자리가 없어 지금은
 *    버린다 — 화면에 팀장이 안 보이는 건 그래서다.
 */
export function toDepartmentNode(team: BeTeam): DepartmentNode {
  return { id: String(team.teamId), name: team.name, children: [] };
}

export function toTeamMemberCounts(teams: BeTeam[]): Record<string, number> {
  return Object.fromEntries(teams.map((team) => [String(team.teamId), team.memberCount]));
}

/**
 * 직급.
 * ⚠️ 모르는 권한이 오면 가장 낮은 쪽으로 떨어뜨린다 — 권한은 넘겨짚으면 안 되는 값이다(§권한).
 */
export function toPosition(position: BePosition): Position {
  const role: AssignableRole = position.authority === "LEADER" ? "LEADER" : "MEMBER";
  /*
    ⚠️ **`description`을 들고 다닌다.** BE가 `@NotBlank`로 필수라 저장할 때 다시 보내야 하는데,
       여기서 버리면 왕복 한 번에 남의 설명이 지워진다 — 화면이 안 보여 주는 값이라도
       **되돌려 보낼 책임**은 남는다.
  */
  return {
    id: String(position.jobPositionId),
    name: position.name,
    role,
    description: position.description ?? "",
  };
}
