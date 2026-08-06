import { Skeleton } from "@/components/ui/skeleton";

/** 대시보드를 불러오는 동안. 실제 화면과 같은 골격이라 레이아웃이 흔들리지 않는다. */
export default function Loading() {
  return (
    <main className="min-h-0 flex-1 overflow-y-auto px-8 py-7">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-7">
        <Skeleton className="h-[132px] rounded-2xl" />

        <div className="flex gap-4">
          <Skeleton className="h-[360px] flex-1 rounded-2xl" />
          <Skeleton className="h-[360px] w-[300px] shrink-0 rounded-2xl" />
        </div>

        <Skeleton className="h-[320px] rounded-2xl" />
      </div>
    </main>
  );
}
