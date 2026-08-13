"use client";

import { Info, X } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

import { useNotificationCenter } from "../notification-provider";

/**
 * 상단 배너 — 회의 개설·리마인더·취소·공지(BE `NotificationType` 4종).
 *
 * ⚠️ **알림 화면은 없다**(CLAUDE.md §렌더링·데이터). 목록을 만들지 않고 오는 순간 위에 띄운다.
 * ⚠️ **떠 있는 판이 아니라 본문 맨 위 줄이다.** `fixed`로 얹으면 토스트(`top-center`)와 같은
 *    자리를 다투고, 상단바 제목을 가린다 — 흐름에 넣으면 아래 내용이 그만큼 내려갈 뿐이다.
 * ⚠️ **색을 안 쓴다**(DESIGN §5 — 색으로 알리는 건 에러뿐). 취소 알림도 빨갛게 칠하지 않는다.
 *    개설·취소·공지를 가르는 건 문장이고, 배너는 그 문장을 나르는 자리다.
 * ⚠️ **문구를 조립하지 않는다.** BE가 만들어 보낸 `message`를 그대로 쓴다(`event.ts` 주석).
 */
export function NotificationBanner() {
  const { banners, dismissBanner } = useNotificationCenter();

  /* 없으면 자리도 안 만든다 — 빈 상자가 있으면 화면 위가 늘 한 칸 내려간다 */
  if (banners.length === 0) return null;

  return (
    /*
      ⚠️ `aria-live="polite"`다 — 새 알림이 와도 지금 하던 조작을 끊지 않는다.
         `assertive`는 스크린리더가 읽던 문장을 잘라 먹는다.
    */
    <div role="status" aria-live="polite" className="flex shrink-0 flex-col gap-2 px-8 pt-4">
      {banners.map((banner) => (
        <div
          key={banner.id}
          className="border-border bg-secondary animate-in fade-in slide-in-from-top-1 flex items-start gap-2 rounded-lg border px-3.5 py-3 text-[12px] leading-[18px] duration-150"
        >
          {/* ⚠️ 아이콘은 첫 줄 높이 상자에 넣어 가운데 맞춘다(DESIGN §2 안내 배너) */}
          <span className="flex h-[18px] shrink-0 items-center">
            <Info className="text-muted-foreground size-3.5" aria-hidden />
          </span>

          {/*
            ⚠️ **이동은 `<Link>`다**(CLAUDE.md §SEO — a11y 이유로 지킨다). `onClick`+`router.push`로
               만들면 새 탭·가운데 클릭이 안 되고 스크린리더가 링크로 못 읽는다.
            ⚠️ 갈 곳을 모르면(`href === null`) 문장만 남긴다 — 눌리지도 않는 링크를 만들지 않는다.
          */}
          <span className="min-w-0 flex-1 break-keep">
            {banner.href ? (
              <Link href={banner.href} className="hover:underline">
                {banner.message}
              </Link>
            ) : (
              banner.message
            )}
          </span>

          <Button
            variant="ghost"
            size="icon-xs"
            aria-label="알림 닫기"
            onClick={() => dismissBanner(banner.id)}
            className="text-muted-foreground -my-0.5 shrink-0"
          >
            <X aria-hidden />
          </Button>
        </div>
      ))}
    </div>
  );
}
