import { type BeActionSummary, toMemberAction } from "@/features/action/mapper";
import { requireAccessToken } from "@/features/auth/session";
import type { BePageResponse } from "@/features/project/mapper";
import { serverApi } from "@/lib/api";
import { ep } from "@/lib/endpoints";
import { isMock } from "@/mocks/config";

import { getDaysUntilDue, isDueSoon, MEETING_MAX_ITEMS } from "./lib";
import { MEMBER_ACTIONS_MOCK, MEMBER_ATTENDED_MEETINGS_MOCK } from "./mock/dashboard";
import type { MemberDashboardOverview } from "./types";

export async function getMemberDashboardOverview(): Promise<MemberDashboardOverview> {
  if (isMock) {
    return {
      // 마감 7일 이내(연체 포함)·미완료만, 마감 임박순(연체가 맨 위). 개수 제한 없음 → 박스 내부 스크롤
      dueSoonActions: MEMBER_ACTIONS_MOCK.filter(isDueSoon).sort(
        (a, b) => getDaysUntilDue(a.dueDate) - getDaysUntilDue(b.dueDate),
      ),
      // 최신순 5건
      attendedMeetings: [...MEMBER_ATTENDED_MEETINGS_MOCK]
        .sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime())
        .slice(0, MEETING_MAX_ITEMS),
    };
  }

  // ⚠️ "처리할 액션"은 우리 도메인(개인 액션)이라 바로 연동한다. GET /api/actions는 이미
  //    본인 소유분만 스코프돼 있어서(토큰 기준), 여기선 PERSONAL만 남기고 마감 임박 필터·
  //    정렬만 클라에서 한다(BE 목록에 이 필터 자체가 없다).
  const accessToken = await requireAccessToken();
  const page = await serverApi<BePageResponse<BeActionSummary>>(ep.actions({ size: 9999 }), {
    accessToken,
  });
  const dueSoonActions = page.content
    .filter((action) => action.actionType === "PERSONAL")
    .map(toMemberAction)
    .filter(isDueSoon)
    .sort((a, b) => getDaysUntilDue(a.dueDate) - getDaysUntilDue(b.dueDate));

  /*
    ⚠️ "참석 회의"는 회의 도메인 몫이다(캘린더·Todo와 같은 성격, 우리 담당 아님) — 회의
    담당자가 아직 API를 안 붙였다. 옛 mock 회의를 계속 보여주면 연동된 것처럼 보여서
    거짓말이 된다(§정직성) — 그 담당자가 붙이기 전까지는 빈 배열이 맞다. 화면엔 이미
    "참석할 회의가 없습니다" 빈 상태가 있어 자연스럽게 처리된다.
  */
  return { dueSoonActions, attendedMeetings: [] };
}
