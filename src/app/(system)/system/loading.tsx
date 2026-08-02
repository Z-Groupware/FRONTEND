import { Skeleton } from "@/components/ui/skeleton";

/** 대시보드를 불러오는 동안. 실제 화면과 같은 골격이라 레이아웃이 흔들리지 않는다. */
export default function Loading() {
  return (
    <main className="min-h-0 flex-1 overflow-y-auto p-8">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-6">
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-[104px] rounded-xl" />
          ))}
        </div>

        <div className="flex gap-4">
          <Skeleton className="h-[360px] flex-1 rounded-xl" />
          <Skeleton className="h-[360px] w-[300px] shrink-0 rounded-xl" />
        </div>

        <Skeleton className="h-[320px] rounded-xl" />
      </div>
    </main>
  );
}
