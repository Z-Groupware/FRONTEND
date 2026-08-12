import { AI_CONFIDENCE } from "@/constants/meeting";

import { formatMeetingSchedule } from "../lib";
import { type BeMeetingDetail, hostIdOf } from "../mapper";
import type { AiActionDraft, AssigneeOption, MeetingReviewInfo, PendingReviewSummary } from "./types";

/**
 * 검토 화면(RVW-01) BE 응답 → UI 계약 매퍼.
 *
 * [확인] `capture/presentation/api/response/ActionReviewResponse.java` (2026-08-12 실코드 대조)
 *
 * ⚠️ **RVW-01에는 회의 머리 정보가 없다**(제목·일정·프로젝트·참석자). 그건 회의 상세
 *    (MEET-04, `BeMeetingDetail`)가 들고 있어 두 응답을 합쳐 한 판(`MeetingReviewInfo`)을
 *    만든다 — 호출은 `server.ts`가 병렬로 하고, 합치는 일은 여기 한 곳이다(§격리막).
 * ⚠️ **`null`을 기본값으로 채우지 않는다**(BE 응답 주석과 같은 판단). `gate`가 null이면
 *    "게이트를 안 지났다"(수동 추가)이지 "게이트가 떨어뜨렸다"가 아니고, `speakerName`이
 *    null이면 화자 판정을 포기한 발화다 — 인용만 보여주고 이름을 지어내지 않는다.
 */

/* ───────── BE shape (RVW-01) ───────── */

export interface BeReviewEvidence {
  transcriptId: number;
  /** L1이 화자 판정을 포기한 발화는 null — 정상이다 */
  speakerName: string | null;
  content: string;
  startOffsetMs: number | null;
}

export interface BeReviewGate {
  autoConfirmed: boolean;
  /** 신호 4종 — 화면은 아직 안 그리지만 모양 검사는 통과시킨다(안 읽는 필드는 검사 안 함) */
  signals: unknown;
}

export interface BeReviewAction {
  actionId: number;
  /** 담당자 미정이면 null — 숨기지 말고 "담당자 미정"으로 보여야 한다(BE 주석) */
  assigneeMemberId: number | null;
  title: string;
  /** UI의 `description`에 해당 — BE 필드명은 `detail`이다 */
  detail: string | null;
  dueDate: string;
  /** 이 기한이 회의에서 나온 게 아니라 **프로젝트 마감일로 채워진 것**인지 */
  dueDateDefaulted: boolean;
  isManual: boolean;
  /** `PENDING` · `HUMAN_CONFIRMED` · `REJECTED` */
  reviewStatus: string;
  evidence: BeReviewEvidence | null;
  /** 수동 추가 건은 게이트를 안 지나 통째로 null이다 */
  gate: BeReviewGate | null;
}

export interface BeActionReview {
  actionsByPerson: {
    /** 담당자 미정 묶음은 null */
    memberId: number | null;
    name: string;
    actions: BeReviewAction[];
  }[];
  needsReview: { count: number; actionIds: number[] };
  /** 확정 전이면 null — 이 값 하나가 "이미 확정된 회의" 판정이다 */
  dispatchedAt: string | null;
}

/* ───────── 모양 검사 ───────── */

function isBeReviewAction(value: unknown): value is BeReviewAction {
  if (typeof value !== "object" || value === null) return false;
  const action = value as Partial<BeReviewAction>;
  return (
    typeof action.actionId === "number" &&
    (action.assigneeMemberId === null || typeof action.assigneeMemberId === "number") &&
    typeof action.title === "string" &&
    typeof action.dueDate === "string" &&
    typeof action.isManual === "boolean" &&
    typeof action.reviewStatus === "string"
  );
}

/**
 * 읽기 전에 한 번 본다 — 회의 상세 매퍼(`parseMeetingDetail`)와 같은 이유다.
 * ⚠️ **화면이 실제로 읽는 필드만** 검사한다. 전부 검사하면 BE가 무관한 필드를 바꿀 때마다
 *    멀쩡한 화면이 막힌다.
 */
export function parseActionReview(raw: unknown): BeActionReview {
  if (typeof raw !== "object" || raw === null) {
    throw new Error("검토 응답이 우리가 아는 모양이 아닙니다");
  }
  const review = raw as Partial<BeActionReview>;
  const isValid =
    Array.isArray(review.actionsByPerson) &&
    review.actionsByPerson.every(
      (person) =>
        typeof person === "object" &&
        person !== null &&
        Array.isArray(person.actions) &&
        person.actions.every(isBeReviewAction),
    ) &&
    typeof review.needsReview === "object" &&
    review.needsReview !== null &&
    Array.isArray(review.needsReview.actionIds) &&
    (review.dispatchedAt === null || typeof review.dispatchedAt === "string");

  if (!isValid) throw new Error("검토 응답이 우리가 아는 모양이 아닙니다");
  return review as BeActionReview;
}

/* ───────── 변환 ───────── */

