import { ThemeToggle } from "@/components/common/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

/** ⚠️ 임시 플레이스홀더 — 랜딩 화면은 디자인 확정 후 교체한다(DECISIONS: 화면(디자인) 확정). */
export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="border-border flex h-14 items-center justify-between border-b px-8">
        <span className="text-base font-semibold">Z</span>
        <ThemeToggle />
      </header>

      <main className="mx-auto flex w-full max-w-[960px] flex-1 flex-col justify-center gap-8 px-8 py-20">
        <div className="flex flex-col gap-3">
          <Badge variant="secondary">디자인 확정 전 임시 화면</Badge>
          <h1 className="text-3xl font-semibold tracking-tight">회의 기반 지식관리, Z</h1>
          <p className="text-muted-foreground max-w-md text-base">
            회의를 캡처하면 요약·결정·액션을 뽑아 담당자에게 전달해요.
          </p>
        </div>

        {/* 토큰이 라이트/다크 양쪽에서 제대로 뒤집히는지 눈으로 확인하는 용도 */}
        <section className="flex flex-col gap-3">
          <h2 className="text-muted-foreground text-sm font-medium">디자인 토큰 확인</h2>
          <div className="flex flex-wrap items-center gap-3">
            <Button>기본</Button>
            <Button variant="outline">아웃라인</Button>
            <Button variant="ghost">고스트</Button>
          </div>
          <div className="bg-card border-border flex flex-col gap-2 rounded-lg border p-5">
            <p className="text-sm">카드 배경 · 보더 · 본문 텍스트</p>
            <p className="text-muted-foreground text-sm">보조 텍스트</p>
            <div className="flex items-center gap-4 pt-1 text-sm">
              <span className="flex items-center gap-2">
                <span className="bg-status-todo size-2 rounded-full" aria-hidden />
                대기
              </span>
              <span className="flex items-center gap-2">
                <span className="bg-status-progress size-2 rounded-full" aria-hidden />
                진행중
              </span>
              <span className="flex items-center gap-2">
                <span className="bg-status-done size-2 rounded-full" aria-hidden />
                완료
              </span>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
