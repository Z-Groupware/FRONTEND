"use client";

import type { ReactNode } from "react";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { toast } from "sonner";

import { retryMeetingSummaryAction } from "@/features/meeting/summary/actions";

import { fetchAnalysisStatusAction } from "./actions";
import {
  advance,
  ANALYSIS_POLL_INTERVAL_MS,
  expire,
  isExpired,
  isSettled,
  restart,
  restoreTracking,
  shouldPoll,
  startTracking,
} from "./analysis";
import { type NotificationEnvelope, toAnalysisSignal, toBannerNotification } from "./event";
import { ANALYSIS_CARD_STATE, type AnalysisTracking, type BannerNotification } from "./types";
import { useNotificationStream } from "./use-notification-stream";

/**
 * 알림 상태를 쥐고 있는 자리 — **셸에 한 번만** 마운트한다(`app/(shell)/layout.tsx`).
 *
 * ⚠️ **왜 화면이 아니라 셸인가.** 카드의 존재 이유가 "회의를 끝내고 다른 일을 해도 진행이
 *    따라온다"이다. 캡처 화면이 들고 있으면 목록으로 옮기는 순간 언마운트돼 사라진다 —
 *    지금 토스트와 똑같아진다.
 * ⚠️ **스트림도 여기 하나뿐이다.** 화면마다 열면 같은 알림이 배너에 여러 줄 뜬다
 *    (BE는 회원당 emitter 리스트 전부에 복사해 보낸다).
 */

interface NotificationContextValue {
  banners: BannerNotification[];
  dismissBanner: (id: string) => void;
  tracking: AnalysisTracking | null;
  /**
   * 회의 종료 직후 캡처 화면이 부른다 — 이 순간부터 카드가 뜬다.
   * ⚠️ `meetingId`는 **화면이 쓰는 문자열 id 그대로** 넘긴다(`Number()`로 바꾸지 않는다 —
   *    목 id가 `NaN`이 되어 카드가 멈춘다, `types.ts` 주석).
   */
  trackAnalysis: (meetingId: string, title: string) => void;
  dismissAnalysis: () => void;
  retryAnalysis: () => void;
  /**
   * 진짜 재분석(ANLZ-02) — `FAILED` 카드 전용. `retryAnalysis`(상태 재조회)와 다른 일이다 —
   * 이건 서버에 "실패한 계층부터 다시 돌려라"를 실제로 요청한다.
   */
  retryFailedSummary: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

/**
 * ⚠️ **없으면 던진다.** 셸 밖(랜딩·온보딩)에서 부르면 카드가 조용히 안 뜨는데, 그건
 *    "종료했는데 아무 일도 안 일어난 화면"이라 원인을 못 찾는다(§정직성).
 */
export function useNotificationCenter(): NotificationContextValue {
  const value = useContext(NotificationContext);
  if (!value) throw new Error("NotificationProvider 안에서만 쓸 수 있습니다.");
  return value;
}

/** 배너를 쌓아 두는 최대 줄 수 — 넘으면 오래된 것부터 밀려난다 */
const MAX_BANNERS = 3;

/** ⚠️ 탭을 닫으면 같이 사라져야 한다 — `sessionStorage`인 이유는 `analysis.ts` 주석 참고 */
const TRACKING_STORAGE_KEY = "z:analysis-tracking";

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [banners, setBanners] = useState<BannerNotification[]>([]);
  const [tracking, setTracking] = useState<AnalysisTracking | null>(null);

  /*
    ⚠️ **먼저 되살리고, 되살린 뒤부터 저장한다**(`features/onboarding/use-draft-sync.ts`와
       같은 순서). 반대로 하면 마운트 첫 렌더의 `null`이 보관함을 덮어써서, 새로고침할
       때마다 쫓던 회의가 날아간다.
    ⚠️ **마운트 뒤에 읽는다.** 렌더 중에 읽으면 서버가 그린 HTML과 어긋난다(hydration) —
       서버는 브라우저 저장소를 모른다. 한 번만 일어나는 동기화라 규칙을 끈다.
  */
  const [isRestored, setIsRestored] = useState(false);

  useEffect(() => {
    const saved = restoreTracking(window.sessionStorage.getItem(TRACKING_STORAGE_KEY));
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTracking(saved);

    setIsRestored(true);
  }, []);

  useEffect(() => {
    if (!isRestored) return;
    if (tracking) {
      window.sessionStorage.setItem(TRACKING_STORAGE_KEY, JSON.stringify(tracking));
    } else {
      window.sessionStorage.removeItem(TRACKING_STORAGE_KEY);
    }
  }, [isRestored, tracking]);

  /* ─────────────────────────────── 스트림 ─────────────────────────────── */

  const handleEvent = useCallback((envelope: NotificationEnvelope) => {
    /*
      ⚠️ **여기가 소스 교체의 이음매였다.** `event.ts`의 `ANALYSIS_EVENT_STATE`가 채워지면서
         (2026-08-13, BE #460) `toAnalysisSignal`이 이제 실제 신호를 낸다 — 스트림이 카드를
         직접 움직이고, 폴링(`use-analysis-tracker`)은 스트림이 놓친 걸 늦게 잡는 보조가
         됐다. **카드·배너 컴포넌트는 한 줄도 안 바뀌었다.**
    */
    const signal = toAnalysisSignal(envelope);
    if (signal) {
      setTracking((prev) =>
        prev && prev.meetingId === signal.meetingId
          ? advance(prev, { ok: true, status: signal.status })
          : prev,
      );
      return;
    }

    const banner = toBannerNotification(envelope);
    if (!banner) return;
    setBanners((prev) => {
      /* 재연결로 같은 알림이 다시 오면 한 줄로 접는다(§목록 — id로 중복을 거른다) */
      if (prev.some((item) => item.id === banner.id)) return prev;
      return [...prev, banner].slice(-MAX_BANNERS);
    });
  }, []);

