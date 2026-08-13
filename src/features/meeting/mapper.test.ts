import {
  type BeDashboardMeeting,
  type BeMeetingDetail,
  type BeMeetingListItem,
  hostIdOf,
  isClosed,
  meetingPendingReasonOf,
  parseDashboardMeetings,
  parseMeetingDetail,
  parseMeetingList,
  toDashboardMeetingCard,
  toMeetingCaptureInfo,
  toMeetingDetailView,
  toMeetingListItem,
} from "./mapper";

/** MEET-04 응답 그대로 — 중첩·필드 이름을 BE 실코드에 맞춰 둔다 */
const BASE: BeMeetingDetail = {
  meetingId: 12,
  title: "굿즈 앱 주간 운영 점검",
  status: "SCHEDULED",
  startAt: "2026-08-14T10:00:00",
  endAt: "2026-08-14T10:30:00",
  pendingActionCount: 0,
  /* ⚠️ 안 끝난 회의는 `NONE`이다 — 요약을 시도조차 안 한 상태(BE `MeetingSummaryStatus`) */
  summaryStatus: "NONE",
  project: { projectId: 3, tag: "GOODS" },
  meetingRoom: { meetingRoomId: 2, name: "대회의실" },
  host: { memberId: 1, name: "대표 계정" },
  attendees: [
    { memberId: 1, name: "대표 계정", teamName: null, jobPosition: "대표" },
    { memberId: 2, name: "김서준", teamName: "개발팀", jobPosition: "팀장" },
  ],
};

describe("toMeetingCaptureInfo", () => {
  it("중첩된 태그·회의실을 꺼내고 id를 문자열로 바꾼다", () => {
    const info = toMeetingCaptureInfo(BASE);

    expect(info.id).toBe("12");
    expect(info.projectTag).toBe("GOODS");
    expect(info.roomName).toBe("대회의실");
  });

  it("시각을 우리 표기로 굳힌다 — 화면이 원문을 포맷하지 않는다", () => {
    // ⚠️ 오프셋 없는 문자열이라 프로세스 시간대로 읽힌다(서버는 `TZ=Asia/Seoul`)
    expect(toMeetingCaptureInfo(BASE).schedule).toBe("8월 14일(금) 10:00 – 10:30");
  });

  it("팀이 없는 사람은 앞이 빈 가운뎃점을 남기지 않는다", () => {
    const subtitles = toMeetingCaptureInfo(BASE).attendees.map((attendee) => attendee.subtitle);

    expect(subtitles).toEqual(["대표", "개발팀 · 팀장"]);
  });

  it("개설자만 진행자로 표시한다", () => {
    const marked = toMeetingCaptureInfo(BASE).attendees.map((attendee) => attendee.isHost);

    expect(marked).toEqual([true, false]);
  });
});

describe("hostIdOf", () => {
  /* ⚠️ 매퍼는 값이 어디 있는지만 안다 — 들어갈 수 있냐는 `canCaptureMeeting`이 정한다 */
  it("중첩 안의 개설자 id를 꺼낸다", () => {
    expect(hostIdOf(BASE)).toBe(1);
  });
});

describe("isClosed", () => {
  it("예정·진행중은 녹음할 수 있다", () => {
    expect(isClosed({ status: "SCHEDULED" })).toBe(false);
    expect(isClosed({ status: "IN_PROGRESS" })).toBe(false);
  });

  it("끝났거나 취소된 회의는 막는다 — 취소는 아직 화면 계약에 없어 같은 자리로 보낸다", () => {
    expect(isClosed({ status: "DONE" })).toBe(true);
    expect(isClosed({ status: "CANCELED" })).toBe(true);
  });
});

describe("parseMeetingDetail", () => {
  it("우리가 읽는 모양이면 그대로 돌려준다", () => {
    expect(parseMeetingDetail(BASE)).toBe(BASE);
  });

  /*
    ⚠️ 단언만 하던 때는 여기서 안 터지고 **한참 뒤 `host.memberId`에서** 터졌다 —
       원인을 알 수 없는 `TypeError`가 아니라 무엇이 어긋났는지 말하게 한다(§정직성).
  */
  it.each([
    ["중첩이 통째로 없으면", { ...BASE, host: undefined }],
    ["참석자가 배열이 아니면", { ...BASE, attendees: null }],
    ["id가 문자열로 오면", { ...BASE, meetingId: "12" }],
    ["응답이 비면", null],
    ["참석자에 null이 섞이면", { ...BASE, attendees: [null] }],
    ["참석자에 이름이 없으면", { ...BASE, attendees: [{ memberId: 2, teamName: null }] }],
    [
      "참석자 직급이 문자열도 null도 아니면",
      { ...BASE, attendees: [{ memberId: 2, name: "김서준", teamName: null, jobPosition: 3 }] },
    ],
  ])("%s 판정 전에 멈춘다", (_label, broken) => {
    expect(() => parseMeetingDetail(broken)).toThrow("약속한 모양");
  });
});

