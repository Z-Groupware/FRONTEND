/**
 * 이름에서 **항상 같은 색**을 뽑는 팔레트.
 *
 * BE에 색 필드가 없어 프론트가 정한다 — 같은 이름이면 어느 화면에서든 같은 색이 나온다.
 * 프로필 아바타(`hooks/use-profile-avatar`)와 프로젝트 태그가 **같은 팔레트**를 쓴다.
 *
 * ⚠️ 이 색들은 **구분용이지 알림용이 아니다.** 초록이 성공이라거나 빨강이 위험이라는 뜻이
 *    아니다 — 뜻을 담는 색은 §디자인 토큰이 정한 것(에러·상태점)뿐이다.
 * ⚠️ **배열 순서·개수를 바꾸지 않는다.** 바꾸면 기존 이름들의 색 배정이 전부 밀린다.
 *    팔레트를 손볼 때는 각 항목의 값만 바꾼다.
 * ⚠️ 여기만 생 hex를 쓴다. 토큰으로 뺄 수 없어서다 — 16색 × 라이트·다크를 CSS 변수로 두면
 *    쓰지도 않는 변수가 32개 생기고, 그중 무엇이 어느 이름에 붙는지는 어차피 여기서 정해진다.
 */
const PALETTE = [
  { bg: "#DCFCE7", text: "#166534" }, // 그린
  { bg: "#DBEAFE", text: "#1E40AF" }, // 블루
  { bg: "#FCE7F3", text: "#9D174D" }, // 핑크
  { bg: "#FEF3C7", text: "#92400E" }, // 앰버
  { bg: "#EDE9FE", text: "#5B21B6" }, // 바이올렛
  { bg: "#E0F2FE", text: "#075985" }, // 스카이
  { bg: "#FFEDD5", text: "#9A3412" }, // 오렌지
  { bg: "#F1F5F9", text: "#334155" }, // 슬레이트
  { bg: "#CCFBF1", text: "#115E59" }, // 틸
  { bg: "#FAE8FF", text: "#86198F" }, // 퍼플핑크
  { bg: "#FEF9C3", text: "#854D0E" }, // 옐로우
  { bg: "#E7E5E4", text: "#44403C" }, // 웜그레이
  { bg: "#D1FAE5", text: "#065F46" }, // 에메랄드
  { bg: "#DDD6FE", text: "#4C1D95" }, // 인디고
  { bg: "#FFE4E6", text: "#9F1239" }, // 로즈
  { bg: "#CFFAFE", text: "#155E75" }, // 시안
] as const;

export interface PaletteColor {
  bgColor: string;
  textColor: string;
}

function hashString(value: string): number {
  let hash = 0;
  for (let index = 0; index < value.length; index++) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash);
}

/**
 * 키 하나로 색을 고른다 — 같은 키는 언제나 같은 색이다.
 *
 * ⚠️ 무작위가 아니다. 새로고침마다 색이 바뀌면 "그 초록 프로젝트"로 기억할 수가 없다.
 */
export function pickPaletteColor(key: string): PaletteColor {
  const palette = PALETTE[hashString(key) % PALETTE.length] ?? PALETTE[0];
  return { bgColor: palette.bg, textColor: palette.text };
}
