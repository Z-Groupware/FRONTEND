"use server";

import {
  HANDOVER_STATUS,
  HANDOVER_TYPE,
  type HandoverStatus,
  type HandoverStatusBe,
  mapHandoverStatusFromBe,
} from "@/constants/domain";
import { requireAccessToken } from "@/features/auth/session";
import { serverApi } from "@/lib/api";
import { ep } from "@/lib/endpoints";
import { isMock } from "@/mocks/config";

import { type SubmitHandoverPayload, toHandoverCreateRequestBody } from "./lib";

export type {
  SubmitHandoverPayload,
  SubmitOffboardingHandoverPayload,
  SubmitVacationHandoverPayload,
} from "./lib";

/** [확인] BE `HandoverResponse` — 생성 응답에서 재배정에 필요한 `id`·`status`만 본다. */
interface BeCreatedHandover {
  id: number;
  status: HandoverStatusBe;
}

/**
 * [인수인계서 신청] — 접수한다.
 * ⚠️ **팀장 본인 휴직의 자가 재배정**(`assignments`)은 생성 바디에 안 실린다 — BE `POST`가
 *    그 필드를 안 받는다(`lib.ts` §`toHandoverCreateRequestBody` 주석). 생성 뒤 건별
 *    `PATCH .../items/{actionId}/reassign`으로 따로 보낸다(`team-handover/actions.ts`의
 *    `commitHandoverReassignments`와 같은 패턴).
 */
export async function submitHandoverAction(
  payload: SubmitHandoverPayload,
): Promise<{ status: HandoverStatus }> {
  if (isMock) {
    void payload;
    return { status: HANDOVER_STATUS.SUBMITTED };
  }

  const accessToken = await requireAccessToken();
  const created = await serverApi<BeCreatedHandover>(ep.handovers(), {
    method: "POST",
    json: toHandoverCreateRequestBody(payload),
    accessToken,
  });

  if (payload.type === HANDOVER_TYPE.VACATION) {
    for (const [actionId, assigneeId] of Object.entries(payload.assignments)) {
      await serverApi<unknown>(ep.handoverReassignItem(created.id, Number(actionId)), {
        method: "PATCH",
        json: { toMemberId: assigneeId },
        accessToken,
      });
    }
  }

  return { status: mapHandoverStatusFromBe(created.status) };
}
