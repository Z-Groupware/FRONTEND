"use server";

import { revalidatePath } from "next/cache";

import type { Authority } from "@/constants/authority";
import { AUTHORITY, POSITION_AUTHORITIES } from "@/constants/authority";
import { getCompanySetting } from "@/features/company/server";
import { getViewer } from "@/features/shell/viewer";
import { todayIso } from "@/lib/date";
import {
  canApproveFinal,
  canChangeMemberGrade,
  canGrantAdmin,
  canIssueAccount,
} from "@/lib/permission";
import { isMock } from "@/mocks/config";

import { isEmailTaken, validateAccount } from "./account-validate";
import { getManagedMember, listManagedMembers } from "./manage-server";
import type {
  AccountDraft,
  AccountErrors,
  ManagedMember,
  MemberActionResult,
} from "./manage-types";
import {
  addMockManagedMember,
  approveMockHandover,
  findMockManagedMember,
  listMockMemberEmails,
  rejectMockHandover,
  updateMockMemberGrade,
} from "./mock/managed";

/**
 * 사원 관리의 **변경 작업**. 전부 서버에서 돈다(핵심 4원칙 ②).
 *
 * ⚠️ **권한이 두 겹으로 갈린다**(WORKFLOW §11). 화면에는 Admin도 들어오지만
 *    **승인·반려는 OWNER 전용**이다 — 화면 접근과 개별 액션의 권한이 다른 사례라,
 *    판정 함수도 둘이다(`canChangeMemberGrade` / `canApproveFinal`).
 * ⚠️ **던지지 않는다.** 저장 실패는 화면 전체 실패가 아니다 — 던지면 error boundary가
 *    화면을 갈아치워 방금 고른 값이 날아간다(§토스트: error.tsx는 페이지 전체 실패용).
 */

const NO_SESSION = "세션이 만료되었습니다. 다시 로그인해 주세요";
const NOT_CONNECTED = "아직 연결되지 않은 기능입니다";

function pathOf(id: number) {
  return `/manage/members/${id}`;
}

/**
 * 문지기 — 통과면 `null`, 막히면 이유 한 줄.
 * ⚠️ 세션 실패와 권한 거부를 **나눠 적는다** — 사용자가 할 수 있는 일이 다르다.
 */
type Viewer = Awaited<ReturnType<typeof getViewer>>;

async function gate(
  can: (actor: Viewer) => boolean,
  forbidden: string,
): Promise<{ viewer: Viewer } | { denied: string }> {
  let viewer: Viewer;
  try {
    viewer = await getViewer();
  } catch {
    return { denied: NO_SESSION };
  }
  return can(viewer) ? { viewer } : { denied: forbidden };
}

/**
 * 직급·권한·Admin 겸직 변경.
 *
 * ⚠️ 권한 값을 **화이트리스트로 본다.** 화면 셀렉트는 Leader·Member만 주지만 Server Action은
 *    주소만 알면 직접 부를 수 있다(§권한: 화면 숨김은 보안이 아니다) — 없으면 아무나
 *    자기 계정을 OWNER로 올릴 수 있다.
 * ⚠️ **Owner에게는 Admin을 켜지 않는다**(`canGrantAdmin`). 이미 다 되는 사람에게 겸직을
 *    붙이면 "Admin을 빼면 권한이 줄어든다"는 오해가 생긴다.
 */
