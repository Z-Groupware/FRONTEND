"use client";

import { createContext, type ReactNode, useContext, useState } from "react";
import { createPortal } from "react-dom";

/**
 * 배너(`NotificationBanner`·`PasswordChangeBanner`)를 상단바 바로 아래 자리로 보내는 통로.
 *
 * ⚠️ **왜 포털인가.** `(shell)/layout.tsx`는 배너를 `{children}`보다 먼저 그리는데, 도메인
 *    `layout.tsx`가 상단바(`PageHeader`)를 `<>{'{'}PageHeader{'}'}{'{'}children{'}'}</>`로
 *    프래그먼트째 반환해서 실제로는 셸의 같은 flex 세로줄 안에 배너와 나란한 형제로 들어간다
 *    — DOM 순서 그대로면 배너가 상단바보다 먼저(위에) 뜬다.
 * ⚠️ **CSS `order`로 시각 순서만 바꾸면 안 된다**(적대적 리뷰, 2026-08-14). `order`는 그리는
 *    순서만 바꾸지 **키보드 탭 순서·스크린리더 낭독 순서는 그대로 DOM 순서를 따른다**
 *    (WCAG 1.3.2) — 그러면 화면은 "상단바 → 배너"로 보이는데 Tab은 "배너 닫기 버튼 →
 *    상단바 뒤로가기·테마 전환" 순으로 짚어 시각과 포커스가 어긋난다. 포털은 실제 DOM
 *    위치를 상단바 바로 뒤로 옮기므로 시각·DOM·포커스 순서가 전부 같아진다.
 */

interface HeaderBannerSlotContextValue {
  slot: HTMLDivElement | null;
  setSlot: (el: HTMLDivElement | null) => void;
}

const HeaderBannerSlotContext = createContext<HeaderBannerSlotContextValue | null>(null);

export function HeaderBannerSlotProvider({ children }: { children: ReactNode }) {
  const [slot, setSlot] = useState<HTMLDivElement | null>(null);
  return (
    <HeaderBannerSlotContext.Provider value={{ slot, setSlot }}>
      {children}
    </HeaderBannerSlotContext.Provider>
  );
}

/**
 * `PageHeader`가 자기 바로 뒤에 심어 두는 자리 — 배너가 실제로 여기(DOM 위치)에 꽂힌다.
 * ⚠️ 값이 아니라 **자리**만 낸다. 내용은 모른다 — `HeaderBannerPortal`이 무엇을 보낼지 정한다.
 */
export function HeaderBannerAnchor() {
  const ctx = useContext(HeaderBannerSlotContext);
  return <div ref={ctx?.setSlot} />;
}

/**
 * 셸이 배너를 이 컴포넌트에 담아 보낸다 — 자리가 아직 없으면(첫 페인트 직후, 상단바가
 * 아직 자리를 등록하기 전) 아무것도 안 그린다. 두 배너 다 원래도 마운트 뒤 상태로
 * 드러나는 자리라(SSE·`localStorage` 확인) 한 틱 늦게 나타나는 건 기존과 다르지 않다.
 */
export function HeaderBannerPortal({ children }: { children: ReactNode }) {
  const ctx = useContext(HeaderBannerSlotContext);
  if (!ctx?.slot) return null;
  return createPortal(children, ctx.slot);
}