/** `startOffsetMs` → `MM:SS`. null이면 빈 문자열 — 시각을 지어내지 않는다 */
export function toClock(startOffsetMs: number | null): string {
  if (startOffsetMs === null || startOffsetMs < 0) return "";
  const totalSeconds = Math.floor(startOffsetMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function toDraft(action: BeReviewAction, needsReviewIds: ReadonlySet<number>): AiActionDraft {
  return {
    id: String(action.actionId),
    title: action.title,
    description: action.detail ?? "",
    assigneeId: action.assigneeMemberId,
    /*
      묶음 판정은 BE `needsReview.actionIds`가 정본이다 — 게이트 신호를 여기서 다시 조합하면
      BE 판정과 갈릴 수 있다. 수동 추가 건은 게이트가 없어 목록에 안 실리지만, AI 배지를
      붙일 데이터가 없는 쪽이므로 "요약 불확실" 묶음에 둔다(기존 화면 배치 그대로).
    */
    confidence:
      action.isManual || needsReviewIds.has(action.actionId)
        ? AI_CONFIDENCE.NEEDS_REVIEW
        : AI_CONFIDENCE.HIGH,
    /*
      ⚠️ **시작일은 BE가 안 내려준다**(RVW-01 응답에 `plannedStartDate` 없음 — AI가 내지 않는
         값이라 사람이 이 화면에서 처음 정한다). 빈 값으로 시작하고, 정한 값은 확정 때
         RVW-02에 실어 보낸다(`plannedStartDate`는 CONFIRM에도 실을 수 있다 — BE 확인).
    */
    startDate: "",
    dueDate: action.dueDate,
    isDueDateDefaulted: action.dueDateDefaulted,
    evidence: action.evidence
      ? {
          speaker: action.evidence.speakerName ?? "",
          quote: action.evidence.content,
          timestamp: toClock(action.evidence.startOffsetMs),
        }
      : null,
    isManual: action.isManual,
  };
}

/** 참석자 → 담당자 드롭다운 선택지. 라벨은 "팀 · 직급" — 회의 상세 명부와 같은 조합이다 */
export function toAssigneeOptions(detail: BeMeetingDetail): AssigneeOption[] {
  return detail.attendees.map((attendee) => ({
    id: attendee.memberId,
    name: attendee.name,
    roleLabel: [attendee.teamName, attendee.jobPosition].filter(Boolean).join(" · "),
  }));
}

/**
 * 회의 상세(MEET-04) + 검토(RVW-01) → 화면 한 판.
 *
 * ⚠️ **`REJECTED`는 거른다.** 지난 확정 시도가 중간에 끊긴 회의를 다시 열면 반려해 둔
 *    항목이 서버에 남아 있는데, 그걸 다시 편집 가능한 행으로 그리면 같은 판정을 두 번 한다.
 *    확정(RVW-05)도 그 항목들은 `skipped`로 거른다 — 화면과 서버가 같은 편이다.
 */
export function toMeetingReviewInfo(params: {
  detail: BeMeetingDetail;
  review: BeActionReview;
}): MeetingReviewInfo {
  const { detail, review } = params;
  const needsReviewIds = new Set(review.needsReview.actionIds);

  return {
    meetingId: String(detail.meetingId),
    meetingTitle: detail.title,
    hostId: hostIdOf(detail),
    projectTag: detail.project.tag,
    scheduleLabel: formatMeetingSchedule(new Date(detail.startAt), new Date(detail.endAt)),
    assigneeOptions: toAssigneeOptions(detail),
    drafts: review.actionsByPerson
      .flatMap((person) => person.actions)
      .filter((action) => action.reviewStatus !== "REJECTED")
      .map((action) => toDraft(action, needsReviewIds)),
    actionsConfirmed: review.dispatchedAt !== null,
  };
}

/* ───────── 마이페이지 미확정 액션(MEET-10) — #395에서 온 매퍼를 여기로 합침 ───────── */

/**
 * `GET /api/meetings/pending-action-distributions`(MEET-10, 구현 완료) 목록 원소.
 * ⚠️ `status`·`startAt`·`project`도 오지만 마이페이지 위젯(회의 제목·액션 건수만 표시)은
 *    안 쓴다 — 안 쓰는 필드는 적지 않는다(`BeMeetingDetail`과 같은 원칙).
 */
export interface BePendingActionDistributionMeeting {
  meetingId: number;
  title: string;
  status: string;
  startAt: string;
  pendingActionCount: number;
  project: { projectId: number; tag: string; name: string };
}

export interface BePendingActionDistributionsResponse {
  meetings: BePendingActionDistributionMeeting[];
}

/**
 * 마이페이지 "미확정 액션" 목록이 받는 모양으로 바꾼다.
 * ⚠️ `meetingId`는 BE가 숫자로 주지만 화면 계약은 문자열이다(다른 회의 id와 동일 규칙).
 */
export function toPendingReviewSummary(
  be: BePendingActionDistributionMeeting,
): PendingReviewSummary {
  return {
    meetingId: String(be.meetingId),
    meetingTitle: be.title,
    actionCount: be.pendingActionCount,
  };
}
