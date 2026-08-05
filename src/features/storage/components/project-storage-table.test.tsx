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
  oldestRecordedAt: "2026-05-03",
  status: PROJECT_STATUS.DONE,
  ...patch,
});

const renderTable = (projects: ProjectStorage[]) =>
  render(
    <ProjectStorageTable
      projects={projects}
      totalVoiceGb={projects.reduce((sum, p) => sum + p.voiceGb, 0)}
      canManage
      onDelete={() => {}}
    />,
  );

describe("ProjectStorageTable", () => {
  it("녹음 날짜를 우리 표기로 보여 준다 — ISO를 그대로 찍지 않는다", () => {
    renderTable([project()]);

    expect(screen.getByText("5월 3일(일)")).toBeInTheDocument();
    expect(screen.queryByText("2026-05-03")).not.toBeInTheDocument();
  });

  it("녹음이 없으면 날짜 대신 `—`다 — 지운 줄이 없는 녹음의 날짜를 말하면 안 된다", () => {
    // 삭제 뒤 상태: 음성 0 · 회의 0, 자막·요약과 옛 날짜만 남는다
    renderTable([project({ voiceGb: 0, meetingCount: 0 })]);

    expect(screen.queryByText("5월 3일(일)")).not.toBeInTheDocument();
    expect(screen.getByText("—")).toBeInTheDocument();
  });
});
