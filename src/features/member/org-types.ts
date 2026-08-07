import type { Authority } from "@/constants/authority";
import type { MemberStatus } from "@/constants/member";

/**
 * 구성원 조직도의 **UI 계약**(`/app/people`).
 *
 * ⚠️ 같은 폴더에 `types.ts`(내 대시보드)·`manage-types.ts`(사원 관리)가 이미 있다.
 *    파일을 또 나눈 건 **보는 사람이 다르기** 때문이다 — 사원 관리는 Owner·Admin이
 *    사람을 **고치러** 오는 곳이고, 여기는 전 구성원이 조직을 **보러** 오는 곳이다.
 * ⚠️ 그래서 여기 담기는 값이 더 적다. 이메일·입사일·겸직 여부는 안 싣는다 —
 *    조직 구조를 보는 데 필요 없고, 전원이 보는 화면이라 덜 내보내는 편이 맞다.
 * ⚠️ 명부 자체는 **사원 관리와 같은 것**을 읽는다(`mock/managed.ts`). 두 벌로 들고 있으면
 *    같은 회사가 화면마다 달라 보인다.
 */

/** 조직도에 서는 사람 한 명 */
export interface OrgMember {
  id: number;
  name: string;
  /** 직급(사원·대리·팀장 …) — 회사마다 다르게 쓰는 이름이다 */
  position: string;
  /**
   * 팀 안에서 맡는 세부 역할(프론트엔드 등). 안 붙였으면 `null`.
   *
   * ⚠️ **계층이 아니라 라벨**이다(WORKFLOW §9). 사원 관리 목록이 이미 컬럼으로 갖고 있는
   *    값이고, 여기서 빠뜨리면 같은 사람이 화면마다 다르게 보인다.
   */
  roleLabel: string | null;
  /**
   * 시스템 접근 권한.
   *
   * ⚠️ 화면은 **구조상 자리(Owner·Leader)만** 표식을 단다 — Member는 기본값이라 전원에게
   *    달면 아무것도 안 알린다. Admin 겸직은 여기 없다(권한이 아니라 덧붙는 플래그이고,
   *    조직 구조와 무관하다).
   */
  authority: Authority;
  status: MemberStatus;
}

/**
 * 팀 하나.
 *
 * ⚠️ 팀은 **계층이 없는 플랫 목록**이다(CLAUDE.md §권한 ③). 그래서 자식 팀이 없고,
 *    조직도가 깊어지지 않는다 — 대표 한 단, 팀 한 단이 전부다.
 */
export interface OrgTeam {
  name: string;
  /** ⚠️ **리더가 맨 앞**이다(`buildOrgChart`가 세운다). 팀당 리더는 한 명이다 */
  members: OrgMember[];
}

/** 조직도 전체 */
export interface OrgChart {
  /**
   * 대표 — 회사에 하나다.
   * ⚠️ 명부에 없을 수도 있어(연동 전·데이터가 덜 찼을 때) `null`을 허용한다. 화면은 그때
   *    대표 자리를 비우고 팀만 그린다 — 없는 사람을 지어내지 않는다(§정직성).
   */
  owner: OrgMember | null;
  teams: OrgTeam[];
  /** 조직도에 실제로 그려진 사람 수 — 대표를 포함한다 */
  totalCount: number;
}

/**
 * 팀이 없는 사람을 묶는 자리.
 *
 * ⚠️ **조용히 빠뜨리지 않으려고 둔다**(§정직성). 팀이 없는 건 원래 대표뿐이라 여기에
 *    사람이 담기면 명부가 이상한 것인데, 안 그리면 전체 인원과 조직도에 보이는 수가
 *    어긋나 아무도 못 알아챈다. 그리면 눈에 띈다.
 */
export const NO_TEAM_LABEL = "소속 없음";
