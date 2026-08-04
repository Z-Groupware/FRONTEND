"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { COMPANY_STATUS } from "@/constants/domain";
import { isMock } from "@/mocks/config";

import { removeMockPendingApproval } from "./mock/approvals";
import { findMockCompany, setMockCompanyStatus } from "./mock/companies";
import { findMockFailedItem } from "./mock/monitoring";

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
 * ⚠️ **폼이 아니라 직접 호출한다.** "안내 발송" 버튼을 누르면 바로 이 액션을 실행하고,
 *    끝나면 결과를 `SuccessDialog`로 보여준다(`owner/billing/checkout`의 결제 흐름과 같은
 *    패턴 — 확인 Dialog 없이 액션 → 완료 안내). `redirect`도 `revalidatePath`도 필요 없다 —
 *    화면·데이터 어느 것도 안 바뀌고 그냥 메일 한 통을 보내는 조작이다.
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

/**
 * "시스템 모니터링" 실패 건 재처리 — 격리막(CLAUDE.md §Mock 격리막).
 *
 * ⚠️ **폼이 아니라 직접 호출한다.** 실패 행의 "재처리" 버튼을 누르면 이 액션을 실행하고
 *    결과를 그 자리에서 "완료"로 바꿔 보여준다(구독·매출 "안내 발송"과 같은 패턴).
 *    `redirect`도 `revalidatePath`도 필요 없다 — 잡 하나를 큐에 다시 넣을 뿐이다.
 * ⚠️ 지금은 목이라 **실제로 재처리가 돌지 않는다** — 성공만 흉내 낸다(§정직성).
 */
export async function retryPipelineAction(meetingId: string): Promise<{ success: boolean }> {
  if (!isMock) {
    // ⚠️ 미구현 — API 스펙 확정 후 BFF 경로로 파이프라인 재처리 요청을 보낸다.
    throw new Error("파이프라인 재처리 API가 아직 연결되지 않았습니다.");
  }

  return { success: findMockFailedItem(meetingId) !== null };
}
