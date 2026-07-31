import { Check } from "lucide-react";

/*
  ⚠️ 공용 `CheckMark`는 아직 develop에 없다(#22·#26 브랜치에만 있음).
     그게 머지되면 여기도 그걸로 바꾼다 — 지금 만들면 같은 파일이 두 벌이 된다.
*/
import { COMPARISONS, FEATURES, FLOW, PROBLEMS } from "../content";
import { DarkSection } from "./dark-section";
import { FeatureMock } from "./feature-mock";
import { Reveal } from "./reveal";

/** 섹션 제목 — 랜딩 전체가 같은 크기·간격을 쓴다. */
function SectionHeading({ label, title }: { label?: string; title: string }) {
  return (
    <div className="flex flex-col items-center gap-2.5 text-center">
      {label && (
        <p className="text-muted-foreground text-[11px] leading-4 tracking-[1.1px] uppercase">
          {label}
        </p>
      )}
      <h2 className="text-[32px] leading-[40px] font-semibold tracking-[-0.7px] break-keep lg:text-[36px] lg:leading-[44px]">
        {title}
      </h2>
    </div>
  );
}

/** 겪어본 사람이 알아볼 문제 세 가지. */
export function ProblemSection() {
  return (
    <section className="bg-secondary border-border border-b py-20 lg:py-28">
      <div className="mx-auto w-full max-w-[1144px] px-7">
        <SectionHeading title="회의는 했는데, 남는 게 없나요?" />

        <div className="grid gap-4 pt-12 md:grid-cols-3">
          {PROBLEMS.map((problem, index) => (
            <Reveal key={problem.title} delay={index * 90}>
              <div className="border-border bg-card h-full rounded-xl border p-6">
                <p className="text-[15px] leading-[22px] font-semibold">{problem.title}</p>
                <p className="text-muted-foreground pt-2 text-[13px] leading-[21px] break-keep">
                  {problem.body}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/** 회의 한 번이 어떻게 흘러가는지 — 네 단계. 검정 섹션이라 앞뒤 흰 화면 사이에서 끊어 읽힌다. */
export function FlowSection() {
  return (
    <DarkSection>
      <h2 className="text-center text-[32px] leading-[40px] font-semibold tracking-[-0.7px] break-keep lg:text-[36px] lg:leading-[44px]">
        회의부터 인수인계까지, 하나로 이어집니다
      </h2>

      <ol className="grid gap-4 pt-12 sm:grid-cols-2 lg:grid-cols-4">
        {FLOW.map((item, index) => (
          <Reveal key={item.step} delay={index * 90}>
            <li className="border-landing-dark-border bg-landing-dark-surface h-full rounded-xl border p-6 backdrop-blur">
              <p className="text-landing-dark-muted text-[11px] leading-4 tabular-nums">
                {item.step}
              </p>
              <p className="pt-2 text-[16px] leading-6 font-semibold">{item.title}</p>
              <p className="text-landing-dark-muted pt-1.5 text-[13px] leading-5 break-keep">
                {item.body}
              </p>
            </li>
          </Reveal>
        ))}
      </ol>
    </DarkSection>
  );
}

/** 기능 셋 — 좌우로 번갈아 놓아 스크롤이 단조롭지 않게 한다. */
export function FeatureSection() {
  return (
    <section className="bg-secondary border-border border-b py-20 lg:py-28">
      <div className="mx-auto w-full max-w-[1144px] px-7">
        <SectionHeading label="Z가 하는 일" title="별도 노력 없이 회의가 자산이 돼요" />

        <div className="flex flex-col gap-14 pt-14">
          {FEATURES.map((feature, index) => (
            <div
              key={feature.label}
              className={
                index % 2 === 1
                  ? "flex flex-col gap-6 lg:flex-row-reverse lg:items-center lg:gap-16"
                  : "flex flex-col gap-6 lg:flex-row lg:items-center lg:gap-16"
              }
            >
              <Reveal className="flex-1">
                <p className="text-muted-foreground text-[11px] leading-4 tracking-[1.1px] uppercase">
                  {feature.label}
                </p>
                <h3 className="pt-2 text-[28px] leading-[36px] font-semibold tracking-[-0.6px] break-keep">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground max-w-[520px] pt-3.5 text-[15px] leading-[26px] break-keep">
                  {feature.body.replaceAll("**", "")}
                </p>
              </Reveal>

              <Reveal delay={80} className="flex-1">
                <FeatureMock kind={feature.label} />
              </Reveal>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/** 지금까지 ↔ Z를 쓰면. */
export function CompareSection() {
  return (
    <section className="border-border border-b py-20 lg:py-28">
      <div className="mx-auto w-full max-w-[1144px] px-7">
        <SectionHeading title="지금까지와 달라요" />

        <div className="mx-auto max-w-[700px] pt-12">
          <div className="text-muted-foreground grid grid-cols-2 gap-4 pb-3.5 text-center text-[13px] leading-5">
            <span>지금까지</span>
            <span className="text-foreground">Z를 쓰면</span>
          </div>

          {COMPARISONS.map((row) => (
            <div
              key={row.before}
              className="border-border grid grid-cols-2 items-center gap-4 border-t py-3.5"
            >
              <span className="text-muted-foreground/70 text-center text-[14px] leading-[21px] break-keep line-through">
                {row.before}
              </span>
              <span className="flex items-center justify-center gap-2 text-[14px] leading-[21px] break-keep">
                <Check
                  className="text-foreground size-3.5 shrink-0"
                  strokeWidth={2.5}
                  aria-hidden
                />
                {row.after}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
