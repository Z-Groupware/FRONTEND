import type { ProjectStatus } from "@/constants/domain";
import { hexFromTagName } from "@/lib/palette";

import type {
  ProjectAttachment,
  ProjectDetail,
  ProjectDraft,
  ProjectListItem,
  ProjectTeamAction,
} from "./types";

/**
 * BE shape → UI 계약 (§Mock 격리막 — 흡수하는 곳은 여기 하나다).
 * [확인] 잇다(Z) REST API 연동 가이드 최종본(2026-08-10) + BACKEND 실코드 대조
 *   `project/presentation/api/response/{ProjectSummaryResponse,ProjectDetailResponse}.java`
 */

/** [확인] `ProjectSummaryResponse` */
export interface BeProjectSummary {
  id: number;
  tag: string;
  color: string;
  name: string;
  /** 목록 카드 첫 줄 요약용 — 2026-08-11 이홍근 요청으로 추가됨. */
  description: string;
  status: ProjectStatus;
  /** 마이그레이션 이전 생성 프로젝트는 `null` — 채울 원천이 없다. */
  startDate: string | null;
  dueDate: string;
  teamCount: number;
  actionCount: number;
  completedActionCount: number;
  meetingCount: number;
  progressPct: number;
  /** 생성·수정 응답에서는 항상 빈 배열 — 실제 값은 목록 조회에서만 온다. */
  teamNames: string[];
}

/** [확인] `AttachmentResponse` */
export interface BeAttachment {
  attachmentId: number;
  fileName: string;
  /** 브라우저로 못 여는 S3 오브젝트 키 — 다운로드는 별도 발급 API를 거친다. */
  fileUrl: string;
  fileSize: number;
  createdAt: string;
}

/** [확인] `ProjectDetailResponse` */
export interface BeProjectDetail {
  id: number;
  tag: string;
  color: string;
  name: string;
  description: string;
  status: ProjectStatus;
  startDate: string | null;
  dueDate: string;
  teamIds: number[];
  attachments: BeAttachment[];
}

/** [확인] `ProjectTimelineItemResponse` */
export interface BeProjectTimelineItem {
  actionId: number;
  title: string;
  teamId: number;
  teamName: string;
  status: ProjectStatus;
  dueDate: string;
  isDelayed: boolean;
}

/** [확인] `PageResponse<T>` — 목록 3종(project·action·team action) 공용 봉투. */
export interface BePageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  hasNext: boolean;
}

/**
 * ⚠️ **`startDate`가 `null`이면 오늘로 대신 채운다.** 보드 칸 구분(`getBoardColumn`)이
 *    `Pick<..,"startDate">`를 문자열로 가정하고 있어 `null`을 그대로 넘기면 계산이 깨진다.
 *    마이그레이션 이전에 만들어진 프로젝트라 기록이 없을 뿐이니, "이미 진행 중이었다"로 보고
 *    오늘 날짜를 넣어 진행중 칸에 들어가게 한다(할일 칸으로 잘못 떨어지는 것보다 안전한 쪽).
 */
function fallbackStartDate(startDate: string | null): string {
  return startDate ?? new Date().toISOString().slice(0, 10);
}

export function toProjectListItem(be: BeProjectSummary): ProjectListItem {
  return {
    id: be.id,
    name: be.name,
    // ⚠️ 2026-08-11 해결 — ProjectSummaryResponse에 description 추가됨(이홍근 요청).
    description: be.description,
    tag: be.tag,
    departments: be.teamNames,
    actionTotal: be.actionCount,
    actionDone: be.completedActionCount,
    startDate: fallbackStartDate(be.startDate),
    dueDate: be.dueDate,
    status: be.status,
  };
}

/** 팀 액션 상세(action 도메인)도 같은 `Attachment` shape을 복제해서 쓴다 — 그쪽 매퍼가 재사용한다. */
export function toProjectAttachment(be: BeAttachment): ProjectAttachment {
  return { id: be.attachmentId, fileName: be.fileName, fileSize: be.fileSize };
}

export function toProjectDetail(be: BeProjectDetail, teamNames: string[]): ProjectDetail {
  return {
    id: be.id,
    tag: be.tag,
    name: be.name,
    description: be.description,
    dueDate: be.dueDate,
    // ⚠️ 상세 응답(ProjectDetailResponse)엔 teamIds만 있고 teamNames가 없다 — 팀 목록을
    //    따로 조회해 id→이름으로 매핑한 값을 호출부가 넘긴다(server.ts 참고).
    teamNames,
    attachments: be.attachments.map(toProjectAttachment),
  };
}

export function toProjectTeamAction(be: BeProjectTimelineItem): ProjectTeamAction {
  return {
    id: be.actionId,
    name: be.title,
    team: be.teamName,
    // ⚠️ 타임라인 항목엔 startDate가 없다(팀 액션 카드는 진행률만 보여줄 뿐 기간 바가 아니다) —
    //    ActionTimeline 계약이 요구해서 마감일과 같은 값으로 채운다(막대 폭이 0이 되는 대신
    //    한 칸짜리로 보인다). 팀 액션에 startDate가 필요해지면 그때 BE에 노출을 요청한다.
    startDate: be.dueDate,
    dueDate: be.dueDate,
    status: be.status,
  };
}

/** 프로젝트 생성/수정 요청 바디. */
export interface CreateProjectRequestBody {
  name: string;
  tag: string;
  description: string;
  color: string;
  startDate: string;
  dueDate: string;
  teamIds: number[];
}

/**
 * 화면 계약(`ProjectDraft`) → BE 요청 바디.
 * ⚠️ `teamIds`는 호출부가 이름→id로 미리 바꿔 넘긴다(팀 이름 중복이 없다는 전제 — 지금
 *    회사 팀 목록엔 동명이 없어 괜찮지만, 생기면 이 가정부터 깨진다).
 */
export function toCreateProjectRequestBody(
  draft: ProjectDraft,
  teamIds: number[],
): CreateProjectRequestBody {
  return {
    name: draft.name,
    tag: draft.tag,
    description: draft.description,
    color: hexFromTagName(draft.tagColor),
    startDate: draft.startDate,
    dueDate: draft.dueDate,
    teamIds,
  };
}
