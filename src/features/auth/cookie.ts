/**
 * 세션 쿠키의 **이름과 수명 한 곳** — `session.ts`와 `proxy.ts`가 같이 본다.
 *
 * ⚠️ `session.ts`는 `server-only`라 `proxy.ts`(Next 16 미들웨어)가 import할 수 없다.
 *    그래서 이름·수명만 이 파일로 떼어 놓는다 — 두 곳에 각자 적어 두면 한쪽만 고치는 날
 *    쿠키를 굽는 이름과 읽는 이름이 갈라진다.
 * ⚠️ 여기엔 `cookies()`를 부르는 코드가 없다. 값과 규칙만 있다.
 */

export const ACCESS_TOKEN_COOKIE = "z_access_token";
export const REFRESH_TOKEN_COOKIE = "z_refresh_token";

/**
 * "로그인 상태 유지"를 켰는지 — **토큰이 아니다.**
 *
 * ⚠️ 재발급(`POST /api/auth/refresh`)에 이 값을 같이 보내야 BE가 갱신표 수명을
 *    1일로 줄지 14일로 줄지 정한다. 로그인 때 고른 값을 기억해 둘 곳이 필요하다.
 * ⚠️ 비밀이 아니지만 그래도 httpOnly로 굽는다 — 브라우저 JS가 읽을 이유가 없다.
 */
export const KEEP_SIGNED_IN_COOKIE = "z_keep_signed_in";

/**
 * 액세스 토큰 쿠키 수명 — **BE의 `access-ttl: 30m`과 맞춘다**(application.yaml).
 *
 * ⚠️ **토큰보다 길게 두면 안 된다.** 전에는 14일로 뒀는데, 그러면 30분이 지나 서버에서
 *    죽은 토큰이 쿠키에는 멀쩡히 남아 있어 **재발급할 때를 알 수 없다** — 사용자는
 *    아무 화면에서나 401을 맞고 로그인 화면으로 떨어졌다.
 * ⚠️ 쿠키가 토큰과 같이 사라지므로, "액세스 쿠키가 없는데 갱신표는 있다"가 곧
 *    **"재발급할 때다"** 라는 신호가 된다(`proxy.ts`).
 */
export const ACCESS_TOKEN_MAX_AGE = 60 * 30;

/**
 * 갱신표 쿠키 수명 — BE `refresh-ttl-extended: 14d`와 맞춘다.
 *
 * ⚠️ "로그인 상태 유지"를 **끄면 수명을 안 준다**(세션 쿠키). 브라우저를 닫으면 사라진다 —
 *    공용 PC에서 체크를 끄는 사람이 기대하는 동작이고, BE의 `refresh-ttl-default: 1d`보다
 *    짧아지는 건 안전한 쪽이라 괜찮다.
 */
export const REFRESH_TOKEN_MAX_AGE = 60 * 60 * 24 * 14;

/** 쿠키 공통 속성 — 토큰이 브라우저 JS에 안 보이게 하는 게 핵심이다. */
export function tokenCookieOptions(maxAge?: number) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    // 개발은 http라 `secure`를 켜면 쿠키가 아예 안 굽힌다
    secure: process.env.NODE_ENV === "production",
    path: "/",
    ...(maxAge === undefined ? {} : { maxAge }),
  };
}
