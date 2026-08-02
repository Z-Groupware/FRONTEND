/**
 * "Z가 하는 것들" — 기능 이름이 옆으로 흐르는 띠.
 *
 * 화면 이름(회의·보드…)을 흘렸더니 맥락 없이 단어만 지나가 심심했다.
 * 제품이 **해주는 일**을 흘려야 처음 온 사람에게 문장이 된다.
 *
 * ⚠️ **명세에 있는 것만** 적는다(§AI 기능·§정직성) — 화자 구분·모바일 앱은 없다.
 *    자막은 브라우저 STT라 "AI"를 붙이지 않는다.
 * ⚠️ 반 벌의 폭이 화면 폭보다 넓어야 한다 — 좁으면 지나간 뒤 빈 검정만 남는다.
 *    전체는 두 벌(-50% 루프) 구조다. 한 벌만 두면 이음새가 끊겨 보인다.
 */
const CAPABILITIES = [
  "회의 자동 녹음",
  "실시간 자막",
  "회의 3줄 요약",
  "핵심 결정 추출",
  "AI 액션 분배",
  "담당자 하달",
  "프로젝트 자동 매칭",
  "인수인계 자동 취합",
  "역할별 접근 관리",
  "칸반 보드",
  "회의실 예약",
] as const;

/** 알약 앞 색 점 — 파랑·보라·초록을 돌려가며 찍는다 */
const DOT_COLORS = ["#3b82f6", "#8b5cf6", "#22c55e"] as const;

export function ScreenMarquee() {
  return (
    /* ⚠️ 배경을 칠하지 않는다 — 배경은 `LandingBackdrop` 한 장이 전담한다 */
    <div className="overflow-hidden py-6">
      <p className="text-landing-dark-muted pb-4 text-center text-[11px] leading-4 font-semibold tracking-[1.65px] uppercase">
        Z가 하는 것들
      </p>

      {/* 양 끝을 흐리게 지워 띠가 화면 밖으로 이어지는 것처럼 보이게 한다 */}
      <div className="relative [mask-image:linear-gradient(90deg,transparent,black_3%,black_97%,transparent)]">
        {/*
          ⚠️ 바깥 컨테이너에 `gap`을 주면 안 된다. 애니메이션이 `-50%`만큼 미는데
             전체 폭이 `A + gap + A`라서 절반은 `A + gap/2`가 된다 — 한 바퀴마다
             `gap/2`씩 어긋나 이음매에 빈 틈이 보인다.
             간격은 **각 벌 안쪽**(`gap-3 pr-3`)에서만 준다. 그래야 절반이 정확히 한 벌이다.
        */}
        <div className="animate-marquee flex w-max hover:[animation-play-state:paused]">
          {[0, 1].map((copy) => (
            <div key={copy} className="flex shrink-0 gap-3 pr-3" aria-hidden={copy === 1}>
              {CAPABILITIES.map((capability, index) => (
                <span
                  key={capability}
                  className="border-landing-dark-border bg-landing-dark-surface text-landing-dark-foreground/80 flex items-center gap-2 rounded-full border px-4 py-2 text-[13px] leading-5 whitespace-nowrap"
                >
                  <span
                    aria-hidden
                    className="size-[5px] shrink-0 rounded-full"
                    style={{ backgroundColor: DOT_COLORS[index % DOT_COLORS.length] }}
                  />
                  {capability}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