  useNotificationStream(handleEvent);

  /* ─────────────────────────── 요약 진행 폴링(CAP-06) ─────────────────────────── */

  /*
    ⚠️ **한 번에 한 회의만 쫓는다.** 사람이 동시에 두 회의를 끝낼 수는 없고, 여러 장을
       쌓으면 화면 오른쪽 아래가 카드로 덮인다 — 새로 끝내면 앞 카드는 그 자리를 내준다.
  */
  const trackAnalysis = useCallback((meetingId: string, title: string) => {
    setTracking(startTracking(meetingId, title, Date.now()));
  }, []);

  const dismissAnalysis = useCallback(() => setTracking(null), []);

  const retryAnalysis = useCallback(() => {
    setTracking((prev) => (prev ? restart(prev, Date.now()) : prev));
  }, []);

  /*
    ⚠️ **`retryAnalysis`와 다른 함수다.** 저건 상태 조회를 다시 하는 것뿐이고(`UNAVAILABLE` 전용),
       이건 실제로 BE에 "실패한 계층부터 다시 돌려라"를 요청한다(ANLZ-02, `retryMeetingSummaryAction`
       — 마이페이지 「요약이 중단된 회의」의 [다시 분석]과 같은 액션). 성공하면 트래킹을
       `RUNNING`으로 되돌려 기존 폴링이 다시 진행 상황을 쫓게 한다.
    ⚠️ **`tracking`을 의존성에 둔다.** 요청 시점의 `meetingId`가 최신이어야 한다 — 그 사이
       다른 회의를 쫓기 시작했는데 옛 회의로 재분석을 걸면 안 된다.
  */
  const retryFailedSummary = useCallback(async () => {
    if (!tracking || tracking.state !== ANALYSIS_CARD_STATE.FAILED) return;
    const meetingId = tracking.meetingId;
    const result = await retryMeetingSummaryAction(meetingId);

    if (result.error) {
      toast.error(
        result.needsFullRerun
          ? "재개할 수 있는 지점이 없습니다. 회의를 다시 캡처해야 합니다."
          : result.error,
      );
      return;
    }

    if (result.pendingNote) toast(result.pendingNote);

    setTracking((prev) =>
      prev && prev.meetingId === meetingId ? restart(prev, Date.now()) : prev,
    );
  }, [tracking]);

  /*
    ⚠️ **의존성이 `tracking` 통째다.** 한 번 물어볼 때마다 `attempt`가 올라 새 객체가 되고,
       그때마다 이 효과가 다시 돌며 다음 한 번을 예약한다 — `setInterval` 하나로 돌리면
       응답이 늦을 때 요청이 겹쳐 쌓인다.
  */
  useEffect(() => {
    const current = tracking;
    if (!current || isSettled(current.state)) return;

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    /*
      ⚠️ **화살표 함수로 둔다.** `function` 선언은 끌어올려져서 위의 `if (!current) return`
         narrowing이 안쪽까지 안 따라온다(TS) — 타입을 느슨하게 푸는 대신 모양을 바꾼다.
    */
    const probe = async () => {
      const result = await fetchAnalysisStatusAction(current.meetingId, current.attempt);
      if (cancelled) return;
      /* 쫓는 회의가 그 사이 바뀌었으면(다른 회의를 끝냈다) 늦게 온 답은 버린다 */
      setTracking((prev) =>
        prev && prev.meetingId === current.meetingId ? advance(prev, result) : prev,
      );
    };

    /*
      ⚠️ **상한 판정을 타이머 안에서 한다.** 효과 본문에서 바로 `setTracking`을 부르면
         렌더가 연쇄로 한 번 더 돈다(`react-hooks/set-state-in-effect`) — 어차피 5초 뒤
         이 타이머가 깨어나므로 그 자리에서 접으면 된다.
      ⚠️ 접는 걸 빼먹으면 스피너가 영원히 돈다 — 그게 「요약 중」이라는 거짓말이다(§정직성).
    */
    const tick = () => {
      const now = Date.now();
      if (isExpired(current, now)) {
        setTracking((prev) =>
          prev && prev.meetingId === current.meetingId && !isSettled(prev.state)
            ? expire(prev)
            : prev,
        );
        return;
      }
      if (!shouldPoll(current, now, document.hidden)) return;
      void probe();
    };

    timer = setTimeout(tick, ANALYSIS_POLL_INTERVAL_MS);

    /*
      ⚠️ 숨은 탭에서는 예약이 지나가도 아무것도 안 한다 — 돌아오는 순간 이 핸들러가
         **기다리지 않고 바로** 한 번 물어본다. 안 그러면 화면을 다시 켰을 때 이미 끝난
         요약이 몇 초 더 「요약 중」으로 남는다.
    */
    const wake = () => {
      if (document.hidden) return;
      if (timer) clearTimeout(timer);
      tick();
    };

    document.addEventListener("visibilitychange", wake);
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      document.removeEventListener("visibilitychange", wake);
    };
  }, [tracking]);

  const dismissBanner = useCallback((id: string) => {
    setBanners((prev) => prev.filter((banner) => banner.id !== id));
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        banners,
        dismissBanner,
        tracking,
        trackAnalysis,
        dismissAnalysis,
        retryAnalysis,
        retryFailedSummary,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}
