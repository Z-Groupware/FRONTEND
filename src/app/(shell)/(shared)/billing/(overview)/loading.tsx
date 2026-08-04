import { Skeleton } from "@/components/ui/skeleton";

/** 뼈대는 **실제 배치와 같은 자리**에 둔다 — 다르면 채워질 때 화면이 튄다. */
export default function OwnerBillingLoading() {
  return (
    <div className="flex-1 overflow-y-auto px-8 py-7">
      <div className="mx-auto w-full max-w-[1080px]">
        <div className="border-border flex gap-6 border-b pb-3">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-16" />
        </div>

        <div className="flex flex-col gap-5 pt-6">
          <Skeleton className="h-[188px] w-full rounded-xl" />
          <Skeleton className="h-[168px] w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}
