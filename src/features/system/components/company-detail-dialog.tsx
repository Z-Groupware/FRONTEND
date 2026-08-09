"use client";

import { Building2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { COMPANY_STATUS, COMPANY_STATUS_LABEL } from "@/constants/domain";
import { formatDate } from "@/lib/date";

import { suspendCompanyAction, unsuspendCompanyAction } from "../actions";
import type { ManagedCompany } from "../types";
import { StatusBadge, type StatusTone } from "./status-badge";

interface CompanyDetailDialogProps {
  company: ManagedCompany | null;
  /** 닫히면 돌아갈 곳 — 지금 보던 페이지 그대로(쿼리의 `id`만 없어진 형태) */
  closeHref: string;
  /** Server Action이 끝난 뒤 새로고침할 경로 — `revalidatePath`에 넘긴다 */
  currentPath: string;
}

const STATUS_TONE: Record<ManagedCompany["status"], StatusTone> = {
  ACTIVE: "positive",
  SUSPENDED: "negative",
  UNPAID: "warning",
};

/**
 * "기업 관리" 행을 누르면 뜨는 상세.
 *
 * ⚠️ **옆에서 밀려나오는 시트가 아니라 가운데 모달이다**(2026-08-10 변경). 담는 값이
 *    여섯 줄뿐이라 화면 높이를 다 쓰는 시트에서는 아래가 통째로 비었다 — 내용만큼만
 *    차지하는 모달이 맞다.
 * ⚠️ 값 줄은 **승인 상세와 같은 모양**이다(라벨 왼쪽·값 오른쪽·줄 사이 선). 같은 성격의
 *    화면이 둘인데 모양이 다르면 옮겨 다닐 때마다 다시 읽어야 한다.
 * ⚠️ **끝나면 모달을 닫는다.** 열어 두면 방금 정지한 것을 그 자리에서 바로 해제할 수 있어
 *    (정지 ↔ 해제를 무한히 오갈 수 있었다) 확인창을 거친 의미가 옅어진다 — 승인·반려도
 *    끝나면 목록으로 돌아간다. 바뀐 상태는 목록에서 보고, 결과는 토스트가 알린다.
 *    ⚠️ 실패했을 때는 **안 닫는다** — 무엇이 안 됐는지 확인할 자리가 없어진다.
 * ⚠️ 목록 새로고침은 `revalidatePath`가 한다(액션 안에서) — 승인처럼 다른 화면으로
 *    보내는 게 아니라 같은 목록으로 돌아오는 것이라 `redirect`를 쓰지 않는다.
 * ⚠️ `company`가 `null`이어도 항상 렌더링한다 — 닫히는 애니메이션 동안 내용이 먼저
 *    사라지면 어색하다. 열림 여부는 `open` prop 하나로만 정한다.
 * ⚠️ **정지는 묻고 나서 한다.** 그 회사 사람 전원이 워크스페이스에 못 들어오는 조작이라
 *    확인 없이 실행하지 않는다(CLAUDE.md §렌더링·데이터). 결과는 토스트로 알린다.
 * ⚠️ 실행 버튼은 **먹색(`ink`)**이다. `default`는 파랑(`--primary`)인데 이 제품은 파랑을
 *    강조색으로 안 쓴다(CLAUDE.md §디자인 토큰: 색으로 알리는 건 에러(빨강)뿐) —
 *    승인 화면의 `승인` 버튼과 같은 색이어야 한다.
 * ⚠️ 다만 **공용 `ConfirmDialog`를 겹쳐 띄우지 않는다.** 이미 모달인 화면 위에 또 모달이
 *    뜨면 카드가 두 겹이 되고 닫기 버튼도 두 개가 된다 — 보기 나쁘고 어느 것을 닫는지도
 *    헷갈린다. **같은 모달 안에서 단계만 바꾼다**(값 → 질문). 묻는 일은 그대로 한다.
 *    `ConfirmDialog`는 부모가 모달이 아닌 곳(공지 발행·승인 상세)에서 계속 쓴다.
 */
export function CompanyDetailDialog({ company, closeHref, currentPath }: CompanyDetailDialogProps) {
  const router = useRouter();
  const [isConfirming, setIsConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();
  const isSuspended = company?.status === COMPANY_STATUS.SUSPENDED;

  function handleConfirm() {
    if (!company) return;

    const formData = new FormData();
    formData.set("companyId", company.id);
    formData.set("path", currentPath);

    startTransition(async () => {
      let success = true;

      try {
        await (isSuspended ? unsuspendCompanyAction(formData) : suspendCompanyAction(formData));
      } catch {
        // 미구현(!isMock) 분기가 던지는 에러가 여기로 온다 — 조용히 삼키지 않는다
        success = false;
      }

      setIsConfirming(false);

      if (success) {
        toast.success(isSuspended ? "정지를 해제했습니다" : "기업을 정지했습니다");
        // 끝났으면 닫는다 — 바뀐 상태는 목록에서 본다
        router.push(closeHref);
      } else {
        // 실패면 열어 둔다 — 닫아 버리면 무엇이 안 됐는지 확인할 자리가 없다
        toast.error(isSuspended ? "정지를 해제하지 못했습니다" : "정지하지 못했습니다");
      }
    });
  }

  return (
    <Dialog
      open={company !== null}
      onOpenChange={(open) => {
        // 처리 중엔 안 닫는다 — 창만 사라지고 요청은 계속 가면 결과를 못 본다
        if (open || isPending) return;
        // 묻는 단계에서 닫으면 값 화면으로 물러난다(모달 자체를 닫지 않는다)
        if (isConfirming) {
          setIsConfirming(false);
          return;
        }
        router.push(closeHref);
      }}
    >
      <DialogContent className="sm:max-w-md">
        {company && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2.5">
                <span
                  className="bg-chart-1/10 flex size-7 shrink-0 items-center justify-center rounded-lg"
                  aria-hidden
                >
                  <Building2 className="text-chart-1 size-[15px]" />
                </span>
                <span className="truncate">{company.name}</span>
              </DialogTitle>
              {/* 코드는 제목 옆이 아니라 아래 — 이름과 나란히 두면 어느 쪽이 이름인지 흐리다 */}
              <DialogDescription className="sr-only">기업 상세 정보</DialogDescription>
            </DialogHeader>

            {isConfirming ? (
              <>
                <p className="text-foreground text-[15px] leading-6 font-medium">
                  {isSuspended ? "정지를 해제할까요?" : "이 기업을 정지할까요?"}
                </p>
                <p className="text-muted-foreground text-[13px] leading-5">
                  {isSuspended
                    ? "해제하면 이 회사 사람들이 다시 워크스페이스를 쓸 수 있습니다."
                    : "정지하면 이 회사 사람 전원이 워크스페이스에 들어올 수 없습니다."}
                </p>

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isPending}
                    onClick={() => setIsConfirming(false)}
                  >
                    취소
                  </Button>
                  <Button
                    type="button"
                    variant={isSuspended ? "ink" : "destructive"}
                    disabled={isPending}
                    onClick={handleConfirm}
                  >
                    {isPending
                      ? isSuspended
                        ? "해제 중"
                        : "정지 중"
                      : isSuspended
                        ? "정지 해제"
                        : "정지"}
                  </Button>
                </DialogFooter>
              </>
            ) : (
              <>
                <dl className="flex flex-col">
                  <Field label="기업 코드" value={company.code} isMono />
                  <Field label="가입일" value={formatDate(company.joinedAt)} />
                  <Field label="구성원 수" value={`${company.memberCount}명`} />
                  <Field label="이번 달 회의" value={`${company.meetingCountThisMonth}회`} />
                  <Field
                    label="상태"
                    value={
                      <StatusBadge tone={STATUS_TONE[company.status]}>
                        {COMPANY_STATUS_LABEL[company.status]}
                      </StatusBadge>
                    }
                  />
                  <Field label="오너 이메일" value={company.ownerEmail} />
                </dl>

                <DialogFooter>
                  <Button
                    type="button"
                    variant={isSuspended ? "ink" : "destructive"}
                    onClick={() => setIsConfirming(true)}
                  >
                    {isSuspended ? "정지 해제" : "정지"}
                  </Button>
                </DialogFooter>
              </>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

/** 값 한 줄 — 승인 상세(`approval/[companyId]/page.tsx`)와 같은 규격이다 */
function Field({
  label,
  value,
  isMono,
}: {
  label: string;
  value: React.ReactNode;
  isMono?: boolean;
}) {
  return (
    <div className="border-border flex items-center justify-between gap-6 border-b py-2.5 last:border-b-0">
      <dt className="text-muted-foreground shrink-0 text-[13px] leading-5">{label}</dt>
      <dd
        className={`text-foreground min-w-0 truncate text-right text-[13px] leading-5 ${
          isMono ? "font-mono tabular-nums" : ""
        }`}
      >
        {value}
      </dd>
    </div>
  );
}