export async function changeMemberGradeAction(
  id: number,
  next: { position: string; authority: Authority; isAdmin: boolean },
): Promise<MemberActionResult> {
  const pass = await gate(canChangeMemberGrade, "사원 정보를 바꿀 권한이 없습니다");
  if ("denied" in pass) return { isSuccess: false, message: pass.denied };

  /*
    ⚠️ **자기 계정은 못 바꾼다.** 권한은 위에서 아래로만 흐른다 — Admin 겸직자가 자기를
       Leader로 올리면 대표가 준 적 없는 화면(팀 관리·중간 승인)이 열리고, 기록상으로는
       "관리자가 승인했다"와 구분되지 않는다.
  */
  if (pass.viewer.id === id) {
    return { isSuccess: false, message: "자기 계정의 권한은 바꿀 수 없습니다" };
  }

  if (!next.position.trim()) return { isSuccess: false, message: "직급을 입력해 주세요" };

  const allowed: readonly string[] = POSITION_AUTHORITIES;
  if (!allowed.includes(next.authority)) {
    return { isSuccess: false, message: "사원에게 줄 수 없는 권한입니다" };
  }

  /*
    ⚠️ **대상이 누구인지 서버가 본다.** 화면은 Owner면 폼을 안 그리지만 액션은 주소만 알면
       부를 수 있다 — 없으면 회사에 하나뿐인 대표를 Member로 끌어내릴 수 있고, `OWNER`는
       화이트리스트에 없어 **되돌릴 수도 없다**(일방통행 파괴).
  */
  const target = await getManagedMember(id);
  if (!target) return { isSuccess: false, message: "없는 사원입니다" };
  if (!canGrantAdmin({ role: target.member.authority })) {
    return { isSuccess: false, message: "대표 계정은 이 화면에서 바꿀 수 없습니다" };
  }

  /*
    ⚠️ **팀에 리더는 한 명이다**(CLAUDE.md §권한 · DECISIONS). 둘이 되면 같은 팀원의
       인수인계를 두 사람이 중간 승인할 수 있고, 하나뿐인 리더를 내리면 그 팀의 중간 승인
       라인이 조용히 사라진다(WORKFLOW §7). 기업 설정도 같은 규칙을 지킨다.
  */
  const clash = await findTeamLeaderClash(target.member, next.authority);
  if (clash) return { isSuccess: false, message: clash };

  if (!isMock) {
    // TODO(BE 협의): `PATCH /companies/me/members/{id}`
    return { isSuccess: false, message: NOT_CONNECTED };
  }

  updateMockMemberGrade(id, next);
  revalidatePath(pathOf(id));
  revalidatePath("/manage/members");
  return { isSuccess: true };
}

/**
 * 팀당 리더 한 명 규칙에 걸리는지 — 걸리면 이유 한 줄.
 *
 * ⚠️ 올릴 때는 **그 팀에 이미 리더가 있나**, 내릴 때는 **그 팀의 마지막 리더인가**를 본다.
 *    한쪽만 막으면 리더가 둘이 되거나 아예 없어진다.
 * ⚠️ 팀이 없는 사람(Owner)은 해당 없다 — 여기 오기 전에 이미 걸러진다.
 */
async function findTeamLeaderClash(
  target: ManagedMember,
  nextAuthority: Authority,
): Promise<string | null> {
  const team = target.teamName;
  if (!team) return null;

  const wasLeader = target.authority === AUTHORITY.LEADER;
  const willBeLeader = nextAuthority === AUTHORITY.LEADER;
  if (wasLeader === willBeLeader) return null;

  const members = await listManagedMembers();
  const leaders = members.filter(
    (member) =>
      member.teamName === team && member.authority === AUTHORITY.LEADER && member.id !== target.id,
  );

  const existing = leaders[0];
  if (willBeLeader && existing) {
    return `${team}에는 이미 팀장(${existing.name})이 있습니다. 먼저 그 사람의 권한을 바꿔 주세요`;
  }
  if (!willBeLeader && leaders.length === 0) {
    return `${team}의 유일한 팀장입니다. 후임을 먼저 정해 주세요`;
  }
  return null;
}

const NO_PENDING = "승인을 기다리는 신청이 없습니다";

/**
 * 최종 승인 — **OWNER 전용**(WORKFLOW §7, 2026-08-06 Admin 제외).
 * ⚠️ 신청이 실제로 있는지 서버가 다시 본다 — 화면이 보낸 id만 믿으면 이미 처리된 건을
 *    두 번 승인하게 된다.
 */
export async function approveHandoverAction(id: number): Promise<MemberActionResult> {
  const pass = await gate(canApproveFinal, "최종 승인은 대표만 할 수 있습니다");
  if ("denied" in pass) return { isSuccess: false, message: pass.denied };

  if (!isMock) {
    // TODO(BE 협의): `POST /companies/me/members/{id}/handover/approve`
    return { isSuccess: false, message: NOT_CONNECTED };
  }

  if (!findMockManagedMember(id)?.pendingHandover) {
    return { isSuccess: false, message: NO_PENDING };
  }

  approveMockHandover(id);
  revalidatePath(pathOf(id));
  revalidatePath("/manage/members");
  return { isSuccess: true };
}

