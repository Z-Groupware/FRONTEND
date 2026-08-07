import { Skeleton } from "@/components/ui/skeleton";

/** 본문과 같은 골격 — 주 컬럼(메타·산출물·기록) + 곁 컬럼(참석자)(§DESIGN 4) */
export default function Loading() {
  return (
    <main className="min-h-0 flex-1 overflow-y-auto px-8 py-7">
      <div className="mx-auto grid w-full max-w-[1440px] grid-cols-1 gap-7 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="flex min-w-0 flex-col gap-7">
          <Skeleton className="h-[180px] rounded-2xl" />
          <Skeleton className="h-[220px] rounded-2xl" />
          <Skeleton className="h-[260px] rounded-2xl" />
        </div>
        <div className="flex flex-col gap-7">
          <Skeleton className="h-[220px] rounded-2xl" />
        </div>
      </div>
    </main>
  );
}
