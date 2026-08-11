import type { ActionStatus } from "@/constants/domain";

import type { PersonalActionDetail } from "./types";

/**
 * BE shape → UI 계약 (§Mock 격리막).
 * [확인] 잇다(Z) REST API 연동 가이드 최종본(2026-08-10) + BACKEND 실코드 대조
 *   `action/presentation/api/response/{ActionSummaryResponse,ActionDetailResponse}.java`
 */
export interface BeActionSummary {
  id: number;
  actionType: "PERSONAL" | "TEAM";
  title: string;
  status: ActionStatus;
  /** "아직 시작 안 함" 액션은 `null`이 정상이다(마이그레이션 문제 아님, BE 주석 확인). */
  startDate: string | null;
  dueDate: string;
  needsReview: boolean;
  isDelayed: boolean;
  assigneeName: string | null;
  projectTag: string | null;
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
      be.sourceMeetingTitle && be.sourceMeetingScheduledAt
        ? { title: be.sourceMeetingTitle, scheduledAt: be.sourceMeetingScheduledAt }
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
