import "server-only";

import { cookies } from "next/headers";

/**
 * 세션 — **httpOnly 쿠키 한 곳**(CLAUDE.md §렌더링·데이터: `localStorage` 토큰 금지).
 *
 * BE는 토큰을 본문으로 내리고 쿠키를 굽지 않는다(`TokenResponse.java` 주석) — 굽는 건 여기다.
 * 그래서 도메인·SameSite·수명을 **이 파일 하나**가 정한다.
 *
 * ⚠️ 액세스 토큰 수명은 30분(BE)이지만 쿠키 수명은 그보다 길게 둔다. 쿠키가 먼저 사라지면
 *    갱신표가 살아 있는데도 다시 로그인해야 한다 — 만료 판정은 BE의 401이 한다.
 * ⚠️ `keepSignedIn`이 꺼져 있으면 **세션 쿠키**(수명 없음)로 굽는다. 브라우저를 닫으면 사라진다 —
 *    공용 PC에서 체크를 끄는 사람이 기대하는 동작이다.
 */

const ACCESS_TOKEN = "z_access_token";
const REFRESH_TOKEN = "z_refresh_token";

/** 로그인 상태 유지에 쓸 쿠키 수명 — 14일. */
const KEEP_SIGNED_IN_MAX_AGE = 60 * 60 * 24 * 14;

export interface SessionTokens {
  accessToken: string;
  refreshToken: string;
}

export async function setSession(tokens: SessionTokens, keepSignedIn: boolean): Promise<void> {
  const jar = await cookies();
  const options = {
    httpOnly: true,
    sameSite: "lax" as const,
    // 개발은 http라 `secure`를 켜면 쿠키가 아예 안 굽힌다
    secure: process.env.NODE_ENV === "production",
    path: "/",
    ...(keepSignedIn ? { maxAge: KEEP_SIGNED_IN_MAX_AGE } : {}),
  };

  jar.set(ACCESS_TOKEN, tokens.accessToken, options);
  jar.set(REFRESH_TOKEN, tokens.refreshToken, options);
}

/** 로그인한 사람의 토큰. 없으면 `null` — 부르는 쪽이 로그인 화면으로 보낸다. */
export async function getAccessToken(): Promise<string | null> {
  const jar = await cookies();
  return jar.get(ACCESS_TOKEN)?.value ?? null;
}

export async function getRefreshToken(): Promise<string | null> {
  const jar = await cookies();
  return jar.get(REFRESH_TOKEN)?.value ?? null;
}

export async function clearSession(): Promise<void> {
  const jar = await cookies();
  jar.delete(ACCESS_TOKEN);
  jar.delete(REFRESH_TOKEN);
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
