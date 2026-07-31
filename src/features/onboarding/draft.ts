"use client";

import type { DepartmentNode, Invite, Position } from "./types";

/**
 * 온보딩 임시 보관함 — **BE 연동 전까지만 쓰는 코드다.**
 *
 * 온보딩은 [완료]에서 한 번에 커밋한다(`POST /onboarding/complete`).
 * 그래서 1~3단계를 오가는 동안에는 브라우저가 입력을 들고 있어야 한다.
 *
 * ⚠️ `sessionStorage`를 쓴다 — 탭을 닫으면 사라진다.
 *    `localStorage`면 다른 계정으로 로그인해도 이전 기업의 부서·직급이 남아 위험하다.
 * ⚠️ 서버 저장이 붙으면 **이 파일과 각 화면의 `saveDraft*` 호출만 지우면 된다.**
 *    다른 곳에서 `sessionStorage`를 직접 만지지 않는다.
 */

const KEY = "z:onboarding-draft";

export interface OnboardingDraft {
  departments?: DepartmentNode[];
  positions?: Position[];
  invites?: Invite[];
}

function read(): OnboardingDraft {
  // SSR에는 sessionStorage가 없다. 서버 렌더에서는 항상 빈 값이다.
  if (typeof window === "undefined") return {};

  try {
    const raw = window.sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as OnboardingDraft) : {};
  } catch {
    // 사파리 프라이빗 모드 등에서 접근이 막히거나 값이 깨졌을 때 — 없는 셈 친다
    return {};
  }
}

function write(next: OnboardingDraft): void {
  if (typeof window === "undefined") return;

  try {
    window.sessionStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // 저장 실패는 무시한다. 화면 동작은 메모리 상태로 계속된다.
  }
}

export function loadDraft(): OnboardingDraft {
  return read();
}

export function saveDraftDepartments(departments: DepartmentNode[]): void {
  write({ ...read(), departments });
}

export function saveDraftPositions(positions: Position[]): void {
  write({ ...read(), positions });
}

export function saveDraftInvites(invites: Invite[]): void {
  write({ ...read(), invites });
}

/** 온보딩을 마쳤거나 로그아웃할 때 — 다음 사람의 화면에 남지 않게 지운다. */
export function clearDraft(): void {
  if (typeof window === "undefined") return;

  try {
    window.sessionStorage.removeItem(KEY);
  } catch {
    // 무시
  }
}
