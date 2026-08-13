import {
  type BeMeetingDetail,
  hostIdOf,
  isClosed,
  parseMeetingDetail,
  toMeetingCaptureInfo,
} from "./mapper";

/** MEET-04 응답 그대로 — 중첩·필드 이름을 BE 실코드에 맞춰 둔다 */
const BASE: BeMeetingDetail = {
  meetingId: 12,
  title: "굿즈 앱 주간 운영 점검",
  status: "SCHEDULED",
  startAt: "2026-08-14T10:00:00",
  endAt: "2026-08-14T10:30:00",
  teamId: 5,
  project: { projectId: 3, tag: "GOODS" },
  meetingRoom: { meetingRoomId: 2, name: "대회의실" },
  host: { memberId: 1, name: "대표 계정" },
  attendees: [
    { memberId: 1, name: "대표 계정", teamId: null, teamName: null, jobPosition: "대표" },
    { memberId: 2, name: "김서준", teamId: 5, teamName: "개발팀", jobPosition: "팀장" },
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
