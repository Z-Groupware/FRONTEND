jest.mock("next/cache", () => ({ revalidatePath: jest.fn() }));
jest.mock("@/mocks/config", () => ({ isMock: false }));
jest.mock("@/features/auth/session", () => ({ requireAccessToken: jest.fn() }));
jest.mock("@/features/shell/viewer", () => ({ getViewer: jest.fn() }));
jest.mock("./server", () => ({ getReservableMembers: jest.fn() }));
jest.mock("@/lib/api", () => ({
  ApiError: class ApiError extends Error {
    status: number;
    code?: string;
    constructor(status: number, message: string, code?: string) {
      super(message);
      this.status = status;
      this.code = code;
    }
  },
  serverApi: jest.fn(),
}));

import { AUTHORITY } from "@/constants/authority";
import { requireAccessToken } from "@/features/auth/session";
import { getViewer } from "@/features/shell/viewer";
import { serverApi } from "@/lib/api";

import {
  createMeetingRoomAction,
  createRoomReservationAction,
  deleteMeetingRoomAction,
  updateMeetingRoomAction,
} from "./actions";
import { getReservableMembers } from "./server";

/**
 * 회의실 예약 생성 — **실서버 참석자 재검증**.
 *
 * ⚠️ 기존 `actions.test.ts`는 파일 전체가 `isMock: true`라 이 분기(2026-08-13에 새로 생김,
 *    `GET /api/members/my-team` 연동)는 그쪽 어디서도 실행되지 않는다 — 별도 파일로 잠근다.
 */

const requireAccessTokenMock = requireAccessToken as unknown as jest.Mock;
const getViewerMock = getViewer as unknown as jest.Mock;
const getReservableMembersMock = getReservableMembers as unknown as jest.Mock;
const serverApiMock = serverApi as unknown as jest.Mock;

const LEADER = { id: 2, name: "김서준", role: AUTHORITY.LEADER, teamName: "개발팀" };

/*
  ⚠️ **LEADER는 `parentTeamActionId`가 형식상 필수다**(`validate.ts` — Owner만 면제된다).
     실제 프로젝트·팀 소속 확인은 `actions.ts`가 별도로 하는데(이 테스트가 확인하려는 건
     참석자 재검증이지 상위 팀 액션 존재 확인이 아니다), 실서버 분기는 그 확인을 아직
     안 하고 그대로 BE로 보낸다(§핵심4원칙: BE가 최종 방어) — 형식만 채우면 통과한다.
*/
const VALID_ENTRIES: Record<string, string> = {
  title: "새 회의",
  roomId: "room-small-b",
  date: "2026-08-11",
  startTime: "13:00",
  projectId: "1",
  parentTeamActionId: "1",
};

function form(attendeeIds: number[]): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(VALID_ENTRIES)) data.append(key, value);
  for (const id of attendeeIds) data.append("attendeeIds", String(id));
  data.append("topicMain", "제품");
  data.append("topicSub", "로드맵 검토");
  return data;
}

beforeEach(() => {
  jest.clearAllMocks();
  requireAccessTokenMock.mockResolvedValue("token");
  getViewerMock.mockResolvedValue(LEADER);
  getReservableMembersMock.mockResolvedValue([
    { id: 3, name: "박도현", teamName: "개발팀", authority: AUTHORITY.MEMBER },
    { id: 4, name: "이서연", teamName: "개발팀", authority: AUTHORITY.MEMBER },
  ]);
  serverApiMock.mockResolvedValue({
    meetingId: 10,
    status: "SCHEDULED",
    title: "새 회의",
    startAt: "2026-08-11T13:00:00",
    endAt: "2026-08-11T13:30:00",
    recordingConsent: false,
    meetingRoom: { meetingRoomId: 1, name: "소회의실 B", location: "3층" },
    host: { memberId: LEADER.id, name: LEADER.name },
    attendees: [],
  });
});

describe("createRoomReservationAction — 실서버 참석자 재검증", () => {
  it("명부(getReservableMembers) 안의 id만 제출하면 통과한다", async () => {
    const result = await createRoomReservationAction({ errors: {} }, form([3, 4]));

    expect(result.errors).toEqual({});
    expect(result.created).toBeDefined();
    expect(serverApiMock).toHaveBeenCalledTimes(1);
  });

  /*
    ⚠️ 화면 피커는 명부 밖 id를 애초에 안 그리지만, Server Action은 주소만 알면 직접 부를 수
       있다 — 조작된 제출은 BE를 부르기 **전에** 막아야 한다(§권한: 화면 숨김은 UX일 뿐).
  */
  it("명부 밖 id가 섞이면 BE를 부르지 않고 막는다", async () => {
    const result = await createRoomReservationAction({ errors: {} }, form([3, 999]));

    expect(result.errors.attendeeIds).toBeDefined();
    expect(result.created).toBeUndefined();
    expect(serverApiMock).not.toHaveBeenCalled();
  });

  /* ⚠️ host 자신이 섞여 있어도 막지 않는다 — BE가 알아서 다시 끼워 넣는 사람이라 무해하다 */
  it("host 자신의 id가 섞여 있어도 막지 않는다", async () => {
    const result = await createRoomReservationAction({ errors: {} }, form([LEADER.id, 3]));

    expect(result.errors).toEqual({});
    expect(serverApiMock).toHaveBeenCalledTimes(1);
  });
});

