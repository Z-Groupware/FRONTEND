import { ZLogo } from "@/components/icons/z-logo";

/**
 * 제품 화면 축소판.
 *
 * ⚠️ 스크린샷 이미지를 넣지 않는다 — 화면이 바뀌면 같이 낡고, 다크모드도 따라오지 못한다.
 *    같은 토큰으로 그린 축소판이라 테마가 바뀌면 함께 바뀐다.
 */
const MEETINGS = [
  { title: "스프린트 킥오프", team: "제품팀", when: "오늘 14:00" },
  { title: "Q3 전략 회의", team: "경영진", when: "어제 10:00" },
  { title: "디자인 리뷰", team: "UX팀", when: "월요일" },
] as const;

const STATS = [
  { label: "이번 달 회의", value: "24건" },
  { label: "완료 액션", value: "87%" },
  { label: "대기 인수인계", value: "2건" },
] as const;

export function AppPreview() {
  return (
    <div className="border-border bg-card overflow-hidden rounded-xl border shadow-2xl" aria-hidden>
      {/* 브라우저 껍데기 — 실제 화면처럼 보이게 하는 최소한만 */}
      <div className="border-border bg-secondary flex items-center gap-2.5 border-b px-3 py-2.5">
        <span className="flex gap-1.5">
          {[0, 1, 2].map((dot) => (
            <span key={dot} className="bg-border size-[9px] rounded-full" />
          ))}
        </span>
        <span className="border-border bg-card text-muted-foreground/70 flex-1 rounded border px-2 py-0.5 text-[10px] leading-4">
          app.getz.kr
        </span>
      </div>

      <div className="flex min-h-[300px]">
        <div className="border-border bg-secondary/60 hidden w-[110px] shrink-0 flex-col gap-1 border-r p-2.5 sm:flex">
          <span className="flex items-center gap-1.5 px-1.5 pb-2">
            <ZLogo className="text-foreground size-3" />
            <span className="text-[10px] leading-4">Z</span>
          </span>
          <span className="bg-foreground text-background rounded px-2 py-1 text-[10px] leading-4">
            대시보드
          </span>
          {["프로젝트", "보드", "회의"].map((item) => (
            <span key={item} className="text-muted-foreground px-2 py-1 text-[10px] leading-4">
              {item}
            </span>
          ))}
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-3 p-3.5">
          <div className="grid grid-cols-3 gap-2">
            {STATS.map((stat) => (
              <div key={stat.label} className="border-border rounded-md border p-2">
                <p className="text-muted-foreground/70 text-[9px] leading-[13px]">{stat.label}</p>
                <p className="pt-0.5 text-[13px] leading-[19px] font-semibold tabular-nums">
                  {stat.value}
                </p>
              </div>
            ))}
          </div>

          <div className="border-border overflow-hidden rounded-md border">
            <p className="border-border bg-secondary text-muted-foreground/70 border-b px-2.5 py-1.5 text-[9px] leading-[13px] tracking-[0.9px] uppercase">
              최근 회의
            </p>
            {MEETINGS.map((meeting, index) => (
              <div
                key={meeting.title}
                className={
                  index > 0
                    ? "border-border/60 flex items-center gap-2 border-t px-2.5 py-2"
                    : "flex items-center gap-2 px-2.5 py-2"
                }
              >
                <span className="bg-foreground/40 size-[5px] shrink-0 rounded-full" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[10px] leading-[15px]">{meeting.title}</span>
                  <span className="text-muted-foreground/70 block text-[9px] leading-[13px]">
                    {meeting.team}
                  </span>
                </span>
                <span className="text-muted-foreground/70 shrink-0 text-[9px] leading-[13px]">
                  {meeting.when}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