/**
 * 목록(MEET-02) — **BE 실코드에서 옮겨 적은 shape**으로 검증한다(§연동 검증).
 * [확인] `meeting/presentation/api/response/MeetingListResponse.java`(2026-08-13).
 */
const LIST_ITEM: BeMeetingListItem = {
  meetingId: 91,
  title: "굿즈 앱 주간 운영 점검",
  status: "DONE",
  startAt: "2026-08-14T10:00:00",
  endAt: "2026-08-14T10:30:00",
  attendeeCount: 4,
  isHost: true,
  meetingRoom: { meetingRoomId: 2, name: "대회의실" },
  project: { projectId: 3, tag: "GOODS" },
};

describe("parseMeetingList", () => {
  it("봉투 안의 회의 배열만 꺼낸다 — `page`는 안 본다", () => {
    const raw = {
      meetings: [LIST_ITEM],
      page: { page: 0, size: 20, totalElements: 1, totalPages: 1 },
    };

    expect(parseMeetingList(raw)).toEqual([LIST_ITEM]);
  });

  it("결과가 없어도 빈 배열로 통과한다 — BE가 null을 안 준다", () => {
    expect(parseMeetingList({ meetings: [], page: {} })).toEqual([]);
  });

  it.each([
    ["응답이 비면", null],
    ["회의가 배열이 아니면", { meetings: null }],
    ["행에 null이 섞이면", { meetings: [null] }],
    ["개설자 여부가 없으면", { meetings: [{ ...LIST_ITEM, isHost: undefined }] }],
    ["중첩 회의실이 통째로 없으면", { meetings: [{ ...LIST_ITEM, meetingRoom: undefined }] }],
  ])("%s 그리기 전에 멈춘다", (_label, broken) => {
    expect(() => parseMeetingList(broken)).toThrow("약속한 모양");
  });
});

describe("toMeetingListItem", () => {
  it("중첩된 태그·회의실을 꺼내고 시각을 우리 표기로 굳힌다", () => {
    const item = toMeetingListItem(LIST_ITEM);

    expect(item.id).toBe("91");
    expect(item.projectTag).toBe("GOODS");
    expect(item.roomName).toBe("대회의실");
    expect(item.schedule).toBe("8월 14일(금) 10:00 – 10:30");
  });

  /* ⚠️ 이 값이 두 탭을 가른다 — 백엔드 §10-A 요청의 핵심이라 값으로 고정해 둔다 */
  it("개설자 여부를 그대로 싣는다", () => {
    expect(toMeetingListItem(LIST_ITEM).isHost).toBe(true);
    expect(toMeetingListItem({ ...LIST_ITEM, isHost: false }).isHost).toBe(false);
  });

  /*
    ⚠️ **없는 값을 지어내지 않는다**(§정직성). 목록 응답엔 요약 상태·소속 라벨·안건이 없다 —
       채우면 완료 카드에 [액션 검토]가 잘못 뜨거나 안 뜬다.
  */
  it("목록에 없는 값(요약 상태·소속 라벨·안건)은 비운다", () => {
    const item = toMeetingListItem(LIST_ITEM);

    expect(item.aiSummaryStatus).toBeNull();
    expect(item.originLabel).toBe("");
    expect(item.topicSummary).toBe("");
  });

  it("모르는 상태는 그냥 넘기지 않는다", () => {
    expect(() => toMeetingListItem({ ...LIST_ITEM, status: "PAUSED" })).toThrow(
      "알 수 없는 회의 상태",
    );
  });
});

/**
 * 상세의 요약 신호(MEET-04) → 화면이 «아직 못 보여주는 이유».
 * [확인] `meeting/domain/model/MeetingSummaryStatus.java` ·
 *   `application/service/MeetingDetailQueryService.resolveSummaryStatus`(2026-08-13).
 */
describe("meetingPendingReasonOf", () => {
  const done = { status: "DONE", summaryStatus: null, pendingActionCount: 0 };

  it("회의 상태를 먼저 본다 — 안 끝난 회의는 요약을 시작조차 안 했다", () => {
    expect(meetingPendingReasonOf({ ...done, status: "SCHEDULED" })).toBe("SCHEDULED");
    expect(meetingPendingReasonOf({ ...done, status: "IN_PROGRESS" })).toBe("IN_PROGRESS");
    expect(meetingPendingReasonOf({ ...done, status: "CANCELED" })).toBe("CANCELED");
  });

  it("중단은 실패로, 완료는 다 찬 것으로 읽는다", () => {
    expect(meetingPendingReasonOf({ ...done, summaryStatus: "STALLED" })).toBe("FAILED");
    expect(meetingPendingReasonOf({ ...done, summaryStatus: "DONE" })).toBeNull();
  });

  /*
    ⚠️ BE는 `null`을 "끝났지만 PROCESSING인지 DONE인지 모른다"는 뜻으로 준다 — 그걸 완료로
       읽으면 화면이 "하달된 액션이 없습니다"라고 단정한다(§정직성).
  */
  it("모르는 값(null)을 완료로 읽지 않는다", () => {
    expect(meetingPendingReasonOf(done)).toBe("SUMMARIZING");
  });

  /* ⚠️ 초안이 나왔다는 건 요약이 끝났다는 증거다 — 그때는 검토 대기 안내가 맞는 말이다 */
  it("확정 대기 건수가 있으면 요약은 끝난 것으로 본다", () => {
    expect(meetingPendingReasonOf({ ...done, pendingActionCount: 3 })).toBeNull();
  });
});

