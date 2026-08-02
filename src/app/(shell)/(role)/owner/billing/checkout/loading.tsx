import { Skeleton } from "@/components/ui/skeleton";

/** 결제 화면을 불러오는 동안 — 좌 요약 · 우 결제 두 칸 골격을 미리 잡는다. */
export default function Loading() {
  return (
    <div className="mx-auto flex w-full max-w-[960px] flex-col gap-7 px-8 py-10">
      <Skeleton className="h-9 w-[200px] rounded-lg" />
      <div className="flex flex-col gap-6 lg:flex-row">
        <Skeleton className="h-[420px] flex-1 rounded-xl" />
        <Skeleton className="h-[420px] w-full rounded-xl lg:w-[340px] lg:shrink-0" />
      </div>
    </div>
  );
}
