"use client";

import type { ReactNode } from "react";

import { DialogMark } from "@/components/common/dialog-mark";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ConfirmDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  /** 무엇을 할지 묻는 한 문장 — "지울까요?"처럼 행동이 드러나게 */
  title: string;
  /** **무엇을 잃는지** 적는다. "정말요?"만 묻는 건 확인이 아니다 */
  description: ReactNode;
  /** 제목과 버튼 사이 — 무엇을 지우는지 요약해 보여줄 자리 */
  children?: ReactNode;
  /**
   * 실행 버튼 문구 — `확인`이 아니라 **하는 일을 한 낱말로** 적는다(`삭제`·`해지`·`발송`).
   *
   * ⚠️ **문장으로 쓰지 않는다.** `해지할게요`(해요체)도 `해지합니다`(장황)도 아니다 —
   *    버튼은 누르면 무슨 일이 일어나는지만 말하면 된다. 이유·결과는 설명이 맡는다.
   * ⚠️ `cancelLabel`은 웬만하면 **안 넘긴다.** 기본값 `취소`를 두고 창마다
   *    `그대로 둡니다`·`그만둡니다`처럼 다른 말을 쓰면 같은 자리가 매번 다르게 읽힌다.
   */
  confirmLabel: string;
  /** 물러나는 쪽 문구. 기본은 "취소" */
  cancelLabel?: string;
  /** 되돌릴 수 없는 일이면 켠다 — 실행 버튼이 빨강이 된다 */
  isDestructive?: boolean;
  /**
   * 표식 배지. 기본은 `check`.
   *
   * ⚠️ **안 된 일을 알리면서 다시 물을 때는 `alert`** 다 — 결제 실패처럼 "실패했다 + 다시 할래?"가
   *    한 창에 들어오는 경우. 체크를 그대로 두면 실패 창에 완료 표식이 뜬다.
   */
  mark?: "check" | "alert";
  /**
   * 서버를 부르는 중인지. 켜면 **두 버튼이 다 잠긴다** —
   * 실행 중에 취소를 누르면 창만 닫히고 요청은 계속 가서 결과를 못 본다.
   */
  isPending?: boolean;
  /** 진행 중에 보여줄 실행 버튼 문구 — 없으면 `confirmLabel`을 그대로 쓴다 */
  pendingLabel?: string;
  /**
   * 실패 사유 — 창을 **열어 둔 채** 버튼 위에 적는다.
   *
   * ⚠️ 되돌릴 수 없는 일이 막혔을 때는 토스트로만 알리지 않는다. 토스트는 사라지는데
   *    창은 그대로 떠 있어서, 몇 초 뒤에 온 사람은 아무 일도 안 일어난 줄 알고 같은
   *    버튼을 다시 누른다(§토스트는 보조다).
   */
  error?: string | null;
  /**
   * 실행 버튼만 잠근다 — `children`에 **채워야 할 칸**이 있을 때 쓴다(반려 사유).
   * ⚠️ 취소는 안 잠근다. 못 채워서 못 나가는 창이 되면 갇힌다.
   */
  isConfirmDisabled?: boolean;
  onConfirm: () => void;
}

/**
 * 확인을 받는 창 — **되돌리기 어려운 일은 전부 이걸 쓴다.**
 *
 * 모양은 `ResultDialog`와 **한 식구**다: 원 표식 → 제목 → 설명 → 버튼으로 가운데 정렬.
 * 결과를 알리는 창과 확인을 받는 창이 다르게 생기면 같은 서비스로 안 읽힌다.
 *
 * ⚠️ 표식은 완료 창과 **완전히 같다**(원 + 차오름 + Z + 체크 배지). 다른 건 버튼이 둘이라는 것뿐이다.
 *    체크가 "이미 끝났다"로 읽힐 여지는 있지만, 두 창이 한 식구로 보이는 쪽을 택했다(팀 결정).
 *    무엇을 묻는지는 제목이 말한다 — "~할까요?"로 끝나므로 아직 안 끝난 게 문장에서 드러난다.
 * ⚠️ 토스트로 확인받지 않는다. 토스트는 결과를 알리는 자리고, 확인은 선택지가 둘이라
 *    멈춰 세워야 한다(DECISIONS §토스트).
 * ⚠️ 실행 버튼을 **기본(파랑)으로 두지 않는다.** 파랑은 "권하는 행동"으로 읽히는데
 *    해지·삭제는 권할 일이 아니다 — `isDestructive`면 빨강, 아니면 먹색이다.
 * ⚠️ 물러나는 쪽이 **왼쪽**이다. 오른쪽 끝(엄지가 먼저 닿는 자리)에 파괴적 버튼을 두면
 *    실수로 눌린다.
 */
