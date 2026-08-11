import type { ActionStatus } from "@/constants/domain";
import type { MemberAction } from "@/features/member/types";
import { type BeAttachment, toProjectAttachment } from "@/features/project/mapper";
import type { TeamActionDetail } from "@/features/project/types";

import type { MyActionListItem, PersonalActionDetail, TeamActionProjectGroup } from "./types";

/**
 * BE shape → UI 계약 (§Mock 격리막).
 * [확인] 잇다(Z) REST API 연동 가이드 최종본(2026-08-10) + BACKEND 실코드 대조
 *   `action/presentation/api/response/{ActionSummaryResponse,ActionDetailResponse}.java`
 *
 * ⚠️ `description`·`projectId`·`projectName`은 2026-08-11 이홍근 요청으로 추가됨(내 액션
 *    리스트·프로젝트별 그룹핑용). `projectName`은 목록 2경로(개인·팀 액션 목록)에서만 채워지고
 *    타임라인·회의별 조회에서는 "이미 그 화면 안이라 중복"이라 `null`로 온다.
 */
export interface BeActionSummary {
  id: number;
  actionType: "PERSONAL" | "TEAM";
  title: string;
  description: string;
  status: ActionStatus;
  /** "아직 시작 안 함" 액션은 `null`이 정상이다(마이그레이션 문제 아님, BE 주석 확인). */
  startDate: string | null;
  dueDate: string;
  needsReview: boolean;
  isDelayed: boolean;
  assigneeName: string | null;
  projectId: number;
  projectTag: string | null;
  projectName: string | null;
  teamName: string | null;
  sourceMeetingTitle: string | null;
  parentActionId: number | null;
  parentActionTitle: string | null;
}

/**
 * 보드 카드가 요구하는 `startDate`는 `null`을 못 받는다(`getBoardColumn`이 문자열로 가정) —
 * 시작 전 액션은 "아직 시작 안 함"이 곧 **할일 칸**이라는 뜻이므로, 오늘보다 하루 뒤 날짜로
 * 채워 항상 할일 칸에 떨어지게 한다(프로젝트 쪽 "과거 기록 없음 → 진행중으로 본다"와는
 * 정반대 방향 — 여기는 "시작 안 한 게 확실"이라 근거가 있다).
 */
export function fallbackActionStartDate(startDate: string | null): string {
  if (startDate) return startDate;
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().slice(0, 10);
}

/**
 * 팀 액션 상세의 타임라인 탭(`GET /api/team/actions/{id}?tab=timeline`) 한 줄 → UI 계약.
 * ⚠️ `assigneeRoleLabel`은 못 채운다 — `ActionSummaryResponse`에 직급 라벨이 없다(이름만 옴).
 *    타입이 optional이라 없어도 화면은 이름만 보여주는 쪽으로 정상 동작한다.
 */
export function toTeamActionPersonalItem(be: BeActionSummary): {
  id: number;
  title: string;
  assigneeName: string;
  startDate: string;
  dueDate: string;
  status: ActionStatus;
} {
  return {
    id: be.id,
    title: be.title,
    assigneeName: be.assigneeName ?? "",
    startDate: fallbackActionStartDate(be.startDate),
    dueDate: be.dueDate,
    status: be.status,
  };
}

/**
 * 사원 대시보드 "처리할 액션" 타임라인 한 줄(`GET /api/actions`) → UI 계약.
 * ⚠️ **TEAM 타입은 걸러야 한다** — 이 대시보드는 "내" 개인 액션만 보여준다(호출자는
 *    `GET /api/actions`로 이미 본인 소유분만 받지만, 그중에서도 PERSONAL만 남긴다).
 */
export function toMemberAction(be: BeActionSummary): MemberAction {
  return {
    id: String(be.id),
    title: be.title,
    projectTag: be.projectTag ?? "",
    status: be.status,
    startDate: fallbackActionStartDate(be.startDate),
    dueDate: be.dueDate,
  };
}

/**
 * 내 액션 리스트(`/app/my/actions`) 한 줄(`GET /api/actions`) → UI 계약.
 * ⚠️ `team`은 `teamName`이 없으면(수동 추가 등) "-"로 채운다 — 배지에 빈 문자열을 그대로
 *    보여주면 빈 배지처럼 보인다.
 */
export function toMyActionListItem(be: BeActionSummary): MyActionListItem {
  return {
    id: be.id,
    title: be.title,
    description: be.description,
    team: be.teamName ?? "-",
    projectId: be.projectId,
    projectName: be.projectName ?? "",
    projectTag: be.projectTag ?? "",
    startDate: fallbackActionStartDate(be.startDate),
    dueDate: be.dueDate,
    status: be.status,
  };
}

/**
 * 팀 액션 목록(`GET /api/team/actions`) → 프로젝트별 그룹.
 * ⚠️ 목록 순서를 유지한 채 `projectId`로 묶는다(첫 등장 순서가 그룹 순서다).
 */
