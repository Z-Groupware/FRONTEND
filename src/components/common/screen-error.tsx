"use client";

import { RotateCw } from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 * 화면을 못 불러왔을 때 쓰는 공용 오류 화면.
 *
 * ⚠️ 조용히 빈 화면을 보여주지 않는다(CLAUDE.md §정직성). 무엇을 못 불러왔는지 말하고
 *    다시 시도할 길을 준다.
 * ⚠️ 여기서는 셸을 쓰지 않는다. 셸이 터졌을 수도 있어서 이 화면만은 아무것에도 기대지 않는다.
 * ⚠️ `console`은 커밋 금지다 — 오류 수집 경로가 정해지면 그때 붙인다.
 */
interface ScreenErrorProps {
  /** 무엇을 못 불러왔는지 — 화면마다 다르다 */
  title: string;
  reset: () => void;
}

export function ScreenError({ title, reset }: ScreenErrorProps) {
  return (
    <div className="bg-background flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="flex flex-col gap-2">
        <h1 className="text-lg font-semibold tracking-tight break-keep">{title}</h1>
        <p className="text-muted-foreground text-[13px] leading-[21px] break-keep">
          잠시 후 다시 시도해 주세요. 계속 안 되면 담당자에게 알려주세요.
        </p>
      </div>
      <Button type="button" onClick={reset}>
        <RotateCw />
        다시 시도
      </Button>
    </div>
  );
}
