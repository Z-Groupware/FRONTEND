import { AUTHORITY } from "@/constants/authority";
import { getMe } from "@/features/auth/me";
import type { Actor } from "@/lib/permission";
import { isMock } from "@/mocks/config";

/**
 * 지금 보고 있는 사람 — **세션이 붙기 전까지 이 파일 하나가 목이다.**
 *
 * ⚠️ 화면마다 `role: AUTHORITY.OWNER`를 적어 두면, 로그인이 붙었을 때 고칠 자리를 다 찾아야 한다.
 *    셸·결제·완료 창이 전부 여기서 읽는다(Mock → Live 격리막).
 * ⚠️ 실연동 때는 **httpOnly 쿠키의 세션**을 읽는다 — 브라우저가 아니라 서버에서 판정한다
 *    (CLAUDE.md §권한: 화면 숨김은 UX일 뿐 보안이 아니다).
 * ⚠️ **판정은 여기 없다.** 누가 무엇을 할 수 있는지는 `lib/permission.ts` 한 곳이 정한다 —
 *    이 파일은 "지금 보고 있는 사람이 누구인가"만 답한다.
 */
/*
  ⚠️ `Actor`를 그대로 확장한다. 권한 판정(`lib/permission.ts`)이 받는 모양과 어긋나면
     화면마다 `{ id, role, isAdmin }`을 손으로 다시 만들게 되고, 그러다 한 곳을 빠뜨린다.
*/
export interface Viewer extends Actor {
  name: string;
}

export async function getViewer(): Promise<Viewer> {
  if (isMock) {
    return { id: 1, name: "대표 계정", role: AUTHORITY.OWNER, isAdmin: false };
  }

  /*
    ⚠️ **여기서 던지는 건 의도한 것이다.** 누군지 모르는 채로 그린 사이드바는 메뉴도 권한도
       틀린 화면이라, 조용히 빈 값으로 넘기면 더 나쁘다(셸 레이아웃 주석과 같은 판단).
       로그인 안 한 사람은 `middleware.ts`가 이 앞에서 막으므로 여기까지 오지 않는다.
    ⚠️ `teamId`·`teamName`은 **온보딩 전 오너에게 없다** — `null`을 `undefined`로 옮긴다.
       `Actor`는 "없음"을 `undefined`로 적기 때문에, `null`을 그대로 넣으면
       `isWithinTeamScope`가 `null === null`로 **팀이 같다고 판정**한다.
  */
  const me = await getMe();
  if (!me) throw new Error("세션을 읽을 수 없습니다");

  return {
    id: me.id,
    name: me.name,
    role: me.authority,
    isAdmin: me.isAdmin,
    teamId: me.teamId ?? undefined,
    teamName: me.teamName ?? undefined,
  };
}
