import { type BeMeetingDetail, isEnded, toMeetingCaptureInfo } from "./mapper";

const BASE: BeMeetingDetail = {
  meetingId: 12,
  title: "굿즈 앱 주간 운영 점검",
  projectTag: "GOODS",
  startAt: "2026-08-14T10:00:00+09:00",
  endAt: "2026-08-14T10:30:00+09:00",
  roomName: "대회의실",
  hostId: 1,
  endedAt: null,
  attendees: [
    { memberId: 1, name: "대표 계정", teamName: null, position: "대표" },
    { memberId: 2, name: "김서준", teamName: "개발팀", position: "팀장" },
  ],
};

describe("toMeetingCaptureInfo", () => {
  it("id를 문자열로 바꾸고 시각을 우리 표기로 굳힌다", () => {
    const info = toMeetingCaptureInfo(BASE);

    expect(info.id).toBe("12");
    // ⚠️ 화면이 ISO를 직접 포맷하면 목·실서버가 다른 문자열을 그린다 — 여기서 한 번에 굳힌다
    expect(info.schedule).toBe("8월 14일(금) 10:00 – 10:30");
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

describe("isEnded", () => {
  it("종료를 누른 시각이 있으면 끝난 회의다 — 시간이 지난 것과 다르다", () => {
    expect(isEnded({ endedAt: null })).toBe(false);
    expect(isEnded({ endedAt: "2026-08-14T10:28:00+09:00" })).toBe(true);
  });
});
