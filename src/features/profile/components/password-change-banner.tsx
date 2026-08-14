"use client";

import { Info, X } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

interface PasswordChangeBannerProps {
  memberId: number;
}

function storageKey(memberId: number): string {
  return `z_password_banner_dismissed_${memberId}`;
}

/**
 * "발급받은 비밀번호를 아직 쓰고 있다" 안내 — `/me` 서버가 `passwordChanged: false`일 때만 그려진다.
 *
 * ⚠️ **강제가 아니다** — `mustChangePassword`가 아니라 안 바꿔도 서비스 이용에 제약이 없다
 *    (마이페이지 담당자 문서, 2026-08-14). 그래서 변경 화면으로 막지 않고 닫기만 한다.
 * ⚠️ **닫은 기록은 이 브라우저에만 남는다**(`localStorage`, `NotificationBanner`와 달리 서버가
 *    아니라 여기서 "본 적 있다"를 기억해야 한다). 서버는 실제로 비밀번호를 바꾸기 전까지
 *    계속 `false`를 주므로, 안 남기면 화면을 옮길 때마다 다시 뜬다.
 * ⚠️ **하이드레이션 전에는 안 그린다.** 서버는 이 값을 모르는 채로 첫 HTML을 만드는데, 거기서
 *    바로 그리면 저장소에 이미 닫은 기록이 있는 사람에게도 한 프레임 깜빡인다.
 */
export function PasswordChangeBanner({ memberId }: PasswordChangeBannerProps) {
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    // ⚠️ 마이크로태스크로 미룬다 — 효과 본문에서 곧바로 `setState`하면 렌더가 겹쳐 돈다
    //    (`scale-store.ts`의 `subscribeScale`과 같은 자리).
    queueMicrotask(() => {
      try {
        setDismissed(localStorage.getItem(storageKey(memberId)) === "1");
      } catch {
        // 저장소가 막혀 있으면(사생활 모드 등) 이번 방문에서는 보여준다
        setDismissed(false);
      }
    });
  }, [memberId]);

  if (dismissed) return null;

  return (
    // ⚠️ 바깥 여백(`px-8 pt-4`)까지 여기서 진다 — `NotificationBanner`와 같은 자리(본문 맨 위 줄)에
    //    나란히 서므로, 셸이 아니라 이 배너 자체가 자기 자리를 잡는다.
    <div role="status" className="flex shrink-0 flex-col px-8 pt-4">
      <div className="border-border bg-secondary animate-in fade-in slide-in-from-top-1 flex items-start gap-2 rounded-lg border px-3.5 py-3 text-[12px] leading-[18px] duration-150">
        <span className="flex h-[18px] shrink-0 items-center">
          <Info className="text-muted-foreground size-3.5" aria-hidden />
        </span>

        <span className="min-w-0 flex-1 break-keep">
          지금 쓰는 비밀번호는 발급받은 비밀번호예요. 마이페이지에서 직접 정한 비밀번호로 바꿔
          주세요.
        </span>

        <Button
          variant="ghost"
          size="icon-xs"
          aria-label="안내 닫기"
          className="text-muted-foreground -my-0.5 shrink-0"
          onClick={() => {
            try {
              localStorage.setItem(storageKey(memberId), "1");
            } catch {
              // 저장이 안 되면 이번 새로고침 전까지만 닫힌 채로 남는다
            }
            setDismissed(true);
          }}
        >
          <X aria-hidden />
        </Button>
      </div>
    </div>
  );
}
