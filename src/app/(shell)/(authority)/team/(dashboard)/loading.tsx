import { Skeleton } from "@/components/ui/skeleton";
import { MEETING_BOX_HEIGHT, MEMBER_BOX_HEIGHT } from "@/features/team/lib";

/** 대시보드를 불러오는 동안. 실제 화면과 같은 골격(고정 높이 박스 포함)이라 레이아웃이 흔들리지 않는다. */
export default function Loading() {
  return (
    <main className="scrollbar-hidden min-h-0 flex-1 overflow-y-auto px-8 py-7">
      <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-7">
        <div className="grid grid-cols-4 gap-3">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-[104px] rounded-2xl" />
          ))}
        </div>

        <Skeleton className="rounded-2xl" style={{ height: MEMBER_BOX_HEIGHT }} />
        <Skeleton className="rounded-2xl" style={{ height: MEETING_BOX_HEIGHT }} />
      </div>
    </main>
  );
}
