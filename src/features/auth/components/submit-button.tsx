"use client";

import { Loader2 } from "lucide-react";
import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";

/**
 * 폼 제출 버튼 — 보내는 동안 스스로 잠긴다.
 *
 * ⚠️ `useFormStatus`는 **폼 안의 자식**에서만 값을 읽는다. 그래서 버튼을 따로 컴포넌트로 뺀다 —
 *    폼과 같은 컴포넌트에 두면 항상 `pending: false`다.
 * ⚠️ 두 번 눌리는 걸 막는 게 핵심이다. 신청이 두 벌 들어가면 승인 담당자가 헷갈린다.
 * ⚠️ 랜딩과 같은 먹색 버튼이다 — 기본 variant는 파랑(액센트)이라 여기만 튄다.
 */
export function SubmitButton({ children }: { children: ReactNode }) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      disabled={pending}
      className="bg-foreground text-background hover:bg-foreground/90 h-12 gap-1.5 text-[15px]"
    >
      {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : children}
    </Button>
  );
}
