import { render, screen } from "@testing-library/react";

import { PROJECT_STATUS } from "@/constants/project";

import type { ProjectStorage } from "../types";
import { ProjectStorageTable } from "./project-storage-table";

/**
 * 표가 **거짓 숫자를 말하지 않는지** 본다.
 * 지운 뒤 남은 옛 날짜, ISO 그대로 찍기 같은 것들.
 */

const project = (patch: Partial<ProjectStorage> = {}): ProjectStorage => ({
  tag: "a",
  name: "프로젝트 A",
  meetingCount: 12,
  voiceGb: 3.6,
  sttGb: 0.8,
  lastRecordedAt: "2026-05-03",
  status: PROJECT_STATUS.DONE,
  ...patch,
});

const renderTable = (projects: ProjectStorage[]) =>
  render(
    <ProjectStorageTable
      projects={projects}
      totalVoiceGb={projects.reduce((sum, p) => sum + p.voiceGb, 0)}
      canManage
      today="2026-08-05"
      onDelete={() => {}}
    />,
  );

describe("ProjectStorageTable", () => {
  it("마지막 녹음을 상대 표기로 보여 준다 — 며칠인지 세는 건 사람 몫이 아니다", () => {
    // 기준 날짜는 2026-08-05, 픽스처의 마지막 녹음은 2026-05-03이다
    renderTable([project()]);

    expect(screen.getByText("3개월 전")).toBeInTheDocument();
    expect(screen.queryByText("2026-05-03")).not.toBeInTheDocument();
  });

  it("정확한 날짜를 버리지 않는다 — `time`에 원본과 우리 표기가 함께 남는다", () => {
    renderTable([project()]);

    const recorded = screen.getByText("3개월 전");
    expect(recorded.tagName).toBe("TIME");
    expect(recorded).toHaveAttribute("dateTime", "2026-05-03");
    expect(recorded).toHaveAttribute("title", "5월 3일(일)");
  });

  it("미래 날짜는 지어내지 않고 절대 날짜로 물러선다", () => {
    renderTable([project({ lastRecordedAt: "2026-12-25" })]);

    expect(screen.getByText("12월 25일(금)")).toBeInTheDocument();
  });

  it("녹음이 없으면 날짜 대신 `—`다 — 지운 줄이 없는 녹음의 날짜를 말하면 안 된다", () => {
    // 삭제 뒤 상태: 음성 0 · 회의 0, 자막·요약과 옛 날짜만 남는다
    renderTable([project({ voiceGb: 0, meetingCount: 0 })]);

    expect(screen.queryByText("3개월 전")).not.toBeInTheDocument();
    expect(screen.getByText("—")).toBeInTheDocument();
  });
});