export function ConfirmDialog({
  isOpen,
  onOpenChange,
  title,
  description,
  children,
  confirmLabel,
  cancelLabel = "취소",
  isDestructive,
  mark,
  isPending,
  pendingLabel,
  isConfirmDisabled,
  error,
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      {/*
        ⚠️ `gap-0` — DialogContent가 자체 `gap-4`를 갖고 있어 아래 `mt-*`와 겹쳐 간격이 두 배가 된다.
           여백은 여기서 한 곳으로만 준다(§success-dialog와 같은 이유).
      */}
      <DialogContent className="gap-0 p-8 sm:max-w-[420px]">
        <DialogHeader className="items-center gap-5 text-center">
          {/*
            ⚠️ 완료 창과 **같은 표식**을 쓴다(`DialogMark`) — 표식이 다르게 뜨면 두 창이
               다른 물건처럼 보인다. 달라지는 건 배지뿐이다.
          */}
          <DialogMark badge={mark} />

          <span className="flex flex-col items-center gap-2">
            <DialogTitle className="text-xl leading-[26px] font-semibold tracking-[-0.4px]">
              {title}
            </DialogTitle>
            <DialogDescription className="text-center text-[13px] leading-[21px] break-keep">
              {description}
            </DialogDescription>
          </span>
        </DialogHeader>

        {children && <div className="mt-5">{children}</div>}

        {/* ⚠️ 버튼 **바로 위**다 — 다시 누르려는 손이 지나가는 자리에 있어야 읽힌다 */}
        {error && (
          <p
            role="alert"
            className="text-destructive mt-4 text-center text-[13px] leading-5 break-keep"
          >
            {error}
          </p>
        )}

        {/*
          두 버튼이 같은 폭이다 — 한쪽이 넓으면 그쪽을 권하는 것처럼 보인다.
          ⚠️ 높이는 완료 창 버튼(h-11)과 같다. 확인 창만 작으면 같은 무게의 결정으로 안 읽힌다.
        */}
        <div className="mt-5 flex gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            onClick={() => onOpenChange(false)}
            className="h-11 flex-1 text-[14px]"
          >
            {cancelLabel}
          </Button>
          {/*
            ⚠️ 파괴적이 아닐 때 `variant="default"`를 쓰지 않는다 — 그 변형은 `--primary`(파랑)라
               이 서비스의 주 버튼(먹색 = `ink`)과 다르다. 파랑은 링크·강조용이지 실행 버튼 색이 아니다.
            ⚠️ 실행 버튼에도 **테두리**를 준다. 옆의 물러나는 버튼만 테두리가 있으면
               둘이 다른 종류의 물건처럼 보인다 — 같은 줄의 선택지는 윤곽이 같아야 한다.
          */}
          <Button
            type="button"
            variant={isDestructive ? "destructive" : "ink"}
            disabled={isPending || isConfirmDisabled}
            onClick={onConfirm}
            className={
              isDestructive
                ? "border-destructive/40 h-11 flex-1 border text-[14px]"
                : "border-foreground h-11 flex-1 border text-[14px]"
            }
          >
            {isPending ? (pendingLabel ?? confirmLabel) : confirmLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
