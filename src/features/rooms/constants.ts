/**
 * 클라이언트·서버 양쪽에서 쓰는 순수 상수만 모은다.
 * ⚠️ `validate.ts`에 두지 않는다 — `validate.ts`는 `lib/permission.ts`(`server-only`)를
 *    가져오는데, 이 상수는 클라이언트 컴포넌트(`room-reservation-dialog.tsx`)도 써야 해서
 *    그 경로로 가져오면 `server-only`가 클라이언트 번들까지 끌려온다(빌드 에러).
 */

/** 예약 길이 — 팀 확정: 30분 한 타임, 연장하지 않는다(CLAUDE.md §브라우저 API). */
export const RESERVATION_DURATION_MINUTES = 30;
