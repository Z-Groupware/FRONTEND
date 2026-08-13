"use client";

import type { ReactNode } from "react";
import { createContext, useCallback, useContext, useState } from "react";

import { type NotificationEnvelope, toBannerNotification } from "./event";
import type { BannerNotification } from "./types";
import { useNotificationStream } from "./use-notification-stream";

/**
 * 알림 상태를 쥐고 있는 자리 — **셸에 한 번만** 마운트한다(`app/(shell)/layout.tsx`).
 *
 * ⚠️ **스트림은 여기 하나뿐이다.** 화면마다 열면 같은 알림이 배너에 여러 줄 뜬다
 *    (BE는 회원당 emitter 리스트 전부에 복사해 보낸다).
 */

interface NotificationContextValue {
  banners: BannerNotification[];
  dismissBanner: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

/**
 * ⚠️ **없으면 던진다.** 셸 밖(랜딩·온보딩)에서 부르면 조용히 아무 일도 안 일어나는데,
 *    그건 원인을 못 찾는 화면이다(§정직성).
 */
export function useNotificationCenter(): NotificationContextValue {
  const value = useContext(NotificationContext);
  if (!value) throw new Error("NotificationProvider 안에서만 쓸 수 있습니다.");
  return value;
}

/** 배너를 쌓아 두는 최대 줄 수 — 넘으면 오래된 것부터 밀려난다 */
const MAX_BANNERS = 3;

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [banners, setBanners] = useState<BannerNotification[]>([]);

  const handleEvent = useCallback((envelope: NotificationEnvelope) => {
    const banner = toBannerNotification(envelope);
    if (!banner) return;
    setBanners((prev) => {
      /* 재연결로 같은 알림이 다시 오면 한 줄로 접는다(§목록 — id로 중복을 거른다) */
      if (prev.some((item) => item.id === banner.id)) return prev;
      return [...prev, banner].slice(-MAX_BANNERS);
    });
  }, []);

  useNotificationStream(handleEvent);

  const dismissBanner = useCallback((id: string) => {
    setBanners((prev) => prev.filter((banner) => banner.id !== id));
  }, []);

  return (
    <NotificationContext.Provider value={{ banners, dismissBanner }}>
      {children}
    </NotificationContext.Provider>
  );
}
