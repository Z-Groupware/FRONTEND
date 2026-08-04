"use client";

import { useState } from "react";

import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { Button } from "@/components/ui/button";

interface CancelSubscriptionProps {
  /** 이번 결제 주기가 끝나는 날 — 언제까지 쓸 수 있는지 말할 때 쓴다 */
  periodEnd: string;
  isCanceling: boolean;
  canManage: boolean;
  /** 확인 창에서 실행을 눌렀을 때 — 결과 알림은 부르는 쪽이 맡는다 */
  onConfirm: () => void;
}

/**
 * 구독 해지.
 *
 * ⚠️ **파괴적 작업이라 `Dialog`로 확인받는다.** 토스트는 확인 수단이 아니다(DECISIONS §토스트).
 * ⚠️ 해지하면 **무엇을 잃는지** 먼저 적는다. "정말 해지할까요?"만 묻는 건 확인이 아니다.
 * ⚠️ 빨강은 **버튼에만** 남긴다. 카드 전체를 빨갛게 칠했더니 아직 아무것도 안 눌렀는데
 *    화면이 경고 상태로 보였다 — 색으로 알리는 건 에러뿐이고(§디자인 토큰), 해지는
 *    에러가 아니라 사용자의 선택이다. 되돌릴 수 없다는 건 **문구와 확인 창**이 말한다.
 * ⚠️ **아직 서버가 없다.** 확인을 받고 나면 화면 상태만 뒤집힌다 — 새로고침하면 돌아온다.
 *    Server Action이 붙으면 `onConfirm`이 액션을 부르고 `revalidatePath`로 갱신한다.
 */
/*
  ⚠️ 무엇을 잃는지는 **한 곳에만 적는다.** 카드와 확인 창이 각자 적으면 한쪽만 고쳐져 어긋난다.
  ⚠️ 통합 검색을 "못 쓰게 된다"고 적으면 안 된다 — 검색은 Free에도 들어 있다(§PLAN_COMPARE).
     실제로 잃는 건 **인수인계·회의실·보드**와, 좌석·캡처·보관에 걸리는 **한도**다.
*/
/*
  ⚠️ **무료로 내려가는 게 아니라 끊긴다.** 무료 요금제가 없어졌으므로(2026-08-04)
     "Free 플랜으로 바뀝니다"는 이제 거짓이다.
  ⚠️ 기록을 어떻게 다루는지는 **여기서 약속하지 않는다.** 아직 정해지지 않은 정책이라
     화면에 적으면 그게 계약이 된다 — 정해지면 그때 한 줄 붙인다.
*/
const DOWNGRADE_NOTE = "종료 후에는 워크스페이스에 접근할 수 없습니다.";

export function CancelSubscription({
  periodEnd,
  isCanceling,
  canManage,
  onConfirm,
}: CancelSubscriptionProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleConfirm = () => {
    setIsOpen(false);
    onConfirm();
  };

  return (
    /*
      ⚠️ **한 줄짜리 카드**다. 제목·설명·버튼을 세로로 쌓았더니 위 카드들과 같은 높이를 차지해
         해지가 이 화면의 주요 기능처럼 보였다 — 설명은 왼쪽, 버튼은 오른쪽 끝에 둔다.
    */
    <section className="border-border bg-card flex items-center gap-6 rounded-2xl border px-7 py-5">
      <div className="min-w-0 flex-1">
        <h2 className="text-[14px] leading-5 font-semibold tracking-[-0.2px]">구독 해지</h2>
        <p className="text-muted-foreground pt-1 text-[13px] leading-5 break-keep">
          {isCanceling ? (
            <>
              <span className="text-foreground font-medium">{periodEnd}</span>까지 이용할 수
              있습니다. 계속 이용하시려면 해지를 취소해 주세요.
            </>
          ) : (
            <>
              해지 시 현재 결제 주기(
              <span className="text-foreground font-medium">{periodEnd}</span>)가 끝난 뒤 구독이
              종료됩니다. {DOWNGRADE_NOTE}
            </>
          )}
        </p>
      </div>

      {/*
        ⚠️ 권한이 없으면 **버튼을 숨기지 않고 잠근다.** 사라지면 "원래 없는 기능"으로 읽히는데
           사실은 권한 문제다 — 왜 못 누르는지 옆에 적는다(§정직성).
      */}
      <div className="flex shrink-0 items-center gap-3">
        {!canManage && (
          <span className="text-muted-foreground text-[12px] leading-4">
            대표 또는 Admin 권한이 필요합니다
          </span>
        )}
        <Button
          type="button"
          variant="outline"
          disabled={!canManage}
          onClick={() => setIsOpen(true)}
          className="border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive h-9"
        >
          {isCanceling ? "해지 취소" : "구독 해지"}
        </Button>
      </div>

      <ConfirmDialog
        isOpen={isOpen}
        onOpenChange={setIsOpen}
        title={isCanceling ? "해지를 취소할까요?" : "구독을 해지할까요?"}
        description={
          isCanceling
            ? `${periodEnd} 이후에도 구독이 유지되고 다음 결제일에 정상 청구됩니다.`
            : `${periodEnd}까지 이용할 수 있습니다. ${DOWNGRADE_NOTE}`
        }
        confirmLabel={isCanceling ? "계속 쓸게요" : "해지할게요"}
        cancelLabel={isCanceling ? "닫기" : "그대로 둘게요"}
        isDestructive={!isCanceling}
        onConfirm={handleConfirm}
      />
    </section>
  );
}
