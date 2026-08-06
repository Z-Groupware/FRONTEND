import { render, screen } from "@testing-library/react";

import { AUTHORITY_LABEL } from "@/constants/authority";

import { MY_PROFILE_MOCK } from "../mock/profile";
import { ProfileHeader } from "./profile-header";

describe("ProfileHeader", () => {
  it("이름·이메일·역할 라벨·소속을 보여준다", () => {
    render(<ProfileHeader profile={MY_PROFILE_MOCK} />);

    expect(screen.getByText(MY_PROFILE_MOCK.name)).toBeInTheDocument();
    expect(screen.getByText(MY_PROFILE_MOCK.email)).toBeInTheDocument();
    expect(screen.getByText(AUTHORITY_LABEL[MY_PROFILE_MOCK.role])).toBeInTheDocument();
    expect(
      screen.getByText(
        `${MY_PROFILE_MOCK.companyName} · ${MY_PROFILE_MOCK.teamName} · ${MY_PROFILE_MOCK.position}`,
      ),
    ).toBeInTheDocument();
  });
});
