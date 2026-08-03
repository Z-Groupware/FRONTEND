import { ASSIGNABLE_ROLES, ROLE_LABEL, ROLE_SCOPE_LABEL } from "@/constants/domain";

import { ONBOARDING_STEP, type Position } from "../types";
import { PositionPreview } from "./position-preview";
import { StepHeading } from "./step-heading";
import { StepHintList } from "./step-hint-list";

const ROLE_HINTS = ASSIGNABLE_ROLES.map((role) => `${ROLE_LABEL[role]}: ${ROLE_SCOPE_LABEL[role]}`);

/** 온보딩 2단계 좌측 — 설명과 축약 미리보기. */
export function PositionIntro({ positions }: { positions: Position[] }) {
  return (
    <section className="flex w-full flex-col gap-[17.5px] lg:h-full lg:w-[300px] lg:shrink-0">
      <StepHeading step={ONBOARDING_STEP.POSITION} title="직급 체계를 설정해 주세요">
        직급마다 Z 내 권한 수준을 지정해요. 나중에 사원 프로필에서 개별 조정할 수 있습니다.
      </StepHeading>

      <StepHintList items={ROLE_HINTS} />

      <div className="border-border bg-background/80 text-muted-foreground/70 flex flex-col gap-1.5 rounded-md border p-[10.5px] text-[11px] leading-[18px]">
        <p>직급명은 회사마다 다르게 쓰세요. 권한은 직급명과 무관하게 직접 지정합니다.</p>
        <p>
          <span className="text-muted-foreground">Owner 계정</span>은 기업 승인 때 시스템이 발급해
          대표 메일로 보내드려요. 여기서는 지정하지 않습니다.
        </p>
        {/*
          ⚠️ 전에는 "두 권한이 필요하면 계정을 따로 쓴다"고 안내했다. **더 이상 아니다** —
             Admin은 역할이 아니라 겸직 권한이라 한 계정이 Leader이면서 Admin일 수 있다.
             낡은 안내를 남겨 두면 대표가 계정을 두 개 만들어 놓고 시작한다.
        */}
        <p>
          <span className="text-muted-foreground">Admin</span>은 직급이 아니라 사람에게 붙는
          권한이라 여기서 정하지 않아요. 사원이 들어온 뒤 대표가 켜 주면 됩니다 — 계정을 따로 만들지
          않아도 한 사람이 Leader이면서 Admin일 수 있어요.
        </p>
      </div>

      <PositionPreview positions={positions} />
    </section>
  );
}
