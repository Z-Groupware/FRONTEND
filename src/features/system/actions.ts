"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { COMPANY_STATUS } from "@/constants/domain";
import { isMock } from "@/mocks/config";

import { removeMockPendingApproval } from "./mock/approvals";
import { findMockCompany, setMockCompanyStatus } from "./mock/companies";

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

/**
 * "구독·매출" 미납 안내 발송 — 격리막(CLAUDE.md §Mock 격리막).
 *
 * ⚠️ **폼이 아니라 직접 호출한다.** 확인 Dialog에서 "예"를 누른 뒤 그 자리에서 toast로
 *    결과를 보여줘야 해서(CLAUDE.md §토스트: 변경 결과 피드백) `redirect`도 `revalidatePath`도
 *    필요 없다 — 화면·데이터 어느 것도 안 바뀌고 그냥 메일 한 통을 보내는 조작이다.
 * ⚠️ 지금은 목이라 **실제로 메일이 나가지 않는다** — 성공만 흉내 낸다(§정직성).
 */
export async function sendUnpaidNoticeAction(
  companyId: string,
): Promise<{ success: boolean; ownerEmail?: string }> {
  if (!isMock) {
    // ⚠️ 미구현 — API 스펙 확정 후 BFF 경로로 메일 발송 요청을 보낸다.
    throw new Error("안내 발송 API가 아직 연결되지 않았습니다.");
  }

  const company = findMockCompany(companyId);
  if (!company) return { success: false };

  return { success: true, ownerEmail: company.ownerEmail };
}
