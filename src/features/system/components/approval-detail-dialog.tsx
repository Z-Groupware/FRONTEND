"use client";

import { Info } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { DialogMark } from "@/components/common/dialog-mark";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { APPROVAL_RESULT, APPROVAL_RESULT_LABEL } from "@/constants/system";
import { formatDate } from "@/lib/date";

import { approveCompanyAction, rejectCompanyAction } from "../actions";
import type { PendingCompanyApproval } from "../types";

interface ApprovalDetailDialogProps {
  company: PendingCompanyApproval | null;
  /** 닫히면 돌아갈 곳 — 목록(쿼리의 `id`만 없어진 형태) */
  closeHref: string;
}

type PendingAction = typeof APPROVAL_RESULT.APPROVE | typeof APPROVAL_RESULT.REJECT | null;

/**
 * "기업 승인" 행을 누르면 뜨는 신청서 상세 — 승인·반려를 여기서 끝낸다.
 *
 * ⚠️ **페이지가 아니라 모달이다**(2026-08-10 변경). 담는 값이 다섯 줄뿐이라 페이지로 열면
 *    1440 폭 화면 한가운데 420짜리 카드 하나만 떠서 나머지가 통째로 비었고, 목록 →
 *    상세 → 목록으로 화면이 두 번 갈아 끼워졌다. 옆 화면인 "기업 관리" 상세도 모달이라
 *    같은 목록 화면인데 하나는 페이지, 하나는 모달로 갈리는 것도 맞지 않았다.
 * ⚠️ 열림은 **주소(`?id=`)가 정한다** — `company-detail-dialog.tsx`와 같은 방식이다. 값은
 *    서버가 읽어 넘기므로 이 창은 자기가 뭘 불러오지 않는다(CLAUDE.md §핵심 4원칙 ①).
 * ⚠️ **공용 창(`ConfirmDialog`·`ResultDialog`)과 같은 옷을 입는다** — 원 표식 → 가운데 제목
 *    → 값 → 버튼, 폭 420, 안쪽 여백 32.
 *    ⚠️ 표식 배지는 `none`이다 — 아직 승인도 반려도 안 했다. 체크를 달면 "이미 끝났다"로
 *       읽힌다.
 * ⚠️ 확인은 **공용 `ConfirmDialog`** 를 쓰되 **겹쳐 띄우지 않는다.** 상세를 닫고 확인창을
 *    띄운다(한 번에 하나만 뜬다) — 취소하면 상세로 되돌아온다(`company-detail-dialog.tsx`와
 *    같은 이유).
 * ⚠️ 성공하면 **닫고 목록으로 돌아간다.** 처리된 신청은 대기 목록에 없으므로 그 자리에
 *    남아 있을 이유가 없다. 실패하면 안 닫는다 — 무엇이 안 됐는지 볼 자리가 없어진다.
 * ⚠️ `company`가 `null`이어도 항상 렌더링한다 — 닫히는 애니메이션 동안 내용이 먼저
 *    사라지면 어색하다. 열림 여부는 `open` prop 하나로만 정한다.
 */
