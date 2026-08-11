import type { Metadata } from "next";

import { MyActionListItemRow } from "@/features/action/components/my-action-list-item";
import { getMyActionList } from "@/features/action/server";
import type { MyActionListItem } from "@/features/action/types";
import { pickPaletteColor } from "@/lib/palette";

export const metadata: Metadata = {
  title: "내 액션",
};

// ⚠️ 로그인 전이라 실제 담당자를 알 수 없다 — 팀 대시보드 목과 같은 대표 인물(이하윤)로 대신한다.
//    세션이 붙으면 실연동 분기(server.ts)는 이 값을 안 쓰고 토큰의 본인 소유분만 받는다.
const MOCK_ASSIGNEE_NAME = "이하윤";

/** 프로젝트별로 묶는다 — 마감 임박순으로 이미 정렬된 목록이라 그룹 안 순서도 그대로 유지된다. */
function groupByProject(
  actions: MyActionListItem[],
): { projectId: number; projectName: string; projectTag: string; actions: MyActionListItem[] }[] {
  const groups: Map<
    number,
    { projectName: string; projectTag: string; actions: MyActionListItem[] }
  > = new Map();
  for (const action of actions) {
    const group = groups.get(action.projectId);
    if (group) group.actions.push(action);
    else {
      groups.set(action.projectId, {
        projectName: action.projectName,
        projectTag: action.projectTag,
        actions: [action],
      });
    }
  }
  return [...groups.entries()].map(([projectId, group]) => ({ projectId, ...group }));
}

export default async function MyActionsPage() {
  const actions = await getMyActionList(MOCK_ASSIGNEE_NAME);
  const groups = groupByProject(actions);

  return (
    <main className="scrollbar-hidden min-h-0 flex-1 overflow-y-auto px-8 py-7">
      <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-4">
        <p className="text-muted-foreground text-sm">나에게 할당된 개인 액션 {actions.length}건</p>

        {groups.length === 0 ? (
          <section className="border-border bg-card overflow-hidden rounded-2xl border">
            <p className="text-muted-foreground flex min-h-[240px] items-center justify-center text-sm">
              아직 할당된 개인 액션이 없습니다.
            </p>
          </section>
        ) : (
          groups.map((group) => {
            const tagColor = pickPaletteColor(group.projectTag);
            return (
              <section
                key={group.projectId}
                className="border-border bg-card flex flex-col overflow-hidden rounded-2xl border"
              >
                <div className="border-border flex shrink-0 items-baseline justify-between gap-3 border-b px-7 pt-6 pb-3">
                  <h3 className="flex items-center gap-2 text-[17px] leading-7 font-semibold tracking-[-0.3px]">
                    <span className="bg-foreground size-2 rounded-full" aria-hidden />
                    {group.projectName}
                    <span
                      className="rounded px-1.5 py-0.5 font-mono text-xs leading-none font-semibold"
                      style={{ backgroundColor: tagColor.bgColor, color: tagColor.textColor }}
                    >
                      {group.projectTag}
                    </span>
                  </h3>
                  <p className="text-muted-foreground text-[12px] leading-4 tabular-nums">
                    {group.actions.length}건
                  </p>
                </div>
                <ul>
                  {group.actions.map((action, index) => (
                    <MyActionListItemRow
                      key={action.id}
                      action={action}
                      showDivider={index > 0}
                      // ⚠️ 항상 false — 카드 위쪽 모서리는 헤더가 이미 차지해서 목록의 첫 행은
                      //    거기 안 닿는다(맞물리는 건 마지막 행뿐).
                      isFirst={false}
                      isLast={index === group.actions.length - 1}
                    />
                  ))}
                </ul>
              </section>
            );
          })
        )}
      </div>
    </main>
  );
}
