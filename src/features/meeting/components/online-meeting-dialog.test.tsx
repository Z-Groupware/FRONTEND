const pushMock = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));
jest.mock("next/cache", () => ({ revalidatePath: jest.fn() }));
jest.mock("@/lib/mock-actor", () => ({
  getMockActor: jest.fn(() => ({ id: 1, role: "OWNER" })),
}));

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { AUTHORITY } from "@/constants/authority";
import type { RoomMember, RoomProjectOption, RoomTeamActionOption } from "@/features/rooms/types";

import { OnlineMeetingDialog } from "./online-meeting-dialog";

/*
  ⚠️ 이 파일은 `RoomReservationDialog`의 테스트(`room-reservation-dialog.test.tsx`)와 같은
     전제다 — `isMock`을 따로 목하지 않는다(`NEXT_PUBLIC_USE_MOCK`이 없으면 기본이 `true`라
     mock 분기가 실제로 돈다). Owner가 여는 폼이라 참석자 후보는 팀장뿐이다(2026-08-13,
     `attendee-scope.ts`).
*/
const MEMBERS: RoomMember[] = [
  { id: 2, name: "김서준", teamName: "개발팀", authority: AUTHORITY.LEADER },
];
const PROJECTS: RoomProjectOption[] = [{ id: "1", name: "굿즈 프로젝트", tag: "GOODS" }];
const TEAM_ACTIONS: RoomTeamActionOption[] = [];
const OWNER_VIEWER = { id: 1, role: AUTHORITY.OWNER, teamName: null } as const;

function renderDialog() {
  render(
    <OnlineMeetingDialog
      members={MEMBERS}
      projects={PROJECTS}
      showParentTeamAction={false}
      teamActions={TEAM_ACTIONS}
      viewer={OWNER_VIEWER}
    />,
  );
}

describe("OnlineMeetingDialog", () => {
  it("트리거를 누르기 전에는 모달 제목이 없다", () => {
    renderDialog();

    expect(screen.queryByText("비대면 회의 만들기")).not.toBeInTheDocument();
  });

  it("[비대면 회의]를 누르면 회의실·시간 필드 없이 모달이 열린다", async () => {
    const user = userEvent.setup();
    renderDialog();

    await user.click(screen.getByRole("button", { name: "비대면 회의" }));

    expect(screen.getByRole("dialog", { name: "비대면 회의 만들기" })).toBeInTheDocument();
    expect(screen.queryByLabelText("회의실")).not.toBeInTheDocument();
    expect(screen.queryByText(/시작 시간/)).not.toBeInTheDocument();
    expect(screen.getByText("녹음 파일 첨부 (선택)")).toBeInTheDocument();
  });

  it("등록을 누르면 바로 등록하지 않고 확인 모달을 먼저 띄운다", async () => {
    const user = userEvent.setup();
    renderDialog();

    await user.click(screen.getByRole("button", { name: "비대면 회의" }));
    await user.click(screen.getByRole("button", { name: "등록" }));

    expect(screen.getByRole("dialog", { name: "이대로 등록하시겠습니까?" })).toBeInTheDocument();
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("제목 입력 중 Enter로 암시적 제출이 걸려도 확인 모달을 연다", async () => {
    const user = userEvent.setup();
    renderDialog();

    await user.click(screen.getByRole("button", { name: "비대면 회의" }));
    await user.type(screen.getByLabelText("회의 제목"), "새 비대면 회의{Enter}");

    const form = screen.getByLabelText("회의 제목").closest("form");
    expect(form).not.toBeNull();
    fireEvent.submit(form!);

    expect(screen.getByRole("dialog", { name: "이대로 등록하시겠습니까?" })).toBeInTheDocument();
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("필수값을 안 채우고 확인 모달에서 등록을 누르면 필드별 오류를 보여준다", async () => {
    const user = userEvent.setup();
    renderDialog();

    await user.click(screen.getByRole("button", { name: "비대면 회의" }));
    await user.click(screen.getByRole("button", { name: "등록" }));
    await user.click(screen.getByRole("button", { name: "등록" }));

    await waitFor(() => {
      expect(
        screen.getByText(
          (_content, element) =>
            element?.tagName === "P" && element.textContent === "회의 제목을 입력해 주세요",
        ),
      ).toBeInTheDocument();
    });
    expect(
      screen.getByText(
        (_content, element) =>
          element?.tagName === "P" && element.textContent === "프로젝트를 선택해 주세요",
      ),
    ).toBeInTheDocument();
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("성공하면 회의 상세로 이동한다", async () => {
    const user = userEvent.setup();
    renderDialog();

    await user.click(screen.getByRole("button", { name: "비대면 회의" }));
    await user.type(screen.getByLabelText("회의 제목"), "새 비대면 회의");
    await user.click(screen.getByRole("combobox", { name: "프로젝트" }));
    await user.click(await screen.findByRole("option", { name: "굿즈 프로젝트" }));
    await user.type(screen.getByLabelText("안건 1 대주제"), "제품");
    await user.type(screen.getByLabelText("안건 1 소주제"), "점검");
    await user.click(screen.getByRole("checkbox", { name: /김서준/ }));

    await user.click(screen.getByRole("button", { name: "등록" }));
    await user.click(screen.getByRole("button", { name: "등록" }));

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith(expect.stringMatching(/^\/app\/meeting\/meeting-/));
    });
  });
});