/**
 * 회의실 추가·수정·삭제 — **실서버 권한 판정이 실제 로그인 세션을 본다**.
 *
 * ⚠️ 회귀 테스트다 — 세 액션이 전부 `canManageRooms(getMockActor())`로 실서버에서도
 *    고정된 mock 액터(OWNER, isAdmin 없음)를 판정해서, 실제로 is_admin인 사람이 로그인해도
 *    항상 막히던 버그가 있었다. `getViewer()`(실제 세션)를 보게 고쳤다.
 */
function roomForm(): FormData {
  const data = new FormData();
  data.append("name", "박애관 302호");
  data.append("location", "박애관 302호");
  data.append("openTime", "00:00");
  data.append("closeTime", "23:30");
  return data;
}

const ADMIN_LEADER = { id: 5, role: AUTHORITY.LEADER, isAdmin: true, teamName: "인사팀" };
const NON_ADMIN_LEADER = { id: 2, role: AUTHORITY.LEADER, teamName: "개발팀" };

describe("회의실 추가·수정·삭제 — 실서버 권한 판정", () => {
  it("createMeetingRoomAction — is_admin 로그인 세션이면 통과해 BE를 부른다", async () => {
    getViewerMock.mockResolvedValue(ADMIN_LEADER);
    serverApiMock.mockResolvedValue({ meetingRoomId: 1 });

    const result = await createMeetingRoomAction({ errors: {} }, roomForm());

    expect(result.errors).toEqual({});
    expect(serverApiMock).toHaveBeenCalledTimes(1);
  });

  it("createMeetingRoomAction — is_admin 아닌 로그인 세션이면 BE를 부르지 않고 막는다", async () => {
    getViewerMock.mockResolvedValue(NON_ADMIN_LEADER);

    const result = await createMeetingRoomAction({ errors: {} }, roomForm());

    expect(result.errors.name).toBe("회의실을 추가할 권한이 없습니다");
    expect(serverApiMock).not.toHaveBeenCalled();
  });

  it("updateMeetingRoomAction — is_admin 로그인 세션이면 통과해 BE를 부른다", async () => {
    getViewerMock.mockResolvedValue(ADMIN_LEADER);
    serverApiMock.mockResolvedValue({
      meetingRoomId: 1,
      name: "박애관 302호",
      location: "박애관 302호",
      availableFrom: "00:00",
      availableTo: "23:30",
    });
    const data = roomForm();
    data.append("id", "1");

    const result = await updateMeetingRoomAction({ errors: {} }, data);

    expect(result.errors).toEqual({});
    expect(serverApiMock).toHaveBeenCalledTimes(1);
  });

  it("updateMeetingRoomAction — is_admin 아닌 로그인 세션이면 BE를 부르지 않고 막는다", async () => {
    getViewerMock.mockResolvedValue(NON_ADMIN_LEADER);
    const data = roomForm();
    data.append("id", "1");

    const result = await updateMeetingRoomAction({ errors: {} }, data);

    expect(result.errors.name).toBe("회의실을 수정할 권한이 없습니다");
    expect(serverApiMock).not.toHaveBeenCalled();
  });

  it("deleteMeetingRoomAction — is_admin 로그인 세션이면 통과해 BE를 부른다", async () => {
    getViewerMock.mockResolvedValue(ADMIN_LEADER);
    serverApiMock.mockResolvedValue(null);
    const data = new FormData();
    data.append("id", "1");

    await deleteMeetingRoomAction(data);

    expect(serverApiMock).toHaveBeenCalledTimes(1);
  });

  it("deleteMeetingRoomAction — is_admin 아닌 로그인 세션이면 BE를 부르지 않고 막는다", async () => {
    getViewerMock.mockResolvedValue(NON_ADMIN_LEADER);
    const data = new FormData();
    data.append("id", "1");

    await expect(deleteMeetingRoomAction(data)).rejects.toThrow("회의실을 삭제할 권한이 없습니다");
    expect(serverApiMock).not.toHaveBeenCalled();
  });
});
