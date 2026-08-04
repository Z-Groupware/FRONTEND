import { NOTICE_TARGET } from "@/constants/domain";

import type { NoticeHistoryItem } from "../types";

/** ⚠️ 목 데이터 — BE 연동 전. SYSTEM 공지 관리 "발행 이력"에 보여줄 예시 값이다. */
export const MOCK_NOTICE_HISTORY: NoticeHistoryItem[] = [
  {
    id: "notice-2025-07-15",
    title: "7월 정기 점검 안내",
    target: NOTICE_TARGET.ALL,
    sentAt: "2025-07-15",
    recipientCompanyCount: 62,
  },
  {
    id: "notice-2025-07-08",
    title: "Team 플랜 신기능 출시",
    target: NOTICE_TARGET.TEAM,
    sentAt: "2025-07-08",
    recipientCompanyCount: 38,
  },
  {
    id: "notice-2025-06-28",
    title: "베타 기간 종료 예정 안내",
    target: NOTICE_TARGET.ALL,
    sentAt: "2025-06-28",
    recipientCompanyCount: 62,
  },
];