export function ApprovalDetailDialog({ company, closeHref }: ApprovalDetailDialogProps) {
  const router = useRouter();
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [isPending, startTransition] = useTransition();

  const isReject = pendingAction === APPROVAL_RESULT.REJECT;

  function handleConfirm() {
    const action = pendingAction;
    if (!company || !action) return;

    startTransition(async () => {
      let success = false;

      try {
        const response =
          action === APPROVAL_RESULT.APPROVE
            ? await approveCompanyAction(company.id)
            : await rejectCompanyAction(company.id);
        success = response.success;
      } catch {
        // ⚠️ 미구현(!isMock) 분기 등에서 던진 에러가 여기로 온다 — 조용히 삼키지 않는다
        success = false;
      }

      setPendingAction(null);

      if (success) {
        toast.success(APPROVAL_RESULT_LABEL[action]);
        router.push(closeHref);
      } else {
        // 실패면 상세로 되돌아온다 — 닫아 버리면 무엇이 안 됐는지 확인할 자리가 없다
        toast.error("처리하지 못했습니다");
      }
    });
  }

  return (
    <>
      <Dialog
        open={company !== null && pendingAction === null}
        onOpenChange={(open) => {
          // 확인창을 띄우느라 닫히는 것은 진짜로 닫는 게 아니다 — 주소를 건드리지 않는다
          if (open || pendingAction !== null || isPending) return;
          router.push(closeHref);
        }}
      >
        <DialogContent className="max-h-[calc(100dvh-2rem)] gap-0 overflow-y-auto p-8 sm:max-w-[420px]">
          {company && (
            <>
              <DialogHeader className="items-center gap-5 text-center">
                <DialogMark badge="none" />

                <span className="flex flex-col items-center gap-2">
                  <DialogTitle className="text-xl leading-[26px] font-semibold tracking-[-0.4px]">
                    {company.companyName}
                  </DialogTitle>
                  <DialogDescription className="text-center text-[13px] leading-[21px] break-keep">
                    가입을 신청한 기업입니다.
                  </DialogDescription>
                </span>
              </DialogHeader>

              {/*
                ⚠️ **한 줄에 한 항목**이다. 2열 격자로 두면 값 길이가 제각각이라 오른쪽 칸이
                   통째로 비고(담당자 이메일 줄이 그랬다) 어느 라벨의 값인지 눈이 한 번 더 찾는다.
              */}
              <dl className="mt-5 flex flex-col">
                <Field label="사업자등록번호" value={company.businessRegistrationNumber} isMono />
                <Field label="신청일" value={formatDate(company.appliedAt)} />
                <Field label="대표자" value={company.representativeName} />
                <Field label="구성원" value={`${company.memberCount}명`} />
                <Field label="담당자 이메일" value={company.contactEmail} />
              </dl>

              {/*
                ⚠️ "기업 코드 자동 발급·이메일 발송"이라 적지 않는다 — 지금은 목이라 대기
                   목록에서 지우기만 한다(`../actions.ts`의 `approveCompanyAction` 주석). 실제로
                   안 하는 일을 약속하지 않는다(§정직성).
                ⚠️ 버튼 바로 위 가운데 — 누르려는 손이 지나가는 자리에 있어야 읽힌다.
                   왼쪽 라벨 줄에 세웠더니 값이 하나 더 있는 것처럼 읽혔다(§confirm-dialog).
              */}
              <p className="text-muted-foreground mt-5 flex items-start justify-center gap-1.5 text-[13px] leading-5 break-keep">
                <span className="flex h-5 shrink-0 items-center">
                  <Info className="size-3.5" aria-hidden />
                </span>
                <span>승인하면 이 신청은 대기 목록에서 사라집니다.</span>
              </p>

              {/*
                ⚠️ 두 버튼이 **같은 폭·같은 높이(44)** 다 — 공용 확인창과 같은 규격이다. 한쪽이
                   넓으면 그쪽을 권하는 것처럼 보이고, 낮으면 같은 무게의 결정으로 안 읽힌다.
                ⚠️ 물러나는 쪽(반려)이 왼쪽이다.
              */}
              <div className="mt-5 flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive h-11 flex-1 text-[14px]"
                  onClick={() => setPendingAction(APPROVAL_RESULT.REJECT)}
                >
                  반려
                </Button>
                <Button
                  type="button"
                  variant="ink"
                  className="border-foreground h-11 flex-1 border text-[14px]"
                  onClick={() => setPendingAction(APPROVAL_RESULT.APPROVE)}
                >
                  승인
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/*
        ⚠️ 상세 **밖**에 둔다. 안에 두면 상세가 닫힐 때 같이 사라져 확인창이 못 뜬다.
        ⚠️ 취소하면 상세로 되돌아온다 — 실수로 눌렀을 때 값 화면을 다시 찾지 않아도 된다.
      */}
      <ConfirmDialog
        isOpen={pendingAction !== null}
        onOpenChange={(open) => {
          // 처리 중엔 안 닫는다 — 창만 사라지고 요청은 계속 가면 결과를 못 본다
          if (!open && !isPending) setPendingAction(null);
        }}
        title={
          isReject
            ? `'${company?.companyName}' 신청을 반려할까요?`
            : `'${company?.companyName}' 가입을 승인할까요?`
        }
        description={
          isReject
            ? "반려하면 이 신청은 목록에서 사라지고 되돌릴 수 없습니다."
            : "승인하면 이 신청은 대기 목록에서 사라집니다."
        }
        confirmLabel={isReject ? "반려" : "승인"}
        pendingLabel={isReject ? "반려 중" : "승인 중"}
        isDestructive={isReject}
        isPending={isPending}
        onConfirm={handleConfirm}
      />
    </>
  );
}

/** 값 한 줄 — 기업 상세(`company-detail-dialog.tsx`)와 같은 규격이다 */
function Field({ label, value, isMono }: { label: string; value: string; isMono?: boolean }) {
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
