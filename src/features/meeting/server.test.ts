import { AUTHORITY } from "@/constants/authority";
import type { Actor } from "@/lib/permission";

import { getMeetingCapture } from "./server";

/**
 * 캡처 진입 판정 — **접근 제어라 값으로 고정해 둔다**(CLAUDE.md §테스트: 로직은 짜자마자).
 *
 * ⚠️ 시드나 권한 규칙이 바뀔 때 **조용히 열리는 걸** 막는 게 목적이다. 화면을 눌러 보는
 *    것으로는 "Owner인데 남의 회의에 못 들어간다"를 확인하기 어렵다.
 */

/* 시드의 m1(박대표가 연 완료 회의)·m3(박대표의 예정 회의) 기준 — mock/seed.ts */
const OWNER: Actor = { id: 1, role: AUTHORITY.OWNER, isAdmin: false, teamId: undefined };
const OTHER_LEADER: Actor = { id: 2, role: AUTHORITY.LEADER, isAdmin: false, teamId: 1 };

describe("getMeetingCapture — 캡처 진입", () => {
  it("없는 회의는 notFound다", async () => {
    const result = await getMeetingCapture("없는-id", OWNER);
    expect(result.kind).toBe("notFound");
  });

  /*
    ⚠️ **역할이 아니라 소유권이다.** 김서준은 Leader이고 m3의 참석자이기도 하지만, 그 회의를
       연 사람이 아니라 녹음할 수 없다(§3-3 Host 전용).
  */
  it("개설자가 아니면 notHost다 — 참석자여도, 팀장이어도", async () => {
    const result = await getMeetingCapture("meeting-3", OTHER_LEADER);
    expect(result.kind).toBe("notHost");
  });

  /* 종료는 되돌릴 수 없다(§3-3 종료 정책) — 끝난 회의로 다시 들어가지 못한다 */
  it("이미 끝난 회의는 alreadyDone이다", async () => {
    const result = await getMeetingCapture("meeting-1", OWNER);
    expect(result.kind).toBe("alreadyDone");
  });

  it("개설자가 아직 안 끝난 회의를 열면 ok다", async () => {
    const result = await getMeetingCapture("meeting-3", OWNER);
    expect(result.kind).toBe("ok");
  });

  describe("참가자 매핑", () => {
    it("개설자가 참석자 명단에 있고 진행자로 표시된다", async () => {
      const result = await getMeetingCapture("meeting-3", OWNER);
      if (result.kind !== "ok") throw new Error("ok를 기대했다");

      const host = result.meeting.attendees.find((attendee) => attendee.id === OWNER.id);
      // ⚠️ §10 "개설자 Host도 참석자이므로 포함" — 빠지면 참가자 레일에 진행자가 안 보인다
      expect(host).toBeDefined();
      expect(host?.isHost).toBe(true);
    });

    it("개설자가 아닌 참석자는 진행자가 아니다", async () => {
      const result = await getMeetingCapture("meeting-3", OWNER);
      if (result.kind !== "ok") throw new Error("ok를 기대했다");

      const others = result.meeting.attendees.filter((attendee) => attendee.id !== OWNER.id);
      expect(others.length).toBeGreaterThan(0);
      expect(others.every((attendee) => !attendee.isHost)).toBe(true);
    });

    /* 회의 중에 옆자리 사람을 부르려면 이름만으로는 부족하다 */
    it("소속·직급을 함께 준다", async () => {
      const result = await getMeetingCapture("meeting-3", OWNER);
      if (result.kind !== "ok") throw new Error("ok를 기대했다");

      const teamMember = result.meeting.attendees.find((attendee) => attendee.id === 2);
      expect(teamMember?.subtitle).toContain("팀");
    });
  });
});
