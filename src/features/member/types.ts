import type { DashboardMeeting } from "@/components/common/dashboard-meeting-item";
import type { ActionStatus } from "@/constants/domain";

/**
 * 내 액션 한 건. ⚠️ 담당자·팀명은 담지 않는다 — 내 대시보드에선 담당자=항상 나,
 * 팀명=항상 내 팀이라 중복·노이즈다. 어느 프로젝트에서 나온 일인지(`projectTag`)만 남긴다.
 */
export interface MemberAction {
  id: string;
  title: string;
  projectTag: string;
  /** 자유 HEX(프로젝트 태그 색) */
  color: string;
  status: ActionStatus;
  dueDate: string;
}

export interface MemberDashboardOverview {
  /** 마감 7일 이내(연체 포함)·미완료인 내 액션 — 마감 임박순. 개수 제한 없음(박스 내부 스크롤) */
  dueSoonActions: MemberAction[];
  /** 내가 참석자로 지정된 회의 최신 5건 */
  attendedMeetings: DashboardMeeting[];
}
