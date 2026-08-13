import { AI_CONFIDENCE } from "@/constants/meeting";

import type { BeMeetingDetail } from "../mapper";
import {
  type BeActionReview,
  type BePendingActionDistributionMeeting,
  parseActionReview,
  toClock,
  toMeetingReviewInfo,
  toPendingReviewSummary,
} from "./mapper";

/**
 * 검토 매퍼 — BE(RVW-01 + MEET-04) → UI 계약.
 * 목이 아니라 **BE 실코드에서 옮겨 적은 shape**으로 검증한다(§연동 검증).
 */

const DETAIL: BeMeetingDetail = {
  meetingId: 7,
  title: "8월 스프린트 계획",
  status: "DONE",
  startAt: "2026-08-14T10:00:00",
  endAt: "2026-08-14T10:30:00",
  pendingActionCount: 0,
  /* ⚠️ 끝난 회의인데 `null`인 게 정상이다 — BE가 PROCESSING·DONE을 아직 못 가른다 */
  summaryStatus: null,
  project: { projectId: 3, tag: "GOODSFLOW" },
  meetingRoom: { meetingRoomId: 1, name: "회의실 A" },
  host: { memberId: 2, name: "김서준" },
  attendees: [
    { memberId: 2, name: "김서준", teamName: "개발팀", jobPosition: "팀장" },
    { memberId: 5, name: "박지호", teamName: null, jobPosition: null },
  ],
};

function makeReview(overrides?: Partial<BeActionReview>): BeActionReview {
  return {
    actionsByPerson: [
      {
        memberId: 2,
        name: "김서준",
        actions: [
          {
            actionId: 11,
            assigneeMemberId: 2,
            title: "결제 모듈 설계",
            detail: "토스 빌링키 흐름 정리",
            dueDate: "2026-08-20",
            dueDateDefaulted: false,
            isManual: false,
            reviewStatus: "PENDING",
            evidence: {
              transcriptId: 100,
              speakerName: "김서준",
              content: "결제는 제가 정리할게요",
              startOffsetMs: 754_000,
            },
            gate: { autoConfirmed: true, signals: {} },
          },
        ],
      },
      {
        // 담당자 미정 묶음 — BE가 name만 채워 내려준다
        memberId: null,
        name: "담당자 미정",
        actions: [
          {
            actionId: 12,
            assigneeMemberId: null,
            title: "회의록 공유",
            detail: null,
            dueDate: "2026-08-31",
            dueDateDefaulted: true,
            isManual: false,
            reviewStatus: "PENDING",
            evidence: {
              transcriptId: 101,
              speakerName: null,
              content: "그건 나중에 공유하죠",
              startOffsetMs: null,
            },
            gate: { autoConfirmed: false, signals: {} },
          },
          {
            actionId: 13,
            assigneeMemberId: 5,
            title: "반려된 액션",
            detail: null,
            dueDate: "2026-08-31",
            dueDateDefaulted: false,
            isManual: false,
            reviewStatus: "REJECTED",
            evidence: null,
            gate: { autoConfirmed: false, signals: {} },
          },
        ],
      },
    ],
    needsReview: { count: 1, actionIds: [12] },
    dispatchedAt: null,
    ...overrides,
  };
}

describe("parseActionReview", () => {
  it("BE shape 그대로면 통과한다", () => {
    expect(() => parseActionReview(makeReview())).not.toThrow();
  });

  it("actionsByPerson이 배열이 아니면 읽기 전에 멈춘다", () => {
    expect(() => parseActionReview({ needsReview: { count: 0, actionIds: [] } })).toThrow(
      "검토 응답이 우리가 아는 모양이 아닙니다",
    );
  });

  it("액션에 actionId가 없으면 멈춘다 — 판정 요청을 보낼 수 없는 응답이다", () => {
    const broken = makeReview();
    // @ts-expect-error 고의로 깨뜨린다
    delete broken.actionsByPerson[0].actions[0].actionId;
    expect(() => parseActionReview(broken)).toThrow();
  });
});

