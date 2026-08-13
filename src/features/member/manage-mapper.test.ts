import { ACTION_STATUS } from "@/constants/domain";

import { type BeCompanyAction, toManagedMemberAction } from "./manage-mapper";

/**
 * 사원 상세 담당 액션 매퍼 — `GET /api/company/actions` → 화면 계약.
 * ⚠️ 실서버 호출은 여기서 못 돈다(세션·BE 필요). 경로·권한·파라미터는 `manage-server.ts`의
 *    [확인] 주석이 BE `CompanyActionController`와 대조한다 — 여기서는 **옮겨 담는 규칙**만 본다.
 */

const beAction: BeCompanyAction = {
  id: 42,
  title: "굿즈 시안 2차 검토",
  status: ACTION_STATUS.IN_PROGRESS,
  dueDate: "2026-08-20",
};

describe("담당 액션 매퍼 (toManagedMemberAction)", () => {
  it("id를 문자열로 바꿔 화면 계약에 맞춘다", () => {
    expect(toManagedMemberAction(beAction)).toEqual({
      id: "42",
      title: "굿즈 시안 2차 검토",
      status: ACTION_STATUS.IN_PROGRESS,
      dueDate: "2026-08-20",
    });
  });

  /*
    ⚠️ **`isDelayed`를 옮겨 담지 않는다.** BE도 저장값이 아니라 조회 시점에 계산해 주는데,
       화면은 이미 마감일에서 계산한다(§도메인 상수: 파생값은 상태 필드에 안 넣는다).
       둘 다 들고 있으면 자정 무렵에 서버 시각과 브라우저 시각이 갈려 배지가 서로 다른
       말을 한다 — 계약에 아예 안 실어야 나중에 누가 그 값을 쓰지 않는다.
  */
  it("지연 여부는 계약에 싣지 않는다 — 화면이 마감일로 계산한다", () => {
    const mapped = toManagedMemberAction({ ...beAction, dueDate: "2020-01-01" });

    expect(Object.keys(mapped).sort()).toEqual(["dueDate", "id", "status", "title"]);
  });

  // 상태는 저장값 셋 그대로 흘린다 — 라벨로 바꾸는 일은 화면이 한다(라벨 하드코딩 금지).
  it("상태 상수를 그대로 넘긴다", () => {
    expect(toManagedMemberAction({ ...beAction, status: ACTION_STATUS.DONE }).status).toBe(
      ACTION_STATUS.DONE,
    );
  });
});
