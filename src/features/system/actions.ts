"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { COMPANY_STATUS } from "@/constants/domain";
import { isMock } from "@/mocks/config";

import { removeMockPendingApproval } from "./mock/approvals";
import { setMockCompanyStatus } from "./mock/companies";

/**
 * 기업 승인 화면의 **변경 창구** — 격리막(CLAUDE.md §Mock 격리막).
 * ⚠️ 지금은 목뿐이다 — 승인·반려 둘 다 대기 목록에서 지우기만 한다(실제 기업 코드 발급·메일
 *    발송·"기업 관리" 반영은 API가 붙어야 의미가 있다).
 */
export async function approveCompanyAction(formData: FormData): Promise<void> {
  const id = String(formData.get("companyId") ?? "");
  const redirectTo = String(formData.get("redirectTo") ?? "/system/approval");

  if (isMock) {
    removeMockPendingApproval(id);
  } else {
    // ⚠️ 미구현 — API 스펙 확정 후 BFF 경로로 승인 요청을 보낸다.
    throw new Error("기업 승인 API가 아직 연결되지 않았습니다.");
  }

  // ⚠️ `redirect`는 내부적으로 예외를 던진다 — try/catch 밖에 둔다(CLAUDE.md §렌더링·데이터)
  redirect(redirectTo);
}

export async function rejectCompanyAction(formData: FormData): Promise<void> {
  const id = String(formData.get("companyId") ?? "");
  const redirectTo = String(formData.get("redirectTo") ?? "/system/approval");

  if (isMock) {
    removeMockPendingApproval(id);
  } else {
    throw new Error("기업 반려 API가 아직 연결되지 않았습니다.");
  }

  redirect(redirectTo);
}

/**
 * "기업 관리" 상세 패널의 정지·정지 해제 — 격리막(CLAUDE.md §Mock 격리막).
 * ⚠️ `redirect` 없이 **같은 화면에 머문다** — 승인/반려와 달리 상세를 계속 보는 흐름이라
 *    `revalidatePath`로 목록·상세를 새로고침한다(CLAUDE.md §핵심 4원칙 ②).
 */
export async function suspendCompanyAction(formData: FormData): Promise<void> {
  const id = String(formData.get("companyId") ?? "");
  const path = String(formData.get("path") ?? "/system/companies");

  if (isMock) {
    setMockCompanyStatus(id, COMPANY_STATUS.SUSPENDED);
  } else {
    // ⚠️ 미구현 — API 스펙 확정 후 BFF 경로로 정지 요청을 보낸다.
    throw new Error("기업 정지 API가 아직 연결되지 않았습니다.");
  }

  revalidatePath(path);
}

export async function unsuspendCompanyAction(formData: FormData): Promise<void> {
  const id = String(formData.get("companyId") ?? "");
  const path = String(formData.get("path") ?? "/system/companies");

  if (isMock) {
    setMockCompanyStatus(id, COMPANY_STATUS.ACTIVE);
  } else {
    throw new Error("기업 정지 해제 API가 아직 연결되지 않았습니다.");
  }

  revalidatePath(path);
}
