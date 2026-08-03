"use client";

import { useRouter } from "next/navigation";
import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { COMPANY_SIZE_LABEL } from "@/constants/domain";

import { approveCompanyAction, rejectCompanyAction } from "../actions";
import type { PendingCompanyApproval } from "../types";

interface ApprovalDetailSheetProps {
  company: PendingCompanyApproval | null;
  /** 닫히면 돌아갈 곳 — 지금 보던 페이지 그대로(쿼리의 `id`만 없어진 형태) */
  closeHref: string;
}

/**
 * "기업 승인" 행을 누르면 뜨는 상세 패널.
 * ⚠️ `company`가 `null`이어도 항상 렌더링한다 — Sheet가 닫히는 애니메이션 동안
 *    내용이 먼저 사라지면 어색하다. 열림 여부는 `open` prop 하나로만 정한다.
 */
export function ApprovalDetailSheet({ company, closeHref }: ApprovalDetailSheetProps) {
  const router = useRouter();

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
              <SheetTitle>신청 상세</SheetTitle>
            </SheetHeader>

            <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-4">
              <Field label="회사명" value={company.companyName} />
              <Field label="사업자등록번호" value={company.businessRegistrationNumber} />
              <Field label="대표자" value={company.representativeName} />
              <Field label="담당자 이메일" value={company.contactEmail} />
              <Field label="직원 규모" value={COMPANY_SIZE_LABEL[company.size]} />
              <Field label="신청일" value={company.appliedAt} />

              <p className="text-muted-foreground bg-muted rounded-md p-3 text-xs leading-[18px]">
                승인 시 기업 코드가 자동 발급되고 담당자 이메일로 발송됩니다.
              </p>
            </div>

            <SheetFooter className="flex-row">
              <form action={rejectCompanyAction} className="flex-1">
                <input type="hidden" name="companyId" value={company.id} />
                <input type="hidden" name="redirectTo" value={closeHref} />
                <SubmitButton variant="destructive" label="반려" pendingLabel="반려 중…" />
              </form>
              <form action={approveCompanyAction} className="flex-1">
                <input type="hidden" name="companyId" value={company.id} />
                <input type="hidden" name="redirectTo" value={closeHref} />
                <SubmitButton variant="default" label="승인" pendingLabel="승인 중…" />
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

function SubmitButton({
  variant,
  label,
  pendingLabel,
}: {
  variant: "default" | "destructive";
  label: string;
  pendingLabel: string;
}) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" variant={variant} disabled={pending} className="w-full">
      {pending ? pendingLabel : label}
    </Button>
  );
}
