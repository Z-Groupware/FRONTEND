"use server";

import { redirect } from "next/navigation";

import { isMock } from "@/mocks/config";

import { removeMockPendingApproval } from "./mock/approvals";

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
