import { Skeleton } from "@/components/ui/skeleton";

/** 구독 상태를 불러오는 동안 — 실제 화면과 같은 골격이라 레이아웃이 흔들리지 않는다. */
export default function Loading() {
  return (
    <div className="bg-background bg-dot-grid min-h-screen-z flex flex-col">
      <div className="border-border h-[52px] shrink-0 border-b" />
      <div className="mx-auto flex w-full max-w-[1120px] flex-col gap-[21px] px-[21px] py-6 lg:py-10">
        <div className="flex flex-col gap-[7px]">
          <Skeleton className="h-[30px] w-64" />
          <Skeleton className="h-5 w-80 max-w-full" />
        </div>
        <Skeleton className="h-[460px] w-full rounded-2xl" />
      </div>
    </div>
  );
}
