import { PROCESSING_STATUS } from "@/constants/meeting";
import { NOTIFICATION_TYPE } from "@/constants/notification";

import {
  ANALYSIS_EVENT_STATE,
  parseNotificationEnvelope,
  toAnalysisSignal,
  toBannerNotification,
} from "./event";

/** BE `NotificationEvent` 레코드가 직렬화되는 모양 그대로 */
function raw(type: string, payload: unknown): string {
  return JSON.stringify({ type, payload });
}

describe("스트림 겉봉 읽기", () => {
  it("BE가 보내는 { type, payload }를 읽는다", () => {
    expect(parseNotificationEnvelope(raw("MEETING_CREATED", { meetingId: 1 }))).toEqual({
      type: "MEETING_CREATED",
      payload: { meetingId: 1 },
    });
  });

  /* 한 줄이 깨졌다고 구독 전체를 잃으면 안 된다 */
  it("깨진 줄은 버린다", () => {
    expect(parseNotificationEnvelope("{")).toBeNull();
    expect(parseNotificationEnvelope(JSON.stringify({ payload: {} }))).toBeNull();
  });
});

describe("배너 매핑", () => {
  it.each([
    NOTIFICATION_TYPE.MEETING_CREATED,
    NOTIFICATION_TYPE.MEETING_REMINDER,
    NOTIFICATION_TYPE.MEETING_CANCELED,
  ])("회의 알림(%s)은 회의 상세로 보낸다", (type) => {
    const envelope = parseNotificationEnvelope(
      raw(type, { meetingId: 42, message: "주간 회의가 개설되었습니다." }),
    );
    expect(toBannerNotification(envelope!)).toEqual({
      id: `${type}:42`,
      type,
      message: "주간 회의가 개설되었습니다.",
      href: "/app/meeting/42",
    });
  });

  /* 취소 payload에는 title이 없다 — title을 쓰면 취소 배너만 빈다 */
  it("제목이 없는 취소 알림도 문장을 그대로 띄운다", () => {
    const envelope = parseNotificationEnvelope(
      raw(NOTIFICATION_TYPE.MEETING_CANCELED, {
        meetingId: 9,
        message: "주간 회의가 취소되었습니다.",
        startAt: "2026-08-14T10:00:00",
        canceledAt: "2026-08-13T09:00:00",
      }),
    );
    expect(toBannerNotification(envelope!)?.message).toBe("주간 회의가 취소되었습니다.");
  });

  it("공지 알림은 공지 상세로 보낸다", () => {
    const envelope = parseNotificationEnvelope(
      raw(NOTIFICATION_TYPE.NOTICE_CREATED, {
        noticeId: 3,
        title: "휴무",
        message: "휴무 공지사항이 등록되었습니다.",
      }),
    );
    expect(toBannerNotification(envelope!)?.href).toBe("/app/notice/3");
  });

  /* BE가 새 종류를 먼저 배포해도 화면이 안 터져야 한다 */
  it("모르는 종류와 모양이 어긋난 payload는 버린다", () => {
    expect(toBannerNotification({ type: "SOMETHING_NEW", payload: { meetingId: 1 } })).toBeNull();
    expect(
      toBannerNotification({ type: NOTIFICATION_TYPE.MEETING_CREATED, payload: { message: "" } }),
    ).toBeNull();
  });
});

describe("분석 이벤트 이음매", () => {
  /*
    ⚠️ BE `NotificationType`에 분석 이벤트가 아직 없다(2026-08-13 실코드 확인).
       그래서 오늘 스트림으로 오는 건 전부 배너감이고, 카드는 CAP-06 폴링이 움직인다.
  */
  it("오늘 BE가 보내는 4종은 분석 신호가 아니다", () => {
    expect(ANALYSIS_EVENT_STATE).toEqual({});
    for (const type of Object.values(NOTIFICATION_TYPE)) {
      expect(toAnalysisSignal({ type, payload: { meetingId: 1 } })).toBeNull();
    }
  });

  /*
    ⚠️ BE가 타입 이름을 확정하면 `ANALYSIS_EVENT_STATE`에 한 줄 적는 것만으로 스트림이
       카드를 움직인다 — 여기서는 이름을 지어내지 않으려고 표를 주입해 그 길만 확인한다.
  */
  it("표에 이름이 적히는 순간 스트림이 카드를 움직인다", () => {
    const table = { ANALYSIS_DONE: PROCESSING_STATUS.DONE } as const;
    expect(toAnalysisSignal({ type: "ANALYSIS_DONE", payload: { meetingId: 11 } }, table)).toEqual({
      meetingId: 11,
      status: PROCESSING_STATUS.DONE,
    });
    /* 어느 회의인지 모르면 카드를 못 고른다 — 조용히 남의 카드를 바꾸지 않는다 */
    expect(toAnalysisSignal({ type: "ANALYSIS_DONE", payload: {} }, table)).toBeNull();
  });
});
