"use client";

import type { ReactNode } from "react";

import { CheckMark } from "@/components/common/check-mark";
import { ZLogo } from "@/components/icons/z-logo";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface SuccessDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  /** 제목 아래 한두 줄 설명 */
  description?: ReactNode;
  /** 제목과 버튼 사이 — 요약표처럼 결과를 정리해 보여줄 자리 */
  children?: ReactNode;
  /** 다음 행동 — 링크든 버튼이든 하나만 둔다 */
  action?: ReactNode;
}

/**
 * "다 됐어요" 알림 창 — **결과를 알리는 모달은 전부 이걸 쓴다.**
 *
 * 온보딩 완료 화면과 같은 결이다: 먹색 원에 Z 로고, 체크는 옆 배지,
 * 가운데 정렬로 **표시 → 문장 → 요약 → 버튼** 한 줄기로 읽힌다.
 *
 * ⚠️ 초록·파랑을 쓰지 않는다 — 색으로 알리는 건 에러뿐(DECISIONS §색 사용 규칙).
 * ⚠️ 확인을 받는 창(삭제할까요?)에는 쓰지 않는다. 그건 선택지가 둘이라 다른 모양이어야 한다.
 */
export function SuccessDialog({
  isOpen,
  onOpenChange,
  title,
  description,
  children,
  action,
}: SuccessDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      {/*
        ⚠️ `gap-0` — DialogContent가 자체 `gap-4`를 갖고 있어 아래 `mt-*`와 겹쳐 간격이 두 배가 된다.
           여백은 여기서 한 곳으로만 준다.
      */}
      <DialogContent className="gap-0 p-8 sm:max-w-[420px]">
        <DialogHeader className="items-center gap-5 text-center">
          <span className="relative" aria-hidden>
            <span className="border-border relative flex size-[68px] items-center justify-center rounded-full border">
              <span className="bg-foreground animate-fill-in absolute inset-0 rounded-full" />
              <ZLogo className="text-background animate-mark-in relative size-7" />
            </span>

            {/* 검은 원 위에 걸치므로 테두리가 있어야 원이 파먹힌 것처럼 안 보인다 */}
            <span className="animate-mark-in absolute -top-0.5 -right-0.5">
              <span className="bg-card border-foreground animate-float flex size-5 items-center justify-center rounded-full border">
                <CheckMark size={11} strokeWidth={3} />
              </span>
            </span>
          </span>

          <span className="flex flex-col items-center gap-2">
            <DialogTitle className="text-xl leading-[26px] font-semibold tracking-[-0.4px]">
              {title}
            </DialogTitle>
            {description && (
              <DialogDescription className="text-center text-[13px] leading-[21px] break-keep">
                {description}
              </DialogDescription>
            )}
          </span>
        </DialogHeader>

        {children && <div className="mt-5">{children}</div>}
        {action && <div className="mt-5">{action}</div>}
      </DialogContent>
    </Dialog>
  );
}
