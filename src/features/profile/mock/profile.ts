import { ROLE } from "@/constants/role";

import type { MyProfile } from "../types";

/** ⚠️ 목 데이터 — BE 연동 전. `getViewer()`(셸)와 별개로, 마이페이지 표시용 필드만 담는다. */
export const MY_PROFILE_MOCK: MyProfile = {
  name: "김서준",
  email: "seojun@techstart.kr",
  role: ROLE.OWNER,
  companyName: "(주)테크스타트",
  teamName: "제품개발팀",
  position: "수석",
  joinedAt: "2021-03-02",
};
