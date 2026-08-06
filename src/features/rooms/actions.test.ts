// 서버 액션은 next 런타임 함수를 부른다 — jsdom엔 없으니 목으로 대체하고 호출만 검증한다.
jest.mock("next/cache", () => ({ revalidatePath: jest.fn() }));
// isMock은 NEXT_PUBLIC_USE_MOCK 환경변수로 정해진다 — 테스트가 환경에 휘둘리지 않게 고정한다.
jest.mock("@/mocks/config", () => ({ isMock: true }));
// 기본은 실제 getMockActor()와 같은 값(OWNER, Admin 아님) — 회의실 관리 권한 테스트에서만
// Admin 겸직 액터로 덮어쓴다(`canManageRooms`는 Admin 겸직자 전용이라 OWNER로는 절대 못 지나간다).
jest.mock("@/lib/mock-actor", () => ({
  getMockActor: jest.fn(() => ({ id: 1, role: "OWNER" })),
}));

import { revalidatePath } from "next/cache";

import { getMockActor } from "@/lib/mock-actor";

import {
  createMeetingRoomAction,
  createRoomReservationAction,
  updateMeetingRoomAction,
} from "./actions";

const revalidatePathMock = revalidatePath as unknown as jest.Mock;
const getMockActorMock = getMockActor as unknown as jest.Mock;

const VALID_ENTRIES: Record<string, string> = {
  title: "새 회의",
  roomId: "room-small-b",
  date: "2026-08-11",
  startTime: "13:00",
  projectId: "1", // TOP_LEVEL_PROJECTS의 GOODS(id=1) — 실존 프로젝트여야 통과한다
  topicMain: "PRODUCT",
  topicSub: "ROADMAP_REVIEW",
};

const form = (entries: Record<string, string>, attendeeIds: number[] = [1]) => {
  const data = new FormData();
  for (const [key, value] of Object.entries(entries)) data.append(key, value);
  for (const id of attendeeIds) data.append("attendeeIds", String(id));
  return data;
};

beforeEach(() => {
  revalidatePathMock.mockClear();
  getMockActorMock.mockReturnValue({ id: 1, role: "OWNER" });
});

const roomForm = (entries: Record<string, string>) => {
  const data = new FormData();
  for (const [key, value] of Object.entries(entries)) data.append(key, value);
  return data;
};

const VALID_ROOM_ENTRIES: Record<string, string> = {
  name: "신관 세미나실",
  location: "4층 C동",
  openTime: "10:00",
  closeTime: "17:00",
};

describe("회의실 추가·수정", () => {
  it("Admin이 아니면 추가를 막는다(OWNER도 예외 없음)", async () => {
    const result = await createMeetingRoomAction({ errors: {} }, roomForm(VALID_ROOM_ENTRIES));

    expect(result.errors.name).toBe("회의실을 추가할 권한이 없어요");
    expect(result.room).toBeUndefined();
  });

  it("Admin 겸직자면 추가할 수 있다", async () => {
    getMockActorMock.mockReturnValue({ id: 2, role: "MEMBER", isAdmin: true });

    const result = await createMeetingRoomAction({ errors: {} }, roomForm(VALID_ROOM_ENTRIES));

    expect(result.errors).toEqual({});
    expect(result.room?.name).toBe("신관 세미나실");
    expect(revalidatePathMock).toHaveBeenCalledWith("/manage/rooms");
  });

  it("Admin이어도 필수값이 비면 막는다", async () => {
    getMockActorMock.mockReturnValue({ id: 2, role: "MEMBER", isAdmin: true });

    const result = await createMeetingRoomAction(
      { errors: {} },
      roomForm({ ...VALID_ROOM_ENTRIES, name: "" }),
    );

    expect(result.errors.name).toBe("회의실 이름을 입력해 주세요");
  });

  it("Admin이 아니면 수정도 막는다", async () => {
    const result = await updateMeetingRoomAction(
      { errors: {} },
      roomForm({ ...VALID_ROOM_ENTRIES, id: "room-large" }),
    );

    expect(result.errors.name).toBe("회의실을 수정할 권한이 없어요");
  });

  it("없는 id를 수정하려 하면 오류를 돌려준다", async () => {
    getMockActorMock.mockReturnValue({ id: 2, role: "MEMBER", isAdmin: true });

    const result = await updateMeetingRoomAction(
      { errors: {} },
      roomForm({ ...VALID_ROOM_ENTRIES, id: "존재하지-않음" }),
    );

    expect(result.errors.name).toBe("수정할 회의실을 찾을 수 없어요");
  });
});

