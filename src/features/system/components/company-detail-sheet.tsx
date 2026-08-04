"use client";

import { useRouter } from "next/navigation";
import { useFormStatus } from "react-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { COMPANY_STATUS, COMPANY_STATUS_LABEL } from "@/constants/domain";

import { suspendCompanyAction, unsuspendCompanyAction } from "../actions";
import type { ManagedCompany } from "../types";

interface CompanyDetailSheetProps {
  company: ManagedCompany | null;
  /** 닫히면 돌아갈 곳 — 지금 보던 페이지 그대로(쿼리의 `id`만 없어진 형태) */
  closeHref: string;
  /** Server Action이 끝난 뒤 새로고침할 경로 — `revalidatePath`에 넘긴다 */
  currentPath: string;
}

/**
 * "기업 관리" 행을 누르면 뜨는 상세 패널.
 *
 * ⚠️ 승인 화면(`approval-detail-sheet.tsx`)과 달리 **끝나도 화면을 안 떠난다** —
 *    정지는 그 자리에서 상태만 바꾸는 조작이라 `redirect` 대신 `revalidatePath`를 쓴다.
 * ⚠️ `company`가 `null`이어도 항상 렌더링한다 — Sheet가 닫히는 애니메이션 동안
 *    내용이 먼저 사라지면 어색하다. 열림 여부는 `open` prop 하나로만 정한다.
 */
export function CompanyDetailSheet({ company, closeHref, currentPath }: CompanyDetailSheetProps) {
  const router = useRouter();
  const isSuspended = company?.status === COMPANY_STATUS.SUSPENDED;

  return (
    <Sheet
      open={company !== null}
      onOpenChange={(open) => {
        if (!open) router.push(closeHref);
      }}
    >
      <SheetContent>
        {company && (
          <>
            <SheetHeader>
              <SheetTitle>{company.name}</SheetTitle>
            </SheetHeader>

            <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-4">
              <Field label="기업 코드" value={company.code} />
              <Field label="가입일" value={company.joinedAt} />
              <Field label="구성원 수" value={`${company.memberCount}명`} />
              <Field label="이번 달 회의" value={`${company.meetingCountThisMonth}회`} />

              <div className="flex flex-col gap-0.5">
                <p className="text-muted-foreground text-xs leading-4">상태</p>
                <Badge variant={isSuspended ? "destructive" : "default"} className="w-fit">
                  {COMPANY_STATUS_LABEL[company.status]}
                </Badge>
              </div>

              <Field label="오너 이메일" value={company.ownerEmail} />
            </div>

            <SheetFooter>
              <form
                action={isSuspended ? unsuspendCompanyAction : suspendCompanyAction}
                className="w-full"
              >
                <input type="hidden" name="companyId" value={company.id} />
                <input type="hidden" name="path" value={currentPath} />
                <SubmitButton isSuspended={isSuspended} />
              </form>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <p className="text-muted-foreground text-xs leading-4">{label}</p>
      <p className="text-foreground text-sm leading-5">{value}</p>
    </div>
  );
}

function SubmitButton({ isSuspended }: { isSuspended: boolean }) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      variant={isSuspended ? "default" : "destructive"}
      disabled={pending}
      className="w-full"
    >
      {pending ? "처리 중…" : isSuspended ? "정지 해제" : "정지"}
    </Button>
  );
}
