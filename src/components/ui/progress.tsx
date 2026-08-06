import { Progress as ProgressPrimitive } from "@base-ui/react/progress"
import type { ComponentProps } from "react"

import { cn } from "@/lib/utils"

/**
 * 진척 바. base-ui `Progress`라 값(0~100)에 맞춰 인디케이터 폭이 자동으로 잡힌다.
 * ⚠️ 트랙 폭은 부르는 쪽이 정한다(`className`으로 `w-32` 등) — 화면마다 길이가 다르다.
 */
function Progress({ className, value, ...props }: ComponentProps<typeof ProgressPrimitive.Root>) {
  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      value={value}
      className={cn("w-full", className)}
      {...props}
    >
      <ProgressPrimitive.Track className="bg-muted relative h-1.5 w-full overflow-hidden rounded-full">
        <ProgressPrimitive.Indicator className="bg-foreground h-full rounded-full transition-all" />
      </ProgressPrimitive.Track>
    </ProgressPrimitive.Root>
  )
}

export { Progress }