export function groupTeamActionsByProject(items: BeActionSummary[]): TeamActionProjectGroup[] {
  const groups = new Map<number, TeamActionProjectGroup>();
  for (const be of items) {
    let group = groups.get(be.projectId);
    if (!group) {
      group = {
        projectId: be.projectId,
        projectName: be.projectName ?? "",
        projectTag: be.projectTag ?? "",
        teamActions: [],
      };
      groups.set(be.projectId, group);
    }
    group.teamActions.push({
      id: be.id,
      name: be.title,
      startDate: fallbackActionStartDate(be.startDate),
      dueDate: be.dueDate,
      status: be.status,
    });
  }
  return [...groups.values()];
}

/**
 * 개인 액션 상세(`GET /api/actions/{id}`) 응답.
 * [확인] `ActionDetailResponse.java`(2026-08-11, 이홍근 요청 필드 4개 반영·PR #337 머지 완료)
 *
 * ⚠️ `sourceMeetingId`·`parentActionId`가 전부 `null`일 수 있다 — `POST /api/actions`(예외
 *    경로)로 수동 추가한 액션은 출처 회의도 상위 팀 액션도 없다. 목 시절엔 항상 있다고
 *    가정했던 값들이라 매퍼에서 그 경우를 반드시 갈라야 한다(§정직성 — 없는 값을 지어내지 않는다).
 */
export interface BeActionDetail {
  id: number;
  projectId: number;
  title: string;
  description: string;
  status: ActionStatus;
  startDate: string | null;
  dueDate: string;
  needsReview: boolean;
  assigneeName: string;
  /** 역할(sub_team) 미지정이면 `null`. */
  assigneeRoleLabel: string | null;
  projectTag: string;
  projectName: string;
  teamName: string;
  parentActionId: number | null;
  parentActionTitle: string | null;
  parentActionTeamName: string | null;
  parentActionDueDate: string | null;
  sourceMeetingId: number | null;
  sourceMeetingTitle: string | null;
  /** ISO datetime, `LocalDateTime` 문자열 그대로 온다. */
  sourceMeetingScheduledAt: string | null;
}

export function toPersonalActionDetail(be: BeActionDetail): PersonalActionDetail {
  return {
    id: be.id,
    name: be.title,
    description: be.description,
    team: be.teamName,
    projectId: be.projectId,
    projectTag: be.projectTag,
    assigneeName: be.assigneeName,
    assigneeRoleLabel: be.assigneeRoleLabel ?? undefined,
    sourceMeeting:
      be.sourceMeetingId !== null && be.sourceMeetingTitle && be.sourceMeetingScheduledAt
        ? {
            id: be.sourceMeetingId,
            title: be.sourceMeetingTitle,
            scheduledAt: be.sourceMeetingScheduledAt,
          }
        : undefined,
    parentTeamAction:
      be.parentActionId !== null &&
      be.parentActionTitle !== null &&
      be.parentActionTeamName !== null &&
      be.parentActionDueDate !== null
        ? {
            id: be.parentActionId,
            name: be.parentActionTitle,
            team: be.parentActionTeamName,
            dueDate: be.parentActionDueDate,
          }
        : undefined,
  };
}

/**
 * 팀 액션 상세(`GET /api/team/actions/{id}`) 응답.
 * [확인] `TeamActionDetailResponse.java`(2026-08-11, BACKEND PR #339 머지 완료)
 *
 * ⚠️ `assigneeName`·`assigneeRoleLabel`은 **저장된 값이 아니라 BE가 그 팀의 현재 팀장을
 *    그때그때 유도**해서 채운다(`"{팀명}장"` 고정 포맷도 BE가 조립) — 팀장 공석이면 둘 다
 *    `null`(정상 상태). `sourceMeetingId`도 없을 수 있다(수동 추가된 팀 액션 등).
 */
export interface BeTeamActionDetail {
  id: number;
  projectId: number;
  title: string;
  description: string;
  status: ActionStatus;
  dueDate: string;
  projectTag: string;
  teamName: string;
  assigneeName: string | null;
  assigneeRoleLabel: string | null;
  sourceMeetingId: number | null;
  sourceMeetingTitle: string | null;
  sourceMeetingScheduledAt: string | null;
  attachments: BeAttachment[];
}

export function toTeamActionDetail(be: BeTeamActionDetail): TeamActionDetail {
  return {
    id: be.id,
    name: be.title,
    description: be.description,
    team: be.teamName,
    projectId: be.projectId,
    projectTag: be.projectTag,
    assigneeName: be.assigneeName ?? undefined,
    assigneeRoleLabel: be.assigneeRoleLabel ?? undefined,
    sourceMeeting:
      be.sourceMeetingId !== null && be.sourceMeetingTitle && be.sourceMeetingScheduledAt
        ? {
            id: be.sourceMeetingId,
            title: be.sourceMeetingTitle,
            scheduledAt: be.sourceMeetingScheduledAt,
          }
        : undefined,
    attachments: be.attachments.map(toProjectAttachment),
  };
}
