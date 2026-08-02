import { Check } from "lucide-react";

import { ZLogo } from "@/components/icons/z-logo";

/**
 * 제품 화면 축소판 — 히어로 오른쪽.
 *
 * ⚠️ 스크린샷 이미지를 넣지 않는다 — 화면이 바뀌면 같이 낡고, 다크모드도 따라오지 못한다.
 *    같은 토큰으로 그린 축소판이라 테마가 바뀌면 함께 바뀐다.
 * ⚠️ 수치·회의점 색은 랜딩 정체성 표현이다 — 상태색 규칙(§디자인 토큰)의 랜딩 예외.
 * 좌상단·우하단에 알림 카드가 **떠 있고 살랑인다**(`float`) — 시안의 디테일이다.
 */
const MEETINGS = [
  { title: "스프린트 킥오프", team: "제품팀", when: "오늘 14:00", color: "#22c55e" },
  { title: "Q3 전략 회의", team: "경영진", when: "어제 10:00", color: "#3b82f6" },
  { title: "디자인 리뷰", team: "UX팀", when: "월요일", color: "#8b5cf6" },
] as const;

const STATS = [
  { label: "이번 달 회의", value: "24건", color: "#3b82f6" },
  { label: "완료 액션", value: "87%", color: "#22c55e" },
  { label: "대기 인수인계", value: "2건", color: "#f59e0b" },
] as const;

export function AppPreview() {
  return (
    <div className="relative" aria-hidden>
      {/* 좌상단 — AI 요약이 끝났다는 알림. 프레임 밖으로 살짝 걸쳐 떠 있다 */}
      <div className="border-border bg-card animate-float absolute -top-7 -left-4 z-10 rounded-xl border px-4 py-3 shadow-lg lg:-left-8">
        <p className="flex items-center gap-1.5 text-[12px] leading-[18px] font-semibold">
          <Check className="size-3.5" strokeWidth={3} aria-hidden />
          AI 요약 완료
        </p>
        <p className="text-muted-foreground pt-0.5 text-[11px] leading-4">
          스프린트 킥오프 · 방금 전
        </p>
      </div>

      {/* 우하단 — 배정된 액션 카드. 반대 박자로 살랑이게 지연을 준다 */}
      <div className="border-border bg-card animate-float absolute -right-4 -bottom-6 z-10 rounded-xl border px-4 py-3 shadow-lg [animation-delay:-2s] lg:-right-8">
        <p className="text-[11px] leading-4 font-semibold text-[#3b82f6]">액션</p>
        <p className="pt-0.5 text-[12px] leading-[18px] font-medium">와이어프레임 작성</p>
        <p className="text-muted-foreground pt-0.5 text-[11px] leading-4">디자인 담당 · 8/5</p>
      </div>

      {/*
        둘레를 도는 그라데이션 링.
        ⚠️ 프레임 자신에게 걸면 안 된다 — 안쪽 배경이 반투명이라 링이 카드 속으로 비친다.
           래퍼가 링을 그리고, **불투명한 프레임이 안을 덮어** 테두리 1.5px만 남는다.
      */}
      <div className="glow-ring rounded-xl">
        {/* 앱 창은 불투명 표면(--popover) — 반투명이면 뒤 광선이 내용을 관통한다 */}
        <div className="border-border bg-popover overflow-hidden rounded-xl border shadow-2xl">
          {/* 브라우저 껍데기 — 실제 화면처럼 보이게 하는 최소한만 */}
          <div className="border-border bg-secondary flex items-center gap-2.5 border-b px-3 py-2.5">
            <span className="flex gap-1.5">
              {["#ef4444", "#f59e0b", "#22c55e"].map((color) => (
                <span
                  key={color}
                  className="size-[9px] rounded-full"
                  style={{ backgroundColor: color }}
                />
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
              <p className="text-[12px] leading-[18px] font-semibold">대시보드</p>

              <div className="grid grid-cols-3 gap-2">
                {STATS.map((stat) => (
                  <div key={stat.label} className="border-border rounded-md border p-2">
                    <p className="text-muted-foreground/70 text-[9px] leading-[13px]">
                      {stat.label}
                    </p>
                    <p
                      className="pt-0.5 text-[13px] leading-[19px] font-semibold tabular-nums"
                      style={{ color: stat.color }}
                    >
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
                    <span
                      className="size-[5px] shrink-0 rounded-full"
                      style={{ backgroundColor: meeting.color }}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[10px] leading-[15px]">
                        {meeting.title}
                      </span>
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
      </div>
    </div>
  );
}
