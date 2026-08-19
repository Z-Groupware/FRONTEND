import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

import { cookies, headers } from "next/headers";

import { isSecureRequest, tokenCookieOptions } from "@/features/auth/cookie";

import { SYSTEM_SESSION_COOKIE, SYSTEM_SESSION_MAX_AGE } from "./cookie";

/**
 * 시스템 관리자 로그인 — 단일 계정, 아이디·비밀번호가 **env var**(`SYSTEM_ADMIN_ID` /
 * `SYSTEM_ADMIN_PASSWORD`)다. 운영자는 서비스 전체에 한 명뿐이라 DB 계정 없이 이걸로
 * 충분하다(팀 결정, 2026-08-19).
 *
 * ⚠️ 쿠키 값은 **서명한다**(HMAC-SHA256). "authenticated" 문자열만 그대로 구우면 그 문자열을
 *    아는 누구나 브라우저에서 쿠키를 직접 심어 들어올 수 있다 — 서명해야 시크릿(env var)을
 *    아는 서버만 만들 수 있는 값이 된다.
 * ⚠️ 서명 비밀키를 **따로 두지 않고 admin id·password로 만든다.** 로그인 비밀 자체가 이미
 *    같은 env var라, 세 번째 시크릿을 추가해도 배포 쪽 값만 하나 늘 뿐 안전성은 안 늘어난다.
 * ⚠️ `(system)/layout.tsx`에서만 쓴다. `proxy.ts`(Edge)는 이 파일을 import할 수 없다
 *    (`server-only`) — 값을 봐야 하는 가드는 레이아웃에서 한다는 규칙(`proxy.ts` 상단 주석)과
 *    같은 이유로, 애초에 `/system`은 `proxy.ts`의 보호 목록에서 뺐다.
 */

const SESSION_PAYLOAD = "system-admin";

function requireEnvCredentials(): { id: string; password: string } {
  const id = process.env.SYSTEM_ADMIN_ID;
  const password = process.env.SYSTEM_ADMIN_PASSWORD;
  if (!id || !password) {
    throw new Error("SYSTEM_ADMIN_ID / SYSTEM_ADMIN_PASSWORD 환경변수가 설정되어 있지 않습니다.");
  }
  return { id, password };
}

function sign(payload: string): string {
  const { id, password } = requireEnvCredentials();
  return createHmac("sha256", `${id}:${password}`).update(payload).digest("hex");
}

function isValidToken(token: string | undefined): boolean {
  if (!token) return false;
  const [payload, signature] = token.split(".");
  if (!payload || !signature || payload !== SESSION_PAYLOAD) return false;

  const expected = Buffer.from(sign(payload));
  const actual = Buffer.from(signature);
  // ⚠️ 길이가 다르면 timingSafeEqual이 던진다 — 비교 전에 길이부터 맞춰 본다
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

/** 입력값이 env var와 같은가 — 아이디·비밀번호 어느 쪽이 틀렸는지는 가르지 않는다(계정이 하나뿐이라 가를 것도 없다) */
export function verifySystemCredentials(adminId: string, password: string): boolean {
  const expected = requireEnvCredentials();
  return adminId === expected.id && password === expected.password;
}

export async function createSystemSession(): Promise<void> {
  const jar = await cookies();
  const isSecure = isSecureRequest((await headers()).get("x-forwarded-proto"));
  const token = `${SESSION_PAYLOAD}.${sign(SESSION_PAYLOAD)}`;
  jar.set(SYSTEM_SESSION_COOKIE, token, tokenCookieOptions(SYSTEM_SESSION_MAX_AGE, isSecure));
}

/** 유효한 시스템 세션이 있는가 — `(system)/layout.tsx`가 이 값으로 로그인 폼과 실제 화면을 가른다 */
export async function hasSystemSession(): Promise<boolean> {
  const jar = await cookies();
  return isValidToken(jar.get(SYSTEM_SESSION_COOKIE)?.value);
}

export async function clearSystemSession(): Promise<void> {
  const jar = await cookies();
  jar.delete(SYSTEM_SESSION_COOKIE);
}
