import { ROLE, type Role } from "@/constants/role";

/**
 * 지금 보고 있는 사람 — **세션이 붙기 전까지 이 파일 하나가 목이다.**
 *
 * ⚠️ 화면마다 `role: ROLE.OWNER`를 적어 두면, 로그인이 붙었을 때 고칠 자리를 다 찾아야 한다.
 *    셸·결제·완료 창이 전부 여기서 읽는다(Mock → Live 격리막).
 * ⚠️ 실연동 때는 **httpOnly 쿠키의 세션**을 읽는다 — 브라우저가 아니라 서버에서 판정한다
 *    (CLAUDE.md §권한: 화면 숨김은 UX일 뿐 보안이 아니다).
 */
export interface Viewer {
  name: string;
  role: Role;
  /** Admin 겸직 — 역할이 아니라 사람에게 붙는 부가 권한이라 `role`과 따로 본다(#59) */
  isAdmin: boolean;
}

const isMock = true;

export async function getViewer(): Promise<Viewer> {
  if (isMock) {
    return { name: "대표 계정", role: ROLE.OWNER, isAdmin: false };
  }

  // TODO(BE 협의): 쿠키의 세션으로 `GET /me` → { name, role, isAdmin }
  throw new Error("세션을 읽을 수 없습니다");
}

/**
 * 구독·결제를 만질 수 있는 사람인가 — **대표이거나 Admin을 겸한 사람**(DECISIONS §(shared)).
 *
 * ⚠️ 이 판정으로 화면을 감추는 건 UX다. **서버에서 반드시 다시 검사한다.**
 */
export function canManageBilling(viewer: Viewer): boolean {
  return viewer.role === ROLE.OWNER || viewer.isAdmin;
}
