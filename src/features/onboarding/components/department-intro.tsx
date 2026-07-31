import { type DepartmentNode, ONBOARDING_STEP } from "../types";
import { DepartmentPreview } from "./department-preview";
import { StepHeading } from "./step-heading";
import { StepHintList } from "./step-hint-list";

const BENEFITS = [
  "회의를 만들 때 부서 전체를 한 번에 초대",
  "인수인계 대상자를 부서 기준으로 추리기",
  "부서별 활동 통계 자동 집계",
] as const;

/** 온보딩 1단계 좌측 — 설명과 축약 미리보기. */
export function DepartmentIntro({ departments }: { departments: DepartmentNode[] }) {
  return (
    <section className="flex w-full flex-col gap-[17.5px] lg:h-full lg:w-[300px] lg:shrink-0">
      <StepHeading step={ONBOARDING_STEP.DEPARTMENT} title="부서 체계를 만들어 주세요">
        회의 참석자, 알림 대상, 인수인계 범위를 부서 단위로 관리해요. 지금 만들어 두면 사원이 합류할
        때 바로 배정할 수 있습니다.
      </StepHeading>

      <StepHintList items={BENEFITS} />

      <div className="border-border bg-background/80 text-muted-foreground/70 flex flex-col gap-1.5 rounded-md border p-[10.5px] text-[11px] leading-[18px]">
        <p>이름을 더블클릭하면 바꿀 수 있어요. 나중에 설정에서 언제든 수정할 수 있습니다.</p>
        <p>
          부서는 <span className="text-muted-foreground">상위 · 하위 2단계</span>까지 만들 수
          있어요.
        </p>
        <p>
          손잡이를 끌면 순서를 바꾸거나{" "}
          <span className="text-muted-foreground">다른 상위 부서로 옮길</span> 수 있어요.
        </p>
        <p>
          <span className="text-muted-foreground">하위 부서가 있는 곳은 묶음</span>이라 사원이 직접
          소속되지 않아요. 사원은 가장 아래 부서에 배정됩니다.
        </p>
      </div>

      <DepartmentPreview departments={departments} />
    </section>
  );
}
