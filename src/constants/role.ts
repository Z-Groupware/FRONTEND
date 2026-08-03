/**
 * 역할과 겸직 권한.
 *
 * ⚠️ `domain.ts`에서 떼어냈다 — 권한은 정책이라 자주 바뀌는데, 한 파일에 상수를 다 넣어 두면
 *    바뀔 때마다 관계없는 상수까지 같은 diff에 딸려 온다.
 * ⚠️ 기존 import를 깨지 않으려고 `domain.ts`가 이 파일을 그대로 다시 내보낸다.
 */
/**
 * 역할 워딩은 화면에서도 영어로 노출한다(기획 확정).
 *
 * ⚠️ **`ADMIN`은 여기 없다.** Admin은 Owner·Leader·Member와 나란한 역할이 아니라
 *    사람에게 덧붙는 **부가 권한(겸직)** 이다 — `IS_ADMIN_*` 아래를 본다.
 *    한 사람은 역할 하나를 갖고, 그 위에 Admin을 겸할 수 있다.
 */
export const ROLE = {
  OWNER: "OWNER",
  LEADER: "LEADER",
  MEMBER: "MEMBER",
  /** Z 서비스 자체 운영 — 확장(데모 제외) */
  SYSTEM: "SYSTEM",
} as const;
export type Role = (typeof ROLE)[keyof typeof ROLE];

/**
 * **Admin — 역할이 아니라 겸직 권한이다.**
 *
 * ⚠️ 계정 발급·회의실 관리처럼 **운영에 해당하는 일**만 여기서 나온다.
 *    회의 개설·액션 조회 같은 건 그 사람의 **역할**이 정한다 — Admin을 켠다고 늘지 않는다.
 * ⚠️ **Owner는 겸할 수 없다**(팀 확정). 실제로 겸직 가능한 건 Leader·Member뿐이다.
 * ⚠️ 직급이 아니라 **사람에게 직접** 붙인다 — 여러 사원이 같은 직급을 쓰므로
 *    직급에 매핑하면 관리자가 통째로 늘어난다.
 */
export const ADMIN_LABEL = "Admin";
export const ADMIN_SCOPE_LABEL = "계정·회의실·직급 권한 관리";

/** Admin을 겸할 수 있는 역할 — Owner와 System은 제외된다 */
export const ADMIN_ELIGIBLE_ROLES = [ROLE.LEADER, ROLE.MEMBER] as const;

/** 화면 표기 — 역할은 한글로 번역하지 않는다. */
export const ROLE_LABEL: Record<Role, string> = {
  OWNER: "Owner",
  LEADER: "Leader",
  MEMBER: "Member",
  SYSTEM: "System",
};

/** 권한 범위를 한 줄로 설명한 것. 직급·권한 매핑 화면의 범례에 쓴다. */
export const ROLE_SCOPE_LABEL: Record<Role, string> = {
  OWNER: "기업 전체 관리",
  LEADER: "팀 현황·액션 관리",
  MEMBER: "일반 사용",
  SYSTEM: "Z 서비스 운영",
};

/** 사원에게 부여할 수 있는 역할. `SYSTEM`은 서비스 운영자라 기업이 고를 수 없다. */
export const ASSIGNABLE_ROLES = [ROLE.OWNER, ROLE.LEADER, ROLE.MEMBER] as const;

/**
 * **직급에 매핑할 수 있는 역할.**
 *
 * `OWNER`는 기업당 1명이고 **기업 승인 시 시스템이 계정을 발급해 대표에게 메일로 보낸다.**
 * 여러 사원이 같은 직급을 쓰므로 직급에 매핑하면 인원이 늘어난다 — 그래서 직급 매핑 대상이 아니다.
 * ⚠️ Admin은 애초에 역할이 아니라 겸직 권한이라 이 목록에 들어올 일이 없다.
 *    한 사람이 Leader이면서 Admin일 수 있고, 계정을 나눠 쓰지 않는다.
 */
export const POSITION_ROLES = [ROLE.LEADER, ROLE.MEMBER] as const;
