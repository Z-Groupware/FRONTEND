import {
  DELETED_MEMBER_STATUS,
  isVisibleMemberStatus,
  MEMBER_STATUS,
  MEMBER_STATUS_LABEL,
} from "./member";

/**
 * 상태 목록이 지키는 것 — **`DELETED`는 상태가 아니다.**
 * 목록에 끼어들면 필터에 칸이 하나 늘고, 안 걸러지면 빈 뱃지가 뜬다.
 */
describe("회원 상태", () => {
  it("화면에 보이는 넷이 전부다", () => {
    expect(Object.keys(MEMBER_STATUS)).toEqual(["ACTIVE", "VACATION", "WAITING", "RESIGNED"]);
  });

  it("네 상태 모두 한글 라벨이 있다 — 빈 뱃지가 뜨지 않는다", () => {
    for (const status of Object.values(MEMBER_STATUS)) {
      expect(MEMBER_STATUS_LABEL[status]).toBeTruthy();
    }
  });

  it("퇴사는 목록에 남는다 — 그 사람이 남긴 기록의 출처다", () => {
    expect(isVisibleMemberStatus(MEMBER_STATUS.RESIGNED)).toBe(true);
  });

  it("소프트 딜리트는 거른다 — 상태가 아니라 목록에서 빠지는 일이다", () => {
    expect(isVisibleMemberStatus(DELETED_MEMBER_STATUS)).toBe(false);
    expect(Object.values(MEMBER_STATUS)).not.toContain(DELETED_MEMBER_STATUS);
  });

  it("모르는 값도 거른다 — 이름 없는 뱃지보다 빠진 줄이 낫다", () => {
    expect(isVisibleMemberStatus("ON_LEAVE")).toBe(false);
  });
});
