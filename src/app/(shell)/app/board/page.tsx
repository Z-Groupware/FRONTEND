import type { Metadata } from "next";

import { BoardRolePreview } from "@/features/board/components/board-role-preview";
import { loadBoardForRole } from "@/features/board/server";
import { getViewer } from "@/features/shell/viewer";
import { todayIso } from "@/lib/date";

export const metadata: Metadata = {
  title: "보드",
};

export default async function BoardPage() {
  const viewer = await getViewer();
  const { boardType, cards } = await loadBoardForRole(viewer.role);

  return (
    <main className="flex min-h-0 flex-1 flex-col overflow-hidden px-8 py-7">
      <div className="mx-auto flex min-h-0 w-full max-w-[1440px] flex-1 flex-col gap-4">
        <BoardRolePreview
          initialRole={viewer.role}
          initialBoardType={boardType}
          initialCards={cards}
          todayIso={todayIso()}
        />
      </div>
    </main>
  );
}
