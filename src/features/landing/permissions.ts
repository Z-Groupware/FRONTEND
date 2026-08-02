/**
 * 역할 × 기능 표.
 *
 * ⚠️ **명세(§1~4)에 있는 것만 적는다.** 없는 기능을 표에 넣으면 그게 거짓말이 된다.
 * ⚠️ `"partial"`은 "되긴 되는데 범위가 좁다"는 뜻이다 — 조건을 `note`에 반드시 적는다.
 *    조건 없이 세모만 두면 읽는 사람이 무엇이 다른지 알 수 없다.
 */
export type Access = "yes" | "no" | "partial";

export interface PermissionRow {
  feature: string;
  owner: Access;
  admin: Access;
  leader: Access;
  member: Access;
  /** `partial`이 있으면 무엇이 다른지 적는다 */
  note?: string;
}

export interface PermissionGroup {
  title: string;
  rows: readonly PermissionRow[];
}

export const ROLE_COLUMNS = ["Owner", "Admin", "Leader", "Member"] as const;

export const PERMISSION_GROUPS: readonly PermissionGroup[] = [
  {
    title: "화면 접근",
    rows: [
      { feature: "내 업무", owner: "yes", admin: "yes", leader: "yes", member: "yes" },
      { feature: "팀 관리", owner: "yes", admin: "no", leader: "yes", member: "no" },
      { feature: "회사 운영", owner: "yes", admin: "yes", leader: "no", member: "no" },
    ],
  },
  {
    title: "프로젝트",
    rows: [
      { feature: "생성", owner: "yes", admin: "no", leader: "no", member: "no" },
      {
        feature: "기획 열람",
        owner: "yes",
        admin: "no",
        leader: "no",
        member: "no",
        note: "Leader·Member는 타임라인만 봅니다",
      },
      { feature: "타임라인 조회", owner: "yes", admin: "no", leader: "yes", member: "yes" },
    ],
  },
  {
    title: "회의",
    rows: [
      { feature: "프로젝트 회의 개설", owner: "yes", admin: "no", leader: "no", member: "no" },
      { feature: "부서 회의 개설", owner: "yes", admin: "no", leader: "yes", member: "yes" },
      { feature: "회의 참여", owner: "yes", admin: "no", leader: "yes", member: "yes" },
      {
        feature: "회의 캡처 · 종료",
        owner: "partial",
        admin: "no",
        leader: "partial",
        member: "partial",
        note: "역할과 무관하게 그 회의를 연 사람만 할 수 있어요",
      },
    ],
  },
  {
    title: "액션",
    rows: [
      { feature: "팀 액션 보기", owner: "yes", admin: "no", leader: "yes", member: "no" },
      { feature: "내 액션 보기", owner: "yes", admin: "no", leader: "yes", member: "yes" },
      { feature: "인수인계로 재배정", owner: "no", admin: "no", leader: "yes", member: "no" },
    ],
  },
  {
    title: "인수인계",
    rows: [
      {
        feature: "신청",
        owner: "no",
        admin: "yes",
        leader: "partial",
        member: "yes",
        note: "Leader는 휴직만 됩니다 — 오프보딩은 신청할 수 없어요",
      },
      { feature: "중간 승인", owner: "no", admin: "no", leader: "yes", member: "no" },
      { feature: "최종 승인", owner: "yes", admin: "yes", leader: "no", member: "no" },
    ],
  },
  {
    title: "관리",
    rows: [
      { feature: "계정 발급", owner: "no", admin: "yes", leader: "no", member: "no" },
      { feature: "직급 · 권한 변경", owner: "yes", admin: "yes", leader: "no", member: "no" },
      { feature: "회의실 관리", owner: "no", admin: "yes", leader: "no", member: "no" },
      { feature: "구독 · 결제", owner: "yes", admin: "no", leader: "no", member: "no" },
    ],
  },
];