describe("toMeetingDetailView", () => {
  const DONE_DETAIL: BeMeetingDetail = {
    ...BASE,
    status: "DONE",
    summaryStatus: null,
    pendingActionCount: 2,
  };

  it("중첩된 프로젝트·회의실·참석자를 화면 계약으로 편다", () => {
    const detail = toMeetingDetailView(DONE_DETAIL, { isHost: true });

    expect(detail.id).toBe("12");
    expect(detail.projectId).toBe(3);
    expect(detail.roomName).toBe("대회의실");
    expect(detail.attendees).toEqual([
      { id: 1, name: "대표 계정" },
      { id: 2, name: "김서준" },
    ]);
  });

  it("확정 대기 건수와 중단 여부를 그대로 싣는다", () => {
    expect(toMeetingDetailView(DONE_DETAIL, { isHost: true }).pendingActionCount).toBe(2);
    expect(toMeetingDetailView(DONE_DETAIL, { isHost: true }).isStalled).toBe(false);
    expect(
      toMeetingDetailView({ ...DONE_DETAIL, summaryStatus: "STALLED" }, { isHost: true }).isStalled,
    ).toBe(true);
  });

  /*
    ⚠️ **빈 배열이 아니라 `null`이다.** 빈 배열은 "물어봤는데 없다"는 뜻이라 화면이 "없습니다"라고
       단정하는데, 산출물·발화 기록은 다른 API가 줄 값이라 **묻지도 않았다**(§정직성).
  */
  it("안 물어본 칸(산출물·발화 기록)은 null, 응답에 없는 칸(안건·소속 라벨)은 비운다", () => {
    const detail = toMeetingDetailView(DONE_DETAIL, { isHost: false });

    expect(detail.outputs).toBeNull();
    expect(detail.script).toBeNull();
    expect(detail.topics).toEqual([]);
    expect(detail.originLabel).toBe("");
    expect(detail.parentTeamActionHref).toBeNull();
    /* 팀 액션인지 개인 액션인지는 응답으로 못 가른다 — 둘 중 하나로 찍지 않는다 */
    expect(detail.outputKindLabel).toBe("액션");
  });

  /* ⚠️ 판정은 `lib/permission.ts`가 한다 — 매퍼는 결과만 받는다(§권한) */
  it("개설자 여부는 부르는 쪽이 판정한 값을 그대로 쓴다", () => {
    expect(toMeetingDetailView(DONE_DETAIL, { isHost: false }).isHost).toBe(false);
  });
});

/**
 * 대시보드 최근 회의(MEET-17).
 * [확인] `meeting/presentation/api/response/DashboardMeetingListResponse.java`(2026-08-13).
 */
const DASHBOARD_MEETING: BeDashboardMeeting = {
  meetingId: 91,
  title: "8월 스프린트 계획",
  projectTag: "GOODS",
  status: "DONE",
  room: "회의실 A",
  scheduledAt: "2026-08-12T14:00:00",
  attendeeCount: 4,
  /* ⚠️ 둘 다 `null`이 정상이다 — `scope=team`의 소속 라벨은 명세에 없고, 개설자 라벨은 미구현 */
  originLabel: null,
  hostLabel: null,
};

describe("parseDashboardMeetings", () => {
  it("결과가 없어도 빈 배열로 통과한다", () => {
    expect(parseDashboardMeetings({ meetings: [] })).toEqual([]);
  });

  it.each([
    ["응답이 비면", null],
    ["회의가 배열이 아니면", { meetings: {} }],
    ["라벨이 문자열도 null도 아니면", { meetings: [{ ...DASHBOARD_MEETING, hostLabel: 3 }] }],
  ])("%s 그리기 전에 멈춘다", (_label, broken) => {
    expect(() => parseDashboardMeetings(broken)).toThrow("약속한 모양");
  });
});

describe("toDashboardMeetingCard", () => {
  it("평평한 카드 값을 그대로 옮긴다", () => {
    expect(toDashboardMeetingCard(DASHBOARD_MEETING)).toEqual({
      id: "91",
      title: "8월 스프린트 계획",
      projectTag: "GOODS",
      status: "DONE",
      room: "회의실 A",
      scheduledAt: "2026-08-12T14:00:00",
      attendeeCount: 4,
    });
  });

  /* ⚠️ `null`은 키째로 뺀다 — 선택 필드라 없으면 화면이 배지를 안 그린다(§정직성) */
  it("서버가 준 라벨이 있으면 싣는다", () => {
    const card = toDashboardMeetingCard({
      ...DASHBOARD_MEETING,
      originLabel: "개발팀",
      hostLabel: "김서준(팀장)",
    });

    expect(card.originLabel).toBe("개발팀");
    expect(card.hostLabel).toBe("김서준(팀장)");
  });
});
