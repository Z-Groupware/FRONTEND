import type { Notice } from "../types";

/**
 * ⚠️ 목 데이터 — BE 연동 전. 워크벤치 "공지" 화면에서 보여줄 예시 값이다.
 * `isRead`도 지금은 목 값이다 — 실제 읽음 처리는 후속 작업(Server Action)에서 붙인다(§정직성).
 */
export const MOCK_NOTICES: Notice[] = [
  {
    id: "notice-1",
    title: "회의실 예약과 참석 안내",
    body: "회의는 회의실 예약 화면에서만 개설할 수 있습니다. 예약이 확정되면 참석자에게 회의 개설 및 시작 전 안내가 표시됩니다.",
    publishedAt: "2026-08-03",
    isRead: false,
  },
];
