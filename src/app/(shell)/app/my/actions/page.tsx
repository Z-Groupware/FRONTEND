import type { Metadata } from "next";

import { MyActionListItemRow } from "@/features/action/components/my-action-list-item";
import { getMyActionList } from "@/features/action/server";

export const metadata: Metadata = {
  title: "내 액션",
};

// ⚠️ 로그인 전이라 실제 담당자를 알 수 없다 — 팀 대시보드 목과 같은 대표 인물(이하윤)로 대신한다.
//    세션이 붙으면 viewer.name으로 바꾼다.
const MOCK_ASSIGNEE_NAME = "이하윤";

export default async function MyActionsPage() {
  const actions = await getMyActionList(MOCK_ASSIGNEE_NAME);

  return (
    <main className="scrollbar-hidden min-h-0 flex-1 overflow-y-auto px-8 py-7">
      <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-4">
        <p className="text-muted-foreground text-sm">나에게 할당된 개인 액션 {actions.length}건</p>

        <section className="border-border bg-card overflow-hidden rounded-2xl border">
          {actions.length === 0 ? (
            <p className="text-muted-foreground flex min-h-[240px] items-center justify-center text-sm">
              아직 할당된 개인 액션이 없습니다.
            </p>
          ) : (
            <ul>
              {actions.map((action, index) => (
                <MyActionListItemRow key={action.id} action={action} showDivider={index > 0} />
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