/**
 * 반려 — **사유가 있어야 한다.**
 * ⚠️ 사유 없이 되돌리면 신청한 사람은 무엇을 고쳐 다시 내야 하는지 알 수 없다.
 *    화면에서도 빈 사유로는 버튼이 안 열리지만, 액션은 직접 부를 수 있어 여기서 다시 본다.
 */
export async function rejectHandoverAction(
  id: number,
  reason: string,
): Promise<MemberActionResult> {
  const pass = await gate(canApproveFinal, "반려는 대표만 할 수 있습니다");
  if ("denied" in pass) return { isSuccess: false, message: pass.denied };

  if (!reason.trim()) return { isSuccess: false, message: "반려 사유를 입력해 주세요" };

  if (!isMock) {
    // TODO(BE 협의): `POST /companies/me/members/{id}/handover/reject`
    return { isSuccess: false, message: NOT_CONNECTED };
  }

  if (!findMockManagedMember(id)?.pendingHandover) {
    return { isSuccess: false, message: NO_PENDING };
  }

  rejectMockHandover(id);
  revalidatePath(pathOf(id));
  revalidatePath("/manage/members");
  return { isSuccess: true };
}

/** 계정 발급 결과 — 성공하면 만들어진 사람의 id를 돌려준다(화면이 결과 창을 띄운다) */
export interface IssueAccountResult {
  errors: AccountErrors;
  /** 칸과 무관한 실패 한 줄(권한 없음·미연동 등) */
  message?: string;
  issued?: { id: number; name: string; email: string };
}

/**
 * 계정 발급 — **Owner·Admin 겸직자 둘 다**(WORKFLOW §11, 2026-08-06 Owner도 가능).
 *
 * ⚠️ 화면 접근 권한과 **같은 문**이라 별도 판정 함수를 두지 않는다(`canIssueAccount`는
 *    `canManageMembers`의 다른 이름이다).
 * ⚠️ 비밀번호를 만들지 않는다 — 아이디와 첫 비밀번호는 **메일로 나간다**. 화면이 정하면
 *    그 값을 누군가 알고 있게 된다.
 * ⚠️ 입사일은 **여기서 찍는다**. 화면에서 `new Date()`를 부르면 서버 렌더와 갈린다.
 */
export async function issueAccountAction(draft: AccountDraft): Promise<IssueAccountResult> {
  // ⚠️ 발급 전용 판정을 쓴다 — `canChangeMemberGrade`와 지금 결과가 같아도 정책이 갈릴 수 있다
  const pass = await gate(canIssueAccount, "계정을 발급할 권한이 없습니다");
  if ("denied" in pass) return { errors: {}, message: pass.denied };

  /*
    화면과 **같은 함수**로 다시 본다 — 규칙이 두 벌이면 어긋난다.
    ⚠️ 직급 목록을 **여기서 구해 넘긴다.** 화면이 보낸 값을 그대로 믿으면 회사에 없는
       직급으로도 발급된다(§권한: 화면 숨김은 보안이 아니다).
  */
  const company = await getCompanySetting();
  const errors = validateAccount(
    draft,
    company.positions.map((position) => position.name),
  );
  if (Object.keys(errors).length > 0) return { errors };

  if (!isMock) {
    // TODO(BE 협의): `POST /companies/me/members`
    return { errors: {}, message: NOT_CONNECTED };
  }

  /*
    ⚠️ 중복은 **서버가 본다.** 화면이 목록을 들고 있어도 그 사이에 다른 관리자가 같은 주소로
       발급했을 수 있다 — 두 계정에 같은 메일이 붙으면 첫 비밀번호가 어디로 갈지 알 수 없다.
  */
  if (isEmailTaken(draft.email, listMockMemberEmails())) {
    return { errors: { email: "이미 쓰고 있는 이메일입니다" } };
  }

  // ⚠️ 발급으로도 리더가 둘이 되면 안 된다 — 직급 변경과 같은 규칙이다
  const clash = await findTeamLeaderClash(
    { teamName: draft.teamName, authority: AUTHORITY.MEMBER, id: -1 } as ManagedMember,
    draft.authority,
  );
  if (clash) return { errors: { authority: clash } };

  const issued = addMockManagedMember(draft, todayIso());
  revalidatePath("/manage/members");
  return { errors: {}, issued: { id: issued.id, name: issued.name, email: issued.email } };
}
