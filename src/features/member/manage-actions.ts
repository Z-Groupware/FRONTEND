"use server";

import { revalidatePath } from "next/cache";

import type { Authority } from "@/constants/authority";
import { POSITION_AUTHORITIES } from "@/constants/authority";
import { getViewer } from "@/features/shell/viewer";
import { todayIso } from "@/lib/date";
import { canApproveFinal, canChangeMemberGrade } from "@/lib/permission";
import { isMock } from "@/mocks/config";

import { isEmailTaken, validateAccount } from "./account-validate";
import type { AccountDraft, AccountErrors, MemberActionResult } from "./manage-types";
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
async function denyReason(
  can: (actor: Awaited<ReturnType<typeof getViewer>>) => boolean,
  forbidden: string,
): Promise<string | null> {
  try {
    return can(await getViewer()) ? null : forbidden;
  } catch {
    return NO_SESSION;
  }
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
  const denied = await denyReason(canChangeMemberGrade, "사원 정보를 바꿀 권한이 없습니다");
  if (denied) return { isSuccess: false, message: denied };

  if (!next.position.trim()) return { isSuccess: false, message: "직급을 입력해 주세요" };

  const allowed: readonly string[] = POSITION_AUTHORITIES;
  if (!allowed.includes(next.authority)) {
    return { isSuccess: false, message: "사원에게 줄 수 없는 권한입니다" };
  }

  if (!isMock) {
    // TODO(BE 협의): `PATCH /companies/me/members/{id}`
    return { isSuccess: false, message: NOT_CONNECTED };
  }

  updateMockMemberGrade(id, next);
  revalidatePath(pathOf(id));
  revalidatePath("/manage/members");
  return { isSuccess: true };
}

const NO_PENDING = "승인을 기다리는 신청이 없습니다";

/**
 * 최종 승인 — **OWNER 전용**(WORKFLOW §7, 2026-08-06 Admin 제외).
 * ⚠️ 신청이 실제로 있는지 서버가 다시 본다 — 화면이 보낸 id만 믿으면 이미 처리된 건을
 *    두 번 승인하게 된다.
 */
export async function approveHandoverAction(id: number): Promise<MemberActionResult> {
  const denied = await denyReason(canApproveFinal, "최종 승인은 대표만 할 수 있습니다");
  if (denied) return { isSuccess: false, message: denied };

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
  const denied = await denyReason(canApproveFinal, "반려는 대표만 할 수 있습니다");
  if (denied) return { isSuccess: false, message: denied };

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
  const denied = await denyReason(canChangeMemberGrade, "계정을 발급할 권한이 없습니다");
  if (denied) return { errors: {}, message: denied };

  // 화면과 **같은 함수**로 다시 본다 — 규칙이 두 벌이면 어긋난다
  const errors = validateAccount(draft);
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

  const issued = addMockManagedMember(draft, todayIso());
  revalidatePath("/manage/members");
  return { errors: {}, issued: { id: issued.id, name: issued.name, email: issued.email } };
}
