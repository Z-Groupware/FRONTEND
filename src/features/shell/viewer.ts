import { ROLE } from "@/constants/role";
import type { Actor } from "@/lib/permission";
import { isMock } from "@/mocks/config";

/**
 * 지금 보고 있는 사람 — **세션이 붙기 전까지 이 파일 하나가 목이다.**
 *
 * ⚠️ 화면마다 `role: ROLE.OWNER`를 적어 두면, 로그인이 붙었을 때 고칠 자리를 다 찾아야 한다.
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
    return { id: 1, name: "대표 계정", role: ROLE.OWNER, isAdmin: false };
  }

  // TODO(BE 협의): 쿠키의 세션으로 `GET /me` → { id, name, role, isAdmin, departmentId }
  throw new Error("세션을 읽을 수 없습니다");
}
