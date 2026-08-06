import { render, screen } from "@testing-library/react";

import { PROFILE_INFO_CARD_TITLE, PROFILE_INFO_ROW_LABEL } from "@/constants/profile";

import { MY_PROFILE_MOCK } from "../mock/profile";
import { ProfileInfoCard } from "./profile-info-card";

describe("ProfileInfoCard", () => {
  it("기본 정보 제목과 각 행의 라벨·값을 정해진 순서대로 보여준다", () => {
    render(<ProfileInfoCard profile={MY_PROFILE_MOCK} />);

    expect(screen.getByText(PROFILE_INFO_CARD_TITLE)).toBeInTheDocument();

    const expectedRows: [string, string][] = [
      [PROFILE_INFO_ROW_LABEL.NAME, MY_PROFILE_MOCK.name],
      [PROFILE_INFO_ROW_LABEL.EMAIL, MY_PROFILE_MOCK.email],
      [PROFILE_INFO_ROW_LABEL.TEAM, MY_PROFILE_MOCK.teamName],
      [PROFILE_INFO_ROW_LABEL.POSITION, MY_PROFILE_MOCK.position],
      [PROFILE_INFO_ROW_LABEL.JOINED_AT, MY_PROFILE_MOCK.joinedAt],
    ];

    expectedRows.forEach(([label, value]) => {
      const row = screen.getByText(label).closest("div");
      expect(row).toHaveTextContent(value);
    });

    const renderedLabels = expectedRows.map(([label]) => screen.getByText(label));
    const documentOrder: Element[] = [...document.body.querySelectorAll("p")];
    const indices = renderedLabels.map((node) => documentOrder.indexOf(node));
    expect(indices).toEqual([...indices].sort((a, b) => a - b));
  });
});
