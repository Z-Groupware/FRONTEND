// 서버 액션은 next 런타임 함수를 부른다 — jsdom엔 없으니 목으로 대체하고 호출만 검증한다.
jest.mock("next/cache", () => ({ revalidatePath: jest.fn() }));

import { revalidatePath } from "next/cache";

import { createRoomReservationAction } from "./actions";

const revalidatePathMock = revalidatePath as unknown as jest.Mock;

const VALID_ENTRIES: Record<string, string> = {
  title: "새 회의",
  roomId: "room-small-b",
  date: "2026-08-11",
  startTime: "13:00",
  projectId: "p-goods",
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
});
