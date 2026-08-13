import { PROCESSING_STATUS } from "@/constants/meeting";

import { fetchAnalysisStatusAction } from "./actions";
import { advance, startTracking } from "./analysis";
import { ANALYSIS_CARD_STATE } from "./types";

/*
  목 시나리오만 지킨다(실서버 분기는 BE가 붙은 뒤 E2E 몫이다). 지키는 건 하나다 —
  **두 번째 조회(5초 × 2 ≈ 10초)에서 카드가 완료로 넘어간다.** 이게 어긋나면 목으로 도는
  데모에서 카드가 끝나는 걸 아무도 못 보거나(영원히 「요약 중」), 주석이 말한 시간과
  화면이 다른 말을 한다.
*/
describe("요약 진행 조회(목)", () => {
  it("첫 조회는 요약 중, 두 번째 조회에서 완료로 넘긴다", async () => {
    await expect(fetchAnalysisStatusAction(7, 0)).resolves.toEqual({
      ok: true,
      status: PROCESSING_STATUS.RUNNING,
    });
    await expect(fetchAnalysisStatusAction(7, 1)).resolves.toEqual({
      ok: true,
      status: PROCESSING_STATUS.DONE,
    });
  });

  /* 호출자가 넘기는 `attempt`가 0부터 오른다는 전제를 상태 기계와 함께 못박는다 */
  it("쫓기 시작한 카드는 두 번 물어보면 완료가 된다", async () => {
    let tracking = startTracking(7, "주간 회의", 1_700_000_000_000);

    tracking = advance(
      tracking,
      await fetchAnalysisStatusAction(tracking.meetingId, tracking.attempt),
    );
    expect(tracking.state).toBe(ANALYSIS_CARD_STATE.RUNNING);
    expect(tracking.attempt).toBe(1);

    tracking = advance(
      tracking,
      await fetchAnalysisStatusAction(tracking.meetingId, tracking.attempt),
    );
    expect(tracking.state).toBe(ANALYSIS_CARD_STATE.DONE);
  });
});
