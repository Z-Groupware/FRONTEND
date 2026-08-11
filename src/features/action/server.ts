import { requireAccessToken } from "@/features/auth/session";
import { ApiError, serverApi } from "@/lib/api";
import { ep } from "@/lib/endpoints";
import { isMock } from "@/mocks/config";

import { type BeActionDetail, toPersonalActionDetail } from "./mapper";
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

  const numericId = Number(actionId);
  if (!Number.isInteger(numericId)) return null;

  const accessToken = await requireAccessToken();
  try {
    const detail = await serverApi<BeActionDetail>(ep.action(numericId), { accessToken });
    return toPersonalActionDetail(detail);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}
