"use client";

import { useSyncExternalStore } from "react";

/**
 * 기업 코드 기억 — 카카오워크처럼 한 번 넣으면 다음 방문에 건너뛴다.
 *
 * ⚠️ `sessionStorage`가 아니라 `localStorage`다. 탭을 닫으면 사라지면 "기억한다"가 아니다.
 * ⚠️ 기업 코드는 **자격증명이 아니다.** 회사를 가리키는 편의용 식별자일 뿐이고, 실제 판정은
 *    서버가 세션과 대조해서 한다(CLAUDE.md §권한). 토큰 저장 금지 규칙에 걸리지 않는다.
 * ⚠️ 저장소를 막은 브라우저(사파리 프라이빗)에서 `localStorage`는 **던진다.** 여기서 터지면
 *    로그인 화면이 통째로 죽으므로 읽기·쓰기 모두 감싼다 — 못 기억할 뿐 로그인은 된다.
 */
const STORAGE_KEY = "z:company-code";

/**
 * 저장된 코드를 **효과 없이** 읽는다.
 *
 * ⚠️ `useEffect`에서 `setState`로 채우면 하이드레이션 직후 한 번 더 렌더가 돈다.
 *    서버는 저장값을 알 수 없으므로 서버 스냅숏은 항상 `null`이고, 클라이언트에서 이어 붙는다.
 */
let cached: string | null | undefined;
const listeners = new Set<() => void>();

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  return () => listeners.delete(onChange);
}

function getSnapshot(): string | null {
  if (cached === undefined) cached = readCompanyCode();
  return cached;
}

/** 서버는 방문자의 저장값을 알 수 없다 — 코드가 없는 상태로 그린다 */
function getServerSnapshot(): string | null {
  return null;
}

export function useSavedCompanyCode() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

function publish(next: string | null) {
  const apply = () => {
    cached = next;
    listeners.forEach((listener) => listener());
  };

  /*
   * 단계가 바뀔 때 **View Transitions API**로 화면을 부드럽게 넘긴다.
   * ⚠️ 미지원 브라우저(사파리 일부·파이어폭스)에서는 `startViewTransition`이 없다 —
   *    그때는 그냥 즉시 바꾼다. 기능이 아니라 **연출**이라 없어도 흐름은 같다.
   */
  const doc = document as Document & {
    startViewTransition?: (callback: () => void) => unknown;
  };
  if (typeof doc.startViewTransition === "function") {
    doc.startViewTransition(apply);
    return;
  }
  apply();
}

export function readCompanyCode(): string | null {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function saveCompanyCode(code: string) {
  try {
    window.localStorage.setItem(STORAGE_KEY, code);
  } catch {
    /* 저장소를 막은 브라우저 — 이번 방문에만 적용된다 */
  }
  publish(code);
}

export function clearCompanyCode() {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* 위와 같다 */
  }
  publish(null);
}
