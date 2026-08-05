import type { DashboardMeeting } from "@/components/common/dashboard-meeting-item";
import type { MemberStatus, ProjectStatus } from "@/constants/domain";

export interface OwnerDashboardProject {
  id: string;
  name: string;
  tag: string;
  /** 자유 HEX(프로젝트 태그 색) — 고정 팔레트로 강제하지 않는다 */
  color: string;
  dueDate: string;
  status: ProjectStatus;
}

export interface OwnerDashboardLeaderRow {
  id: string;
  name: string;
  email: string;
  department: string;
  status: MemberStatus;
  /** 휴직 상태일 때만 채워지는 기간 문자열(예: "8월 1일~15일"). 재직이면 null */
  leavePeriod: string | null;
}

export interface OwnerDashboardOverview {
  projects: OwnerDashboardProject[];
  activeMemberCount: number;
  onLeaveMemberCount: number;
  leaderRows: OwnerDashboardLeaderRow[];
  /** Owner 주최 프로젝트 회의만 (2절) — 팀 액션 회의는 여기 안 나온다. 개설 라벨은 "Owner" */
  projectMeetings: DashboardMeeting[];
}
