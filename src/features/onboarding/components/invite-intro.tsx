import type { Invite } from "../types";
import { INVITE_LINK_VALID_DAYS, ONBOARDING_STEP } from "../types";
import { InvitePreview } from "./invite-preview";
import type { SelectOption } from "./option-select";
import { StepHeading } from "./step-heading";
import { StepHintList } from "./step-hint-list";

const BENEFITS = [
  "초대 링크로 본인이 계정을 만들어요",
  "부서·역할·직급을 미리 지정해서 보낼 수 있어요",
  "나중에 기업 설정에서 추가로 초대할 수 있어요",
] as const;

interface InviteIntroProps {
  /** 보낸 줄 + 이번에 보낼 줄 */
  invites: Invite[];
  departments: SelectOption[];
  rolesOf: (departmentId: string) => SelectOption[];
  positions: SelectOption[];
}

/** 온보딩 3단계 좌측 — 설명과 축약 미리보기. */
export function InviteIntro({ invites, departments, rolesOf, positions }: InviteIntroProps) {
  return (
    <section className="flex w-full flex-col gap-[17.5px] lg:h-full lg:w-[300px] lg:shrink-0">
      <StepHeading step={ONBOARDING_STEP.INVITE} title="사원을 초대하세요">
        이메일로 초대장을 발송합니다. 초대받은 사람이 링크를 통해 계정을 만들면 자동으로 해당
        부서·역할·직급으로 배정됩니다.
      </StepHeading>

      <StepHintList items={BENEFITS} />

      <div className="border-border bg-background/80 text-muted-foreground/70 flex flex-col gap-1.5 rounded-md border p-[10.5px] text-[11px] leading-[18px]">
        <p>
          초대 링크는 발송 후{" "}
          <span className="text-muted-foreground">{INVITE_LINK_VALID_DAYS}일 동안</span> 유효해요.
        </p>
        <p>
          <span className="text-muted-foreground">역할은 부서를 고른 뒤</span> 정할 수 있어요.
          팀장처럼 역할 없이 부서에만 두려면 &lsquo;없음&rsquo;을 고릅니다.
        </p>
        <p>
          직급은 <span className="text-muted-foreground">2단계에서 만든 것</span>만 고를 수 있어요.
          더 필요하면 이전 단계에서 추가해 주세요.
        </p>
        <p>
          <span className="text-muted-foreground">보낸 초대장은 고치거나 취소할 수 없어요.</span>{" "}
          주소를 한 번 더 확인하고 보내주세요.
        </p>
      </div>

      <InvitePreview
        invites={invites}
        departments={departments}
        rolesOf={rolesOf}
        positions={positions}
      />
    </section>
  );
}
