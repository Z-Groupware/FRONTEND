"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { LeaveGuard } from "@/components/common/leave-guard";

interface BoardLeaveGuardProps {
  /** 저장 안 한 드래그 변경이 있으면 true — 사이드바 이동·뒤로 가기·탭 닫기를 전부 막는다. */
  hasUnsaved: boolean;
}

/**
 * 보드 전용 이탈 방지 — [저장하기] 전에 나가려 하면 확인창을 한 번 거친다(WORKFLOW.md §8).
 * 막는 게 아니라 **확인**이다 — [나가기]를 고르면 그대로 나간다(드래그는 로컬 상태일 뿐이라
 * 잃어도 서버 데이터는 그대로다, 다만 다시 드래그해야 한다).
 *
 * ⚠️ `review-leave-guard.tsx`와 같은 뼈대다 — 링크 클릭 가로채기·`popstate` 더미 히스토리·
 *    `beforeunload` 세 갈래를 그대로 재사용한다(다른 점만 여기 적는다). 화면마다 다른 건
 *    "무엇을 잃는지" 문구뿐이라, 공용 컴포넌트로 합치지 않고 각 화면이 자기 문구를 든
 *    얇은 래퍼로 둔다 — 화면마다 잃는 대상이 달라 문구를 params로 받으면 오히려 각 화면의
 *    맥락(무엇을 만들다 나가는지)이 흐려진다.
 */
export function BoardLeaveGuard({ hasUnsaved }: BoardLeaveGuardProps) {
  const router = useRouter();
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const [pendingBack, setPendingBack] = useState(false);
  const bypassBackRef = useRef(false);
  /** ⚠️ Strict Mode 이중 실행 대비 — `review-leave-guard.tsx`의 같은 주석 참고. */
  const suppressNextPopRef = useRef(false);

  const isOpen = pendingHref !== null || pendingBack;

  useEffect(() => {
    if (!hasUnsaved) return;

    function handleClick(event: MouseEvent) {
      if (event.defaultPrevented) return;
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }
      const anchor = (event.target as HTMLElement).closest("a[href]");
      if (!(anchor instanceof HTMLAnchorElement)) return;
      if (anchor.target === "_blank" || anchor.hasAttribute("download")) return;
      if (anchor.origin !== window.location.origin) return;
      if (anchor.href === window.location.href) return;

      event.preventDefault();
      event.stopPropagation();
      setPendingHref(`${anchor.pathname}${anchor.search}${anchor.hash}`);
    }

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, [hasUnsaved]);

  useEffect(() => {
    if (!hasUnsaved) return;

    const hrefAtMount = window.location.href;
    window.history.pushState(null, "", hrefAtMount);

    function handlePopState() {
      if (suppressNextPopRef.current) {
        suppressNextPopRef.current = false;
        return;
      }
      if (bypassBackRef.current) {
        bypassBackRef.current = false;
        return;
      }
      window.history.pushState(null, "", window.location.href);
      setPendingBack(true);
    }

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
      if (window.location.href === hrefAtMount) {
        suppressNextPopRef.current = true;
        window.history.back();
      }
    };
  }, [hasUnsaved]);

  function handleStay() {
    setPendingHref(null);
    setPendingBack(false);
  }

  function handleLeave() {
    if (pendingHref) {
      router.replace(pendingHref);
    } else if (pendingBack) {
      bypassBackRef.current = true;
      window.history.go(-2);
    }
    setPendingHref(null);
    setPendingBack(false);
  }

  return (
    <>
      <LeaveGuard hasUnsaved={hasUnsaved} />
      <ConfirmDialog
        isOpen={isOpen}
        onOpenChange={(open) => !open && handleStay()}
        title="이 화면을 나갈까요?"
        description="옮긴 카드는 저장하지 않으면 사라집니다."
        confirmLabel="나가기"
        isDestructive
        onConfirm={handleLeave}
      />
    </>
  );
}
