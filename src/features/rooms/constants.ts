/**
 * 클라이언트·서버 양쪽에서 쓰는 순수 상수만 모은다.
 * ⚠️ `validate.ts`에 두지 않는다 — `validate.ts`는 `lib/permission.ts`(`server-only`)를
 *    가져오는데, 이 상수는 클라이언트 컴포넌트(`room-reservation-dialog.tsx`)도 써야 해서
 *    그 경로로 가져오면 `server-only`가 클라이언트 번들까지 끌려온다(빌드 에러).
 */

/** 예약 길이 — 팀 확정: 30분 한 타임, 연장하지 않는다(CLAUDE.md §브라우저 API). */
export const RESERVATION_DURATION_MINUTES = 30;

/**
 * 회의실 이용 가능 시간(운영시간) select용 30분 단위 옵션 — "00:00"~"23:30", 48개.
 * ⚠️ 검증(`GENERAL_TIME_PATTERN`)은 분 단위 제약이 없지만, 예약 슬롯과 같은 30분 단위로
 *    보여 주는 게 고르기 쉽고 실제로 쓰는 시각도 대개 이 격자 위에 있다.
 */
export const TIME_OPTIONS = Array.from({ length: 48 }, (_, index) => {
  const hour = String(Math.floor(index / 2)).padStart(2, "0");
  const minute = index % 2 === 0 ? "00" : "30";
  return `${hour}:${minute}`;
});

/** 회의실 삭제 확인창 문구 — `room-delete-dialog.tsx` 하나만 쓰지만, 카피 하드코딩 금지
 * 원칙(CLAUDE.md §도메인 상수)에 맞춰 컴포넌트 밖으로 뺐다(`NOTICE_DELETE_CONFIRM`과 같은 자리). */
export const ROOM_DELETE_CONFIRM = {
  /** 확인창 제목 — 회의실 이름을 끼워 넣는다 */
  title: (roomName: string) => `'${roomName}'을 삭제할까요?`,
  description: "삭제하면 예약 화면 목록에서도 사라집니다. 되돌릴 수 없습니다.",
  confirmLabel: "삭제",
  pendingLabel: "삭제 중",
} as const;
