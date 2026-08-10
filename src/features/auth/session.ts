import "server-only";

import { cookies } from "next/headers";

import {
  ACCESS_TOKEN_COOKIE,
  ACCESS_TOKEN_MAX_AGE,
  KEEP_SIGNED_IN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  REFRESH_TOKEN_MAX_AGE,
  tokenCookieOptions,
} from "./cookie";

/**
 * 세션 — **httpOnly 쿠키 한 곳**(CLAUDE.md §렌더링·데이터: `localStorage` 토큰 금지).
 *
 * BE는 토큰을 본문으로 내리고 쿠키를 굽지 않는다(`TokenResponse.java` 주석) — 굽는 건 여기다.
 * 그래서 도메인·SameSite·수명을 **이 파일과 `cookie.ts`**가 정한다.
 *
 * ⚠️ **액세스 쿠키는 토큰과 같은 30분짜리다**(`ACCESS_TOKEN_MAX_AGE`). 토큰보다 길게 두면
 *    서버에서 죽은 토큰이 쿠키에 남아 재발급할 때를 알 수 없다 — 그 상태가 곧 "로그아웃"이 됐다.
 * ⚠️ 갱신표로 다시 받아 오는 일은 **`proxy.ts`가 한다.** 서버 컴포넌트는 쿠키를 못 굽기
 *    때문이다(Next 제약: `cookies().set`은 Server Action·Route Handler·미들웨어에서만 된다).
 *    그래서 `getMe()`가 401을 받았을 때 그 자리에서 갱신할 수 없다.
 */

export interface SessionTokens {
  accessToken: string;
  refreshToken: string;
}

export async function setSession(tokens: SessionTokens, keepSignedIn: boolean): Promise<void> {
  const jar = await cookies();

  jar.set(ACCESS_TOKEN_COOKIE, tokens.accessToken, tokenCookieOptions(ACCESS_TOKEN_MAX_AGE));
  /*
    ⚠️ "로그인 상태 유지"를 끄면 갱신표는 **세션 쿠키**다(수명 없음) — 브라우저를 닫으면 사라진다.
       공용 PC에서 체크를 끄는 사람이 기대하는 동작이다.
  */
  jar.set(
    REFRESH_TOKEN_COOKIE,
    tokens.refreshToken,
    tokenCookieOptions(keepSignedIn ? REFRESH_TOKEN_MAX_AGE : undefined),
  );
  /*
    ⚠️ 재발급할 때 이 값을 BE에 같이 보내야 갱신표 수명이 로그인 때와 같게 유지된다.
       안 보내면 BE가 `false`로 보고(`keepSignedInOrFalse`) 14일짜리가 1일로 줄어든다.
  */
  jar.set(
    KEEP_SIGNED_IN_COOKIE,
    keepSignedIn ? "1" : "0",
    tokenCookieOptions(keepSignedIn ? REFRESH_TOKEN_MAX_AGE : undefined),
  );
}

/** 로그인한 사람의 토큰. 없으면 `null` — 부르는 쪽이 로그인 화면으로 보낸다. */
export async function getAccessToken(): Promise<string | null> {
  const jar = await cookies();
  return jar.get(ACCESS_TOKEN_COOKIE)?.value ?? null;
}

export async function clearSession(): Promise<void> {
  const jar = await cookies();
  jar.delete(ACCESS_TOKEN_COOKIE);
  jar.delete(REFRESH_TOKEN_COOKIE);
  jar.delete(KEEP_SIGNED_IN_COOKIE);
}

/**
 * 토큰이 있어야 하는 자리에서 꺼낸다 — 없으면 던진다.
 * ⚠️ 화면 가드가 아니라 **호출 직전의 마지막 확인**이다. 실제 인가는 BE가 한다(§권한).
 */
export async function requireAccessToken(): Promise<string> {
  const token = await getAccessToken();
  if (!token) throw new Error("로그인이 필요합니다.");
  return token;
}
