import { MEETING_ITEM_HEIGHT } from "@/components/common/dashboard-meeting-item";

/*
 * 대시보드 두 박스의 고정 높이(px). `page.tsx`와 `loading.tsx`가 같은 골격을 그려야 해서
 * 여기 한 곳에 둔다. **고정 높이 + 내부 스크롤**이라 데이터가 없어도 박스가 찌그러지지 않고,
 * 많아도 박스가 무한정 길어지지 않는다.
 */

/** 팀원 현황 박스 — 인원 가변 → 고정 높이 + 넘치면 내부 스크롤. */
export const MEMBER_BOX_HEIGHT = 320;

/** 회의 위젯 최대 노출 수. 서버가 이만큼 자르고, 박스도 이 수에 맞춰 높이를 잡아 스크롤이 안 생긴다. */
export const MEETING_MAX_ITEMS = 5;

/** 두 박스 공통 헤더 높이(px) — `px-4 py-3` + 아래 보더 1px. */
const BOX_HEADER_HEIGHT = 45;

export const MEETING_BOX_HEIGHT = BOX_HEADER_HEIGHT + MEETING_MAX_ITEMS * MEETING_ITEM_HEIGHT;
