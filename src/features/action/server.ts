import { isMock } from "@/mocks/config";

import { PERSONAL_ACTION_DETAIL_MOCK } from "./mock/action-detail";
import type { PersonalActionDetail } from "./types";

/** 개인 액션 상세(`/app/actions/:actionId`). 못 찾으면 `null`(호출부가 404). */
export async function getPersonalActionDetail(
  actionId: string,
): Promise<PersonalActionDetail | null> {
  if (isMock) {
    const numericId = Number(actionId);
    if (!Number.isInteger(numericId)) return null;
    return PERSONAL_ACTION_DETAIL_MOCK[numericId] ?? null;
  }

  throw new Error("서버 연동 미구현 — ERD·API 스펙 확정 후 매퍼 작성");
}
