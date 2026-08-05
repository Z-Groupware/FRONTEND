import "server-only";

import { PROJECT_STATUS } from "@/constants/project";
import { isMock } from "@/mocks/config";

import type { StorageOverview } from "./types";

/**
 * 녹음 용량 조회 — **격리막**.
 *
 * ⚠️ 컴포넌트는 반환 타입(`StorageOverview`)만 본다. 연동되면 여기서 `isMock` 분기만
 *    실서버 호출로 바꾸고 매퍼가 shape을 흡수한다 — 화면은 안 바뀐다.
 * ⚠️ ERD·API가 아직 없다(BE 협의 전). 아래 값은 "그럴듯한 예시"가 아니라 **가정한 shape**이다.
 */

/**
 * 목 — 50GB 중 41.7GB를 쓴 회사(음성 34.9 + 자막·요약 6.8).
 *
 * ⚠️ **총량은 구독·결제 화면과 같은 숫자여야 한다.** 둘 다 같은 회사의 저장 용량인데
 *    다르면 데모에서 화면을 오갈 때 숫자가 어긋난다 — 여기 합계는 `billing/server.ts`의
 *    `voiceStorageGb`(34.9) · `sttStorageGb`(6.8)와 맞춰 둔다. BE가 붙으면 한 소스가 준다.
 *
 * ⚠️ 음성이 자막·요약보다 훨씬 크다. 실제로도 그렇고(오디오 대 텍스트), 그래야
 *    "지울 건 음성"이라는 이 화면의 말이 숫자로도 맞다.
 * ⚠️ 끝난 프로젝트를 **둘** 뒀다 — 지울 수 있는 줄이 하나도 없으면 그 경로를 못 본다.
 */
const MOCK: StorageOverview = {
  voiceGb: 34.9,
  sttGb: 6.8,
  projects: [
    {
      tag: "product-v2",
      name: "제품 v2.0",
      meetingCount: 24,
      voiceGb: 9.1,
      sttGb: 1.4,
      lastRecordedAt: "2026-08-03",
      status: PROJECT_STATUS.IN_PROGRESS,
    },
    {
      tag: "infra-migration",
      name: "인프라 마이그레이션",
      meetingCount: 31,
      voiceGb: 10.9,
      sttGb: 1.7,
      lastRecordedAt: "2026-07-29",
      status: PROJECT_STATUS.IN_PROGRESS,
    },
    {
      tag: "marketing-q3",
      name: "마케팅 캠페인 Q3",
      meetingCount: 18,
      voiceGb: 6.8,
      sttGb: 1.1,
      lastRecordedAt: "2026-08-01",
      status: PROJECT_STATUS.IN_PROGRESS,
    },
    {
      tag: "hr-process",
      name: "HR 프로세스 재정비",
      meetingCount: 12,
      voiceGb: 4.5,
      sttGb: 1.3,
      lastRecordedAt: "2026-03-27",
      status: PROJECT_STATUS.DONE,
    },
    {
      tag: "ops-automation",
      name: "운영 자동화",
      meetingCount: 9,
      voiceGb: 3.6,
      sttGb: 1.3,
      lastRecordedAt: "2025-11-14",
      status: PROJECT_STATUS.DONE,
    },
  ],
};

export async function getStorageOverview(): Promise<StorageOverview> {
  if (isMock) return MOCK;

  // TODO(BE 협의): `GET /companies/me/storage` → { voiceGb, sttGb, projects[] }
  throw new Error("저장소 정보를 불러오지 못했습니다");
}
