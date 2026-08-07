import { Skeleton } from "@/components/ui/skeleton";

/** 본문과 같은 골격 — 탭 줄 + 카드 격자(§DESIGN 4: 다르면 로딩이 끝날 때 튄다) */
export default function Loading() {
  return (
    <main className="min-h-0 flex-1 overflow-y-auto px-8 py-7">
      <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-4">
        <Skeleton className="h-9 w-[220px] rounded-lg" />
        <div className="grid grid-cols-[repeat(auto-fill,minmax(340px,1fr))] gap-4">
          {[0, 1, 2, 3].map((card) => (
            <Skeleton key={card} className="h-[150px] rounded-2xl" />
          ))}
        </div>
      </div>
    </main>
  );
}
