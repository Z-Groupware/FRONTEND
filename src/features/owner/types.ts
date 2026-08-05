import type { MeetingStatus, MemberStatus, ProjectStatus } from "@/constants/domain";

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

export interface OwnerDashboardMeeting {
  id: string;
  title: string;
  projectTag: string;
  color: string;
  status: MeetingStatus;
  /** 회의실 장소 이름(예: "회의실 A") */
  room: string;
  scheduledAt: string;
  attendeeCount: number;
}

export interface OwnerDashboardOverview {
  projects: OwnerDashboardProject[];
  activeMemberCount: number;
  onLeaveMemberCount: number;
  leaderRows: OwnerDashboardLeaderRow[];
  /** Owner 주최 프로젝트 회의만 (2절) — 팀 액션 회의는 여기 안 나온다 */
  projectMeetings: OwnerDashboardMeeting[];
}