describe("toMeetingReviewInfo", () => {
  it("두 응답을 화면 한 판으로 합친다 — 머리는 상세, 초안은 검토에서", () => {
    const info = toMeetingReviewInfo({ detail: DETAIL, review: makeReview() });

    expect(info.meetingId).toBe("7");
    expect(info.meetingTitle).toBe("8월 스프린트 계획");
    expect(info.hostId).toBe(2);
    expect(info.projectTag).toBe("GOODSFLOW");
    expect(info.actionsConfirmed).toBe(false);
    // 참석자 → 담당자 선택지. 팀 없는 사람은 라벨이 이름뿐이다(빈 가운뎃점 금지)
    expect(info.assigneeOptions).toEqual([
      { id: 2, name: "김서준", roleLabel: "개발팀 · 팀장" },
      { id: 5, name: "박지호", roleLabel: "" },
    ]);
  });

  it("needsReview 목록이 묶음을 가른다 — 게이트 신호를 다시 조합하지 않는다", () => {
    const info = toMeetingReviewInfo({ detail: DETAIL, review: makeReview() });
    const confident = info.drafts.find((draft) => draft.id === "11");
    const uncertain = info.drafts.find((draft) => draft.id === "12");

    expect(confident?.confidence).toBe(AI_CONFIDENCE.HIGH);
    expect(uncertain?.confidence).toBe(AI_CONFIDENCE.NEEDS_REVIEW);
  });

  it("담당자 미정은 null 그대로 둔다 — 숨기지도 지어내지도 않는다", () => {
    const info = toMeetingReviewInfo({ detail: DETAIL, review: makeReview() });
    const unassigned = info.drafts.find((draft) => draft.id === "12");

    expect(unassigned?.assigneeId).toBeNull();
    expect(unassigned?.isDueDateDefaulted).toBe(true);
    // 화자 판정을 포기한 발화 — 이름·시각을 지어내지 않는다
    expect(unassigned?.evidence).toEqual({
      speaker: "",
      quote: "그건 나중에 공유하죠",
      timestamp: "",
    });
  });

  it("REJECTED는 거른다 — 지난 확정 시도에서 반려해 둔 항목이 되살아나면 안 된다", () => {
    const info = toMeetingReviewInfo({ detail: DETAIL, review: makeReview() });
    expect(info.drafts.map((draft) => draft.id)).toEqual(["11", "12"]);
  });

  it("dispatchedAt이 있으면 이미 확정된 회의다", () => {
    const info = toMeetingReviewInfo({
      detail: DETAIL,
      review: makeReview({ dispatchedAt: "2026-08-14T11:00:00" }),
    });
    expect(info.actionsConfirmed).toBe(true);
  });

  it("시작일은 비워 둔다 — BE가 안 내려주는 값이라 사람이 처음 정한다", () => {
    const info = toMeetingReviewInfo({ detail: DETAIL, review: makeReview() });
    expect(info.drafts.every((draft) => draft.startDate === "")).toBe(true);
  });
});

describe("toClock", () => {
  it("밀리초를 MM:SS로 바꾼다", () => {
    expect(toClock(754_000)).toBe("12:34");
    expect(toClock(0)).toBe("00:00");
  });

  it("없는 시각은 빈 문자열 — 00:00을 지어내지 않는다", () => {
    expect(toClock(null)).toBe("");
  });
});

/** MEET-10 응답 그대로 — 필드 이름을 BE 실코드에 맞춰 둔다 */
const BASE: BePendingActionDistributionMeeting = {
  meetingId: 13,
  title: "주간 백엔드 회의",
  status: "DONE",
  startAt: "2026-08-07T14:00:00",
  pendingActionCount: 3,
  project: { projectId: 12, tag: "Z-GROUPWARE", name: "잇다 그룹웨어" },
};

describe("toPendingReviewSummary", () => {
  it("id를 문자열로 바꾸고 화면이 쓰는 필드만 남긴다", () => {
    expect(toPendingReviewSummary(BASE)).toEqual({
      meetingId: "13",
      meetingTitle: "주간 백엔드 회의",
      actionCount: 3,
    });
  });
});
