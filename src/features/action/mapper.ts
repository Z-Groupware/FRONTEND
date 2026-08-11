import type { ActionStatus } from "@/constants/domain";

/**
 * BE shape → UI 계약 (§Mock 격리막).
 * [확인] 잇다(Z) REST API 연동 가이드 최종본(2026-08-10) + BACKEND 실코드 대조
 *   `action/presentation/api/response/ActionSummaryResponse.java`
 *
 * ⚠️ **상세(`PersonalActionDetail`) 쪽 매퍼는 아직 없다** — `ActionDetailResponse`에
 *    화면이 쓰는 4개 값(projectId·assigneeRoleLabel·sourceMeeting.scheduledAt·
 *    parentTeamAction.team/dueDate)이 없어서 BE에 추가 요청해 둔 상태다(2026-08-10).
 *    그 답이 오기 전까지 이 파일은 목록(보드)에서 쓰는 요약 응답만 다룬다.
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
