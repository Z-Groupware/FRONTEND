import { type NextRequest, NextResponse } from "next/server";

/**
 * 라우트 보호 — **로그인 안 한 사람을 로그인 뒤 화면에 들이지 않는다.**
 *
 * ⚠️ 파일명이 `proxy.ts`다. Next 16에서 `middleware.ts`가 이 이름으로 바뀌었다 —
 *    옛 이름으로 두면 뜰 때마다 deprecated 경고가 나온다.
 *
 * ⚠️ **여기서 하는 건 문지기 한 줄뿐이다.** 세션 쿠키가 있는지만 본다 —
 *    그 토큰이 진짜인지, 그 사람이 이 화면을 볼 권한이 있는지는 **서버 컴포넌트와
 *    Server Action이 다시 본다**(CLAUDE.md §권한: 화면 숨김은 보안이 아니다).
 * ⚠️ **여기서 BE를 부르지 않는다.** 모든 이동마다 왕복이 한 번 더 붙어 화면이
 *    그만큼 늦게 뜬다. 온보딩·구독 판정처럼 **값을 봐야 하는 가드는 레이아웃**에서 한다
 *    (`(shell)/layout.tsx` · 온보딩 각 단계의 `guardOnboardingStep`).
 * ⚠️ 목으로 돌 때는 아무것도 막지 않는다 — 로그인시킬 서버가 없는데 막으면
 *    화면 확인이 통째로 불가능해진다.
 */

/** 쿠키 이름은 `features/auth/session.ts`가 정한다 — 미들웨어는 Edge라 그 파일을 못 읽는다(`server-only`). */
const ACCESS_TOKEN = "z_access_token";

/** 로그인해야 들어갈 수 있는 자리. 괄호 라우트 그룹은 URL에 안 붙으므로 실제 주소로 적는다. */
const PROTECTED_PREFIXES = [
  "/owner",
  "/team",
  "/my",
  "/manage",
  "/app",
  "/onboarding",
  "/subscription",
  "/system",
];

const isMock = process.env.NEXT_PUBLIC_USE_MOCK !== "false";

export default function proxy(request: NextRequest) {
  if (isMock) return NextResponse.next();

  const { pathname } = request.nextUrl;
  const hasSession = request.cookies.has(ACCESS_TOKEN);

  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  if (isProtected && !hasSession) {
    /*
      ⚠️ 원래 가려던 곳(`next`)을 담지 않는다. 로그인 뒤 갈 곳은 **서버가 정하고**
         (`landingPath`), 그 값이 온보딩 여부·권한까지 반영한다 — `next`를 얹으면
         온보딩을 안 끝낸 사람이 대시보드로 튀어 가드에 다시 걸린다.
         돌아갈 링크가 필요해지면 그때 `landingPath`와 어느 쪽이 이기는지부터 정한다.
    */
    return NextResponse.redirect(new URL("/login", request.url));
  }

  /*
    ⚠️ **이미 로그인한 사람을 여기서 로그인 화면 밖으로 밀지 않는다.** 미들웨어가 아는 건
       "쿠키가 있다"뿐인데, 그 토큰은 만료됐을 수 있다 — 그러면 로그인하러 온 사람을
       홈으로 밀고, 홈은 다시 로그인 화면을 권하는 고리가 생긴다.
       **토큰이 살아 있는지는 `/api/auth/me`를 부르는 쪽만 안다** — 그 판정은
       로그인 페이지·랜딩 페이지가 서버에서 직접 한다(`redirectIfSignedIn`).
  */
  return NextResponse.next();
}

export const config = {
  /** 정적 파일·이미지·API 라우트는 문지기를 거치지 않는다 — 매 요청마다 도는 코드다 */
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.svg$).*)"],
};
