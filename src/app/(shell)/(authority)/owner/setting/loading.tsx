import { Skeleton } from "@/components/ui/skeleton";

/**
 * 뼈대는 **실제 배치와 같은 자리**에 둔다 — 다르면 채워질 때 화면이 튄다.
 * 카드는 **셋**(기본 정보 · 팀 체계 · 직급·권한)이고 간격도 본문과 같은 `gap-7`이다.
 */
export default function OwnerSettingLoading() {
  return (
    <div className="flex-1 overflow-y-auto px-8 py-7">
      <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-7">
        <Skeleton className="h-[352px] w-full rounded-2xl" />
        <Skeleton className="h-[408px] w-full rounded-2xl" />
        <Skeleton className="h-[404px] w-full rounded-2xl" />
      </div>
    </div>
  );
}
