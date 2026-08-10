import { Skeleton } from "@/components/ui/skeleton";
import { MEETING_BOX_SKELETON_HEIGHT, MEMBER_BOX_SKELETON_HEIGHT } from "@/features/team/lib";

/**
 * 대시보드를 불러오는 동안.
 * ⚠️ 카드는 내용만큼 자라므로 뼈대는 **예상 높이**로 선다(`*_SKELETON_HEIGHT`) — 상한값을
 *    그대로 쓰면 로딩이 끝날 때 카드가 줄면서 아래가 딸려 올라간다(`lib.ts` 참고).
 */
export default function Loading() {
  return (
    <main className="scrollbar-hidden min-h-0 flex-1 overflow-y-auto px-8 py-7">
      <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-7">
        <div className="grid grid-cols-4 gap-3">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-[104px] rounded-2xl" />
          ))}
        </div>

        <Skeleton className="rounded-2xl" style={{ height: MEMBER_BOX_SKELETON_HEIGHT }} />
        <Skeleton className="rounded-2xl" style={{ height: MEETING_BOX_SKELETON_HEIGHT }} />
      </div>
    </main>
  );
}
