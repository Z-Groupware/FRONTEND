import { Skeleton } from "@/components/ui/skeleton";

/**
 * 뼈대는 **실제 배치와 같은 자리**에 둔다 — 다르면 채워질 때 화면이 튄다.
 *
 * ⚠️ 카드는 **셋**이다(전체 용량 · 안내 한 줄 · 프로젝트 표). 간격도 본문과 같은 `gap-7`이다.
 */
export default function ManageStorageLoading() {
  return (
    <div className="flex-1 overflow-y-auto px-8 py-7">
      <div className="mx-auto w-full max-w-[1080px]">
        <div className="flex flex-col gap-7">
          <Skeleton className="h-[196px] w-full rounded-2xl" />
          <Skeleton className="h-[62px] w-full rounded-xl" />
          <Skeleton className="h-[404px] w-full rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
