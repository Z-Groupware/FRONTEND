import { Skeleton } from "@/components/ui/skeleton";

/**
 * ⚠️ **본문과 같은 골격**으로 그린다 — 폭(1440)·카드 여백(`px-7`)·팀 칸 폭(300)·마디 높이가
 *    본문과 같아야 로딩이 끝날 때 화면이 안 튄다(§DESIGN 4).
 * ⚠️ 팀 수는 미리 알 수 없다. 목의 회사가 네 팀이라 네 칸으로 두되, **연결선까지 그린다** —
 *    선이 로딩에만 없으면 본문으로 넘어갈 때 팀 칸이 통째로 아래로 밀린다.
 */

/** 사람 한 명 상자의 높이 — 아바타(32) + 위아래 여백(24) + 보더(2) */
const NODE_HEIGHT_CLASS = "h-[62px]";

const TEAM_COLUMN_CLASS = "w-[300px] shrink-0 px-3";

export default function Loading() {
  return (
    <main className="min-h-0 flex-1 overflow-y-auto px-8 py-7">
      <div className="mx-auto w-full max-w-[1440px]">
        <section className="border-border bg-card rounded-2xl border">
          <div className="flex items-baseline justify-between gap-3 px-7 pt-6 pb-3">
            <Skeleton className="h-7 w-20" />
            <Skeleton className="h-4 w-16" />
          </div>

          <div className="px-7 pt-2 pb-7">
            <div className="flex flex-col items-center">
              <div className={TEAM_COLUMN_CLASS}>
                <Skeleton className={`${NODE_HEIGHT_CLASS} rounded-xl`} />
              </div>
              <span className="bg-border h-6 w-px" aria-hidden />
            </div>

            <div className="overflow-x-auto">
              <ul className="mx-auto flex w-fit">
                {[0, 1, 2, 3].map((column) => (
                  <li
                    key={column}
                    className={`relative flex flex-col items-center ${TEAM_COLUMN_CLASS}`}
                  >
                    <span
                      className={`bg-border absolute top-0 h-px ${column === 0 ? "left-1/2" : "left-0"} ${column === 3 ? "right-1/2" : "right-0"}`}
                      aria-hidden
                    />
                    <span className="bg-border h-6 w-px" aria-hidden />

                    <div className="flex w-full flex-col gap-2">
                      <div className="flex items-baseline justify-between gap-2 px-0.5">
                        <Skeleton className="h-5 w-20" />
                        <Skeleton className="h-4 w-8" />
                      </div>
                      <Skeleton className={`${NODE_HEIGHT_CLASS} rounded-xl`} />
                      <Skeleton className={`${NODE_HEIGHT_CLASS} rounded-xl`} />
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
