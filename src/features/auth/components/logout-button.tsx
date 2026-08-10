"use client";

import { LogOut } from "lucide-react";
import { useFormStatus } from "react-dom";

import { logoutAction } from "../actions";

/**
 * 로그아웃 — 마이페이지 프로필 줄 오른쪽 끝.
 *
 * ⚠️ **나갈 문이 없으면 안 된다.** 로그인이 붙기 전에는 나갈 데도 없어서 이 버튼이 없었는데,
 *    세션이 붙은 지금은 한번 들어오면 쿠키가 만료될 때까지 못 나간다 — 공용 PC에서 특히 나쁘다.
 * ⚠️ 확인 창을 띄우지 않는다. 되돌릴 수 없는 일이 아니라 **다시 로그인하면 그만**이다 —
 *    무게가 다른 일에 같은 창을 쓰면 진짜 위험한 창이 가벼워진다(§DECISIONS 확인창).
 * ⚠️ `<form action={서버액션}>`이라 JS가 아직 안 붙은 순간에도 눌린다.
 */
export function LogoutButton() {
  return (
    <form action={logoutAction}>
      <SubmitButton />
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="border-border text-muted-foreground hover:text-foreground hover:bg-secondary focus-visible:ring-ring flex h-8 items-center gap-1.5 rounded-md border px-3 text-[12px] leading-4 transition-colors focus-visible:ring-2 focus-visible:outline-hidden disabled:opacity-60"
    >
      <LogOut className="size-3.5" aria-hidden />
      {/* ⚠️ 라벨에 1px 보정을 넣지 않는다 — `items-center`가 이미 맞춘다(2026-08-09 실측) */}
      {pending ? "로그아웃 중" : "로그아웃"}
    </button>
  );
}
