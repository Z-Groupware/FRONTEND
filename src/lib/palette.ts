/**
 * 이름에서 **항상 같은 색**을 뽑는 팔레트.
 *
 * BE에 색 필드가 없어 프론트가 정한다 — 같은 이름이면 어느 화면에서든 같은 색이 나온다.
 * 프로젝트 태그와 프로필 아바타(`hooks/use-profile-avatar`)가 **같은 팔레트**를 쓴다.
 *
 * ⚠️ **값은 여기 없다.** 실제 색은 `globals.css`의 `--tag-*` 변수이고, 여기는 이름만 고른다 —
 *    라이트·다크가 다른 값이라 hex를 코드에 들고 있으면 테마가 바뀔 때 못 따라간다
 *    (§디자인 토큰: 하드코딩 금지 · CSS 변수로 정의).
 * ⚠️ **배열 순서·개수를 바꾸지 않는다.** 바꾸면 기존 이름들의 색 배정이 전부 밀린다.
 * ⚠️ 이 색들은 **구분용이지 알림용이 아니다.** 그래서 뜻이 이미 있는 색
 *    (에러 빨강 · 상태점 초록/보라/회색 · 액센트 파랑 · 경고 앰버 · Owner 오렌지)은
 *    팔레트에서 뺐다. 태그가 그 색을 쓰면 뜻이 있는 것처럼 읽힌다.
 * ⚠️ 열한 색뿐이라 **겹친다.** 프로젝트가 다섯만 돼도 같은 색이 나올 수 있다 —
 *    사용자가 직접 고르게 되면(BE에 색 필드가 생기면) 겹쳐도 본인이 정한 것이라 괜찮지만,
 *    자동 배정인 지금은 겹치는 게 정상이다. 색으로 프로젝트를 **식별하지 않는다** —
 *    식별은 이름과 태그가 한다.
 */
const TAG_NAMES = [
  "slate",
  "yellow",
  "lime",
  "emerald",
  "teal",
  "cyan",
  "sky",
  "indigo",
  "purple",
  "fuchsia",
  "pink",
] as const;

export interface PaletteColor {
  /** 칩 배경 — `var(--tag-teal-bg)`. 테마 전환은 CSS가 한다 */
  bgColor: string;
  /** 칩 글자 — 배경 위에서 4.5:1을 넘는 값이다 */
  textColor: string;
  /**
   * 원색 — **막대처럼 글자가 안 얹히는 자리**에 쓴다.
   * ⚠️ 글자에 쓰지 않는다. 바탕 위에서 보이기만 하면 되는 값이라 대비 기준이 다르다.
   */
  solidColor: string;
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
  const name = TAG_NAMES[hashString(key) % TAG_NAMES.length] ?? TAG_NAMES[0];
  return {
    bgColor: `var(--tag-${name}-bg)`,
    textColor: `var(--tag-${name}-fg)`,
    solidColor: `var(--tag-${name}-solid)`,
  };
}
