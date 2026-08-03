import { POSITION_ROLES, ROLE_LABEL, ROLE_SCOPE_LABEL } from "@/constants/domain";

import { MAX_ORG_NAME_LENGTH, ONBOARDING_STEP, type Position } from "../types";
import { PositionPreview } from "./position-preview";
import { StepHeading } from "./step-heading";
import { StepHintList } from "./step-hint-list";

/*
  ⚠️ **여기서 고를 수 있는 것만** 적는다(`POSITION_ROLES`). 예전엔 Owner까지 보여 줬는데
     정작 드롭다운에는 없어서, 읽은 사람이 목록에서 Owner를 찾다가 못 찾는다.
     Owner는 아래 안내 상자에서 "여기서 정하지 않는다"고 따로 말한다.
*/
const ROLE_HINTS = POSITION_ROLES.map((role) => `${ROLE_LABEL[role]}: ${ROLE_SCOPE_LABEL[role]}`);

/** 온보딩 2단계 좌측 — 설명과 축약 미리보기. */
interface PositionIntroProps {
  positions: Position[];
}

export function PositionIntro({ positions }: PositionIntroProps) {
  return (
    <section className="flex w-full flex-col gap-[17.5px] lg:h-full lg:w-[300px] lg:shrink-0">
      <StepHeading step={ONBOARDING_STEP.POSITION} title="직급 체계를 설정해 주세요">
        회사에서 쓰는 직급을 적고, 그 직급이 갖는 권한을 골라요. 나중에 사원마다 따로 바꿀 수
        있어요.
      </StepHeading>

      <StepHintList items={ROLE_HINTS} />

      <div className="border-border bg-background/80 text-muted-foreground/70 flex flex-col gap-1.5 rounded-md border p-[10.5px] text-[11px] leading-[18px]">
        <p>
          직급명은 회사에서 쓰는 말 그대로{" "}
          <span className="text-muted-foreground">{MAX_ORG_NAME_LENGTH}자까지</span> 적으면 돼요.
          이름과 권한은 별개라{" "}
          <span className="text-muted-foreground">&lsquo;과장&rsquo;에 Leader를 줘도</span> 됩니다.
        </p>
        <p>
          <span className="text-muted-foreground">Owner</span>는 목록에 없어요. 기업 등록이 승인되면
          시스템이 계정을 만들어 대표 메일로 보내 드려요.
        </p>
        {/*
          ⚠️ 전에는 "두 권한이 필요하면 계정을 따로 쓴다"고 안내했다. **더 이상 아니다** —
             Admin은 역할이 아니라 겸직 권한이라 한 계정이 Leader이면서 Admin일 수 있다.
             낡은 안내를 남겨 두면 대표가 계정을 두 개 만들어 놓고 시작한다.
        */}
        <p>
          <span className="text-muted-foreground">Admin</span>도 직급이 아니라 사람에게 붙는
          권한이에요. 다음 단계에서 초대할 때 켜면 됩니다 — 한 사람이 Leader이면서 Admin일 수
          있어요.
        </p>
      </div>

      <PositionPreview positions={positions} />
    </section>
  );
}
