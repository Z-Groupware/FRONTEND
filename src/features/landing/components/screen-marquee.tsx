import { ZLogo } from "@/components/icons/z-logo";

/** 실제로 있는 화면만 적는다 — 없는 걸 흘려보내면 그게 거짓말이 된다(§정직성). */
const SCREENS = ["온보딩", "요금제", "구독·결제", "대시보드", "회의", "보드", "인수인계"] as const;

/**
 * 화면 이름이 옆으로 흐르는 띠.
 *
 * ⚠️ 같은 목록을 **두 벌** 이어 붙인다. 한 벌만 두면 `-50%`에서 빈 자리가 생겨 끊겨 보인다.
 */
export function ScreenMarquee() {
  return (
    <div className="bg-landing-dark border-landing-dark-border overflow-hidden border-y py-5">
      {/* 양 끝을 흐리게 지워 띠가 화면 밖으로 이어지는 것처럼 보이게 한다 */}
      <div className="relative [mask-image:linear-gradient(90deg,transparent,black_10%,black_90%,transparent)]">
        <div className="animate-marquee flex w-max gap-3">
          {[0, 1].map((copy) => (
            <div key={copy} className="flex shrink-0 gap-3" aria-hidden={copy === 1}>
              {SCREENS.map((screen) => (
                <span
                  key={screen}
                  className="border-landing-dark-border bg-landing-dark-surface text-landing-dark-muted flex items-center gap-2 rounded-full border px-4 py-2 text-[13px] leading-5 whitespace-nowrap"
                >
                  <ZLogo className="size-3 shrink-0 opacity-60" />
                  {screen}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
