jest.mock("next/cache", () => ({ revalidatePath: jest.fn() }));
jest.mock("@/lib/mock-actor", () => ({
  getMockActor: jest.fn(() => ({ id: 1, role: "OWNER" })),
}));

import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { AUTHORITY } from "@/constants/authority";
import type { RoomMember, RoomProjectOption, RoomTeamActionOption } from "@/features/rooms/types";

import { OnlineMeetingDialog } from "./online-meeting-dialog";

/*
  ⚠️ 이 파일은 `RoomReservationDialog`의 테스트(`room-reservation-dialog.test.tsx`)와 같은
     전제다 — `isMock`을 따로 목하지 않는다(`NEXT_PUBLIC_USE_MOCK`이 없으면 기본이 `true`라
     mock 분기가 실제로 돈다). Owner가 여는 폼이라 참석자 후보는 팀장뿐이다(2026-08-13,
     `attendee-scope.ts`).
  ⚠️ **성공 후 흐름이 바뀌었다**(2026-08-14 팀 확정) — 더는 상세로 `router.push`하지 않는다.
     같은 다이얼로그가 2단계(녹음 파일 제출)로 넘어간다 — `next/navigation` mock이 필요 없다.
*/
const MEMBERS: RoomMember[] = [
  { id: 2, name: "김서준", teamName: "개발팀", authority: AUTHORITY.LEADER },
];
const PROJECTS: RoomProjectOption[] = [{ id: "1", name: "굿즈 프로젝트", tag: "GOODS" }];
const TEAM_ACTIONS: RoomTeamActionOption[] = [];
const OWNER_VIEWER = { id: 1, role: AUTHORITY.OWNER, teamName: null } as const;

function renderDialog() {
  return render(
    <OnlineMeetingDialog
      members={MEMBERS}
      projects={PROJECTS}
      showParentTeamAction={false}
      teamActions={TEAM_ACTIONS}
      viewer={OWNER_VIEWER}
    />,
  );
}

async function fillAndConfirmStep1(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: "비대면 회의" }));
  await user.type(screen.getByLabelText("회의 제목"), "새 비대면 회의");
  await user.click(screen.getByRole("combobox", { name: "프로젝트" }));
  await user.click(await screen.findByRole("option", { name: "굿즈 프로젝트" }));
  await user.type(screen.getByLabelText("안건 1 대주제"), "제품");
  await user.type(screen.getByLabelText("안건 1 소주제"), "점검");
  await user.click(screen.getByRole("checkbox", { name: /김서준/ }));

  await user.click(screen.getByRole("button", { name: "등록" }));

  // ⚠️ 확인 모달이 뜬 뒤엔 폼 안의 [등록] 버튼이 여전히 DOM에 남아 있다 — 전역으로 다시 찾으면
  //    두 개가 잡혀 모호해진다. 뜨는 걸 기다린 뒤 그 다이얼로그 안에서만 찾는다.
  const confirmDialog = await screen.findByRole("dialog", { name: "이대로 등록하시겠습니까?" });
  await user.click(within(confirmDialog).getByRole("button", { name: "등록" }));
}

describe("OnlineMeetingDialog", () => {
  it("트리거를 누르기 전에는 모달 제목이 없다", () => {
    renderDialog();

    expect(screen.queryByText("비대면 회의 만들기")).not.toBeInTheDocument();
  });

  it("[비대면 회의]를 누르면 회의실·시간 필드 없이 1단계가 열린다", async () => {
    const user = userEvent.setup();
    renderDialog();

    await user.click(screen.getByRole("button", { name: "비대면 회의" }));

    expect(screen.getByRole("dialog", { name: "비대면 회의 만들기" })).toBeInTheDocument();
    expect(screen.queryByLabelText("회의실")).not.toBeInTheDocument();
    expect(screen.queryByText(/시작 시간/)).not.toBeInTheDocument();
    // ⚠️ 녹음 파일 첨부는 2단계로 옮겨서 1단계엔 없다(2026-08-14).
    expect(screen.queryByText("녹음 파일 첨부")).not.toBeInTheDocument();
  });

  it("등록을 누르면 바로 등록하지 않고 확인 모달을 먼저 띄운다", async () => {
    const user = userEvent.setup();
    renderDialog();

    await user.click(screen.getByRole("button", { name: "비대면 회의" }));
    await user.click(screen.getByRole("button", { name: "등록" }));

    expect(screen.getByRole("dialog", { name: "이대로 등록하시겠습니까?" })).toBeInTheDocument();
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
  });

  it("1단계 성공하면 같은 창이 2단계(녹음 파일 제출)로 바뀐다 — 페이지 이동 없음", async () => {
    const user = userEvent.setup();
    renderDialog();

    await fillAndConfirmStep1(user);

    await waitFor(() => {
      expect(screen.getByRole("dialog", { name: "녹음 파일 제출" })).toBeInTheDocument();
    });
    expect(screen.getByText("녹음 파일 첨부")).toBeInTheDocument();
  });

  it("2단계에서 [나중에 하기]를 누르면 창이 닫힌다", async () => {
    const user = userEvent.setup();
    renderDialog();

    await fillAndConfirmStep1(user);
    await screen.findByRole("dialog", { name: "녹음 파일 제출" });

    await user.click(screen.getByRole("button", { name: "나중에 하기" }));

    // ⚠️ 닫힘은 상태 변경 두 단계(`setOpen`·`setCreatedMeetingId`)를 거쳐 언마운트된다 —
    //    AI 요약 요청 테스트와 같은 이유로 비동기로 기다린다.
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  /* ⚠️ 녹음 파일은 선택이 아니다 — 첨부 전엔 [AI 요약 요청]이 눌리지 않는다. */
  it("녹음 파일을 첨부하기 전에는 [AI 요약 요청] 버튼이 비활성 상태다", async () => {
    const user = userEvent.setup();
    renderDialog();

    await fillAndConfirmStep1(user);
    await screen.findByRole("dialog", { name: "녹음 파일 제출" });

    expect(screen.getByRole("button", { name: "AI 요약 요청" })).toBeDisabled();
  });

  it("2단계에서 파일을 첨부하고 [AI 요약 요청]을 누르면 확인 모달 없이 바로 제출되고 창이 닫힌다", async () => {
    const user = userEvent.setup();
    renderDialog();

    await fillAndConfirmStep1(user);
    await screen.findByRole("dialog", { name: "녹음 파일 제출" });

    // ⚠️ `container.querySelector`로는 못 찾는다 — `DialogContent`는 `DialogPortal`을 거쳐
    //    `document.body`(또는 범위 테마 컨테이너)에 그려져 RTL의 `container` 바깥에 있다.
    const fileInput = document.querySelector<HTMLInputElement>('input[type="file"]');
    expect(fileInput).not.toBeNull();
    const file = new File(["dummy audio content"], "recording.mp3", { type: "audio/mpeg" });
    await user.upload(fileInput!, file);

    await user.click(screen.getByRole("button", { name: "AI 요약 요청" }));

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });
});
