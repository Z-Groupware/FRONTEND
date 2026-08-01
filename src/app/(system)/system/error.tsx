"use client";

import { RotateCw } from "lucide-react";

import { Button } from "@/components/ui/button";

/** 대시보드를 불러오지 못했을 때. 조용히 빈 화면을 보여주지 않는다(CLAUDE.md: 정직성). */
export default function Error({ reset }: { reset: () => void }) {
  return (
    <main className="flex min-h-0 flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="flex flex-col gap-2">
        <h1 className="text-lg font-semibold tracking-tight">대시보드를 불러오지 못했어요</h1>
        <p className="text-muted-foreground text-[13px] leading-[21px]">
          잠시 후 다시 시도해 주세요. 계속 안 되면 담당자에게 알려주세요.
        </p>
      </div>
      <Button type="button" onClick={reset}>
        <RotateCw />
        다시 시도
      </Button>
    </main>
  );
}