describe("회의실 예약 생성", () => {
  it("필수값이 다 있으면 성공하고 생성값을 돌려준다", async () => {
    const result = await createRoomReservationAction({ errors: {} }, form(VALID_ENTRIES));

    expect(result.errors).toEqual({});
    expect(result.created?.title).toBe("새 회의");
    expect(result.created?.roomName).toBe("소회의실 B");
    expect(revalidatePathMock).toHaveBeenCalledWith("/app/rooms");
  });

  it("제목이 비면 막고 revalidatePath를 안 부른다", async () => {
    const result = await createRoomReservationAction(
      { errors: {} },
      form({ ...VALID_ENTRIES, title: "" }),
    );

    expect(result.errors.title).toBeDefined();
    expect(result.created).toBeUndefined();
    expect(revalidatePathMock).not.toHaveBeenCalled();
  });

  it("같은 회의실·겹치는 시간대는 막는다", async () => {
    const first = await createRoomReservationAction(
      { errors: {} },
      form({ ...VALID_ENTRIES, roomId: "room-video", date: "2026-08-12", startTime: "10:00" }),
    );
    expect(first.errors).toEqual({});

    const second = await createRoomReservationAction(
      { errors: {} },
      form({ ...VALID_ENTRIES, roomId: "room-video", date: "2026-08-12", startTime: "10:00" }),
    );

    expect(second.errors.roomId).toBe("그 시간에는 이미 예약된 회의실이에요");
    expect(second.created).toBeUndefined();
  });

  it("겹치지 않는 시간대는 같은 회의실이어도 통과한다", async () => {
    await createRoomReservationAction(
      { errors: {} },
      form({ ...VALID_ENTRIES, roomId: "room-video", date: "2026-08-13", startTime: "10:00" }),
    );

    const result = await createRoomReservationAction(
      { errors: {} },
      form({ ...VALID_ENTRIES, roomId: "room-video", date: "2026-08-13", startTime: "10:30" }),
    );

    expect(result.errors).toEqual({});
    expect(result.created).toBeDefined();
  });

  it("프로젝트 없이도 생성된다(예: 팀 위클리 싱크 같은 예약)", async () => {
    const result = await createRoomReservationAction(
      { errors: {} },
      form({ ...VALID_ENTRIES, projectId: "", date: "2026-08-14" }),
    );

    expect(result.errors).toEqual({});
    expect(result.created?.projectId).toBeUndefined();
    expect(result.created?.projectTag).toBeUndefined();
  });

  it("폼이 조작돼 존재하지 않는 회의실 id가 오면 막는다", async () => {
    const result = await createRoomReservationAction(
      { errors: {} },
      form({ ...VALID_ENTRIES, roomId: "room-does-not-exist", date: "2026-08-15" }),
    );

    expect(result.errors.roomId).toBe("존재하지 않는 회의실이에요");
    expect(result.created).toBeUndefined();
  });

  it("폼이 조작돼 존재하지 않는 프로젝트 id가 오면 막는다", async () => {
    const result = await createRoomReservationAction(
      { errors: {} },
      form({ ...VALID_ENTRIES, projectId: "p-does-not-exist", date: "2026-08-15" }),
    );

    expect(result.errors.projectId).toBe("존재하지 않는 프로젝트예요");
    expect(result.created).toBeUndefined();
  });

  it("폼이 조작돼 존재하지 않는 참석자 id가 오면 막는다", async () => {
    const result = await createRoomReservationAction(
      { errors: {} },
      form({ ...VALID_ENTRIES, date: "2026-08-15" }, [9999]),
    );

    expect(result.errors.attendeeIds).toBe("존재하지 않는 참석자가 있어요");
    expect(result.created).toBeUndefined();
  });

  it("폼이 조작돼 대주제·소주제 조합이 안 맞으면 막는다", async () => {
    const result = await createRoomReservationAction(
      { errors: {} },
      form({
        ...VALID_ENTRIES,
        date: "2026-08-15",
        topicMain: "PRODUCT",
        topicSub: "CHANNEL_STRATEGY",
      }),
    );

    expect(result.errors.topicSub).toBe("대주제와 맞지 않는 소주제예요");
    expect(result.created).toBeUndefined();
  });

  it("폼이 조작돼 참석자 값이 숫자가 아니면 막는다", async () => {
    const data = new FormData();
    for (const [key, value] of Object.entries({ ...VALID_ENTRIES, date: "2026-08-15" })) {
      data.append(key, value);
    }
    data.append("attendeeIds", "not-a-number");

    const result = await createRoomReservationAction({ errors: {} }, data);

    expect(result.errors.attendeeIds).toBe("참석자 값이 올바르지 않아요");
    expect(result.created).toBeUndefined();
  });
});
