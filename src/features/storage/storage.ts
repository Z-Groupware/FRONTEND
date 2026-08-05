import { PROJECT_STATUS } from "@/constants/project";
import type { BillingConfig } from "@/features/billing/types";

import type { ProjectStorage, StorageOverview } from "./types";

/**
 * 녹음 용량 계산 — 전부 **표시용**이다. 실제 청구는 서버가 정한다.
 *
 * ⚠️ 사용량 계산은 이미 `billing/usage.ts`가 한다. 여기는 그걸 대신하지 않고,
 *    **이 화면에만 필요한 것**(무엇을 지우면 얼마가 비는지)만 센다.
 */

export interface StorageTotals {
  /** 음성 + 자막·요약 */
  usedGb: number;
  voiceGb: number;
  sttGb: number;
  /** 기본료에 포함된 양 */
  includedGb: number;
  /** 소진율(0~1). 넘기면 1보다 커진다 — **1로 자르지 않는다**, 얼마나 넘겼는지가 중요하다 */
  ratio: number;
  /** 넘긴 양(GB). 안 넘겼으면 0 */
  overageGb: number;
  /** 넘긴 만큼의 월 금액(원) */
  overageAmount: number;
}

export function buildStorageTotals(
  overview: StorageOverview,
  config: BillingConfig,
): StorageTotals {
  const usedGb = overview.voiceGb + overview.sttGb;
  const includedGb = config.includedStorageGb;
  const overageGb = Math.max(0, usedGb - includedGb);

  return {
    usedGb,
    voiceGb: overview.voiceGb,
    sttGb: overview.sttGb,
    includedGb,
    /*
      ⚠️ 포함량이 0이면 나눗셈이 무한대가 된다. BE 값이라 0이 올 수도 있으니 막아 둔다 —
         게이지가 `Infinity%`가 되면 칸을 뚫고 나간다.
      ⚠️ 그렇다고 **0으로 두면 안 된다.** 포함량 0에 쓴 게 있으면 전부가 초과인데
         화면은 `0% · 초과`라는 앞뒤 안 맞는 말을 하게 된다 — 그때는 꽉 찬 것으로 본다.
    */
    ratio: includedGb > 0 ? usedGb / includedGb : usedGb > 0 ? 1 : 0,
    overageGb,
    overageAmount: Math.round(overageGb * config.overagePerGbMonth),
  };
}

/**
 * 지울 수 있는 줄인가 — **끝난 프로젝트만.**
 *
 * ⚠️ 진행 중인 프로젝트의 녹음은 아직 다시 들을 일이 남아 있다. 화면에서 버튼을 감추는 것만으로는
 *    부족해서 **서버 액션에서도 같은 판정을 다시 한다**(CLAUDE.md §권한).
 * ⚠️ 음성이 0인 줄도 지울 게 없다 — 눌러도 아무 일이 없는 버튼은 두지 않는다.
 */
export function canDeleteRecordings(project: ProjectStorage): boolean {
  return project.status === PROJECT_STATUS.DONE && project.voiceGb > 0;
}

/**
 * 지우면 비는 용량(GB).
 *
 * ⚠️ **음성만 센다.** 자막·요약은 지우지 않는다 — 회의에서 남은 결과물이라,
 *    그것까지 비는 것처럼 말하면 실제로 비는 양보다 크게 약속하는 셈이 된다(§정직성).
 */
export function freedGb(project: ProjectStorage): number {
  return project.voiceGb;
}

/** 지울 수 있는 줄을 다 지우면 비는 용량(GB) — 안내 문구에 쓴다 */
export function totalFreeableGb(projects: readonly ProjectStorage[]): number {
  return projects.filter(canDeleteRecordings).reduce((sum, project) => sum + freedGb(project), 0);
}
