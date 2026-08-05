"use client";

import { RotateCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * 화면을 못 불러왔을 때 쓰는 공용 오류 화면.
 *
 * ⚠️ 조용히 빈 화면을 보여주지 않는다(CLAUDE.md §정직성). 무엇을 못 불러왔는지 말하고
 *    다시 시도할 길을 준다.
 * ⚠️ 여기서는 셸을 **그리지** 않는다. 셸이 터졌을 수도 있어서 이 화면만은 아무것에도 기대지 않는다.
 *    다만 셸 **안**에서 뜰 수는 있다(라우트가 셸 아래면 상단바가 그대로 남는다) —
 *    그때는 `isInsideShell`로 높이를 바꾼다.
 * ⚠️ `console`은 커밋 금지다 — 오류 수집 경로가 정해지면 그때 붙인다.
 */
interface ScreenErrorProps {
  /** 무엇을 못 불러왔는지 — 화면마다 다르다 */
  title: string;
  reset: () => void;
  /**
   * 셸(사이드바·상단바) **안**에서 뜨는 오류인지.
   *
   * ⚠️ 켜면 화면 전체가 아니라 **남은 높이**를 채운다. 셸 본문은 `h-dvh overflow-hidden`인데
   *    그 안에서 상단바(56px) 다음에 `min-h-dvh`를 두면 `56 + 100dvh`가 되어
   *    **아래 56px이 잘리고**(스크롤도 안 된다) 카드가 그만큼 아래로 밀린다.
   * ⚠️ 셸 밖(온보딩·`/subscription`·public)에서는 **끈 채로 둔다.** 거기서는 이 화면이
   *    페이지를 통째로 대체하고 위에 상시 상단바가 없어서 `min-h-dvh`가 맞다.
   * ⚠️ **`(shell)`뿐 아니라 `(system)`도 셸이다.** 두 레이아웃 다 `flex h-dvh overflow-hidden`에
   *    `PageHeader`(56px)를 얹는 같은 구조라, 라우트 그룹 이름이 아니라 **위에 상단바가 남는지**로
   *    판단한다. 그룹 이름으로 외우면 셸이 하나 더 생길 때 똑같이 잘린다.
   */
  isInsideShell?: boolean;
}

export function ScreenError({ title, reset, isInsideShell }: ScreenErrorProps) {
  /*
    ⚠️ 셸 안에서는 **`h1`을 쓰지 않는다.** 위에 `PageHeader`의 `h1`이 그대로 남아 있어서
       여기서 또 `h1`을 그리면 한 페이지에 제목이 둘이 된다 — 스크린 리더는 무엇이 이 화면의
       제목인지 못 가리고, RTL `getByRole("heading", { level: 1 })`도 복수 매치로 깨진다
       (CLAUDE.md §SEO — h1 1개).
    ⚠️ 셸 밖에서는 이 화면이 페이지를 통째로 대체하므로 `h1`이 맞다.
  */
  const Heading = isInsideShell ? "h2" : "h1";

  return (
    <div
      className={cn(
        "bg-background flex flex-col items-center justify-center gap-4 px-6 text-center",
        // `min-h-0`이 있어야 flex 자식이 부모보다 커지지 않는다 — 없으면 내용 높이만큼 삐져나간다
        isInsideShell ? "min-h-0 flex-1" : "min-h-dvh",
      )}
    >
      <div className="flex flex-col gap-2">
        <Heading className="text-lg font-semibold tracking-tight break-keep">{title}</Heading>
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
