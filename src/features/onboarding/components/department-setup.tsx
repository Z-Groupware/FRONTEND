"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { loadDraft, saveDraftDepartments } from "../draft";
import { countDepartments } from "../tree";
import type { DepartmentNode as DepartmentNodeType } from "../types";
import type { DraggingInfo } from "../use-department-drag";
import { useDepartmentTree } from "../use-department-tree";
import { useDraftSync } from "../use-draft-sync";
import { DepartmentAddRow } from "./department-add-row";
import { DepartmentDeleteDialog } from "./department-delete-dialog";
import { DepartmentIntro } from "./department-intro";
import { DepartmentNode, type DepartmentNodeHandlers } from "./department-node";

/**
 * 온보딩 1단계 — 부서 체계.
 * ⚠️ 서버 저장은 미구현이다. 단계를 오갈 때 입력이 사라지지 않게
 *    임시 보관함(`draft.ts` · sessionStorage)에만 담아둔다. BE 연동 후 [완료]에서 한 번에 커밋한다.
 */
export function DepartmentSetup({
  initialDepartments,
}: {
  initialDepartments: DepartmentNodeType[];
}) {
  const tree = useDepartmentTree(initialDepartments);
  const [draftName, setDraftName] = useState("");
  const [dragging, setDragging] = useState<DraggingInfo | null>(null);

  useDraftSync({
    value: tree.departments,
    load: () => loadDraft().departments,
    save: saveDraftDepartments,
    restore: tree.reset,
  });

  const total = countDepartments(tree.departments);

  const handleAddRoot = () => {
    if (tree.addRoot(draftName)) setDraftName("");
  };

  const handlers: DepartmentNodeHandlers = {
    onRename: tree.rename,
    onAddChild: tree.addChild,
    onRemove: tree.requestRemove,
    onMove: tree.move,
    onShift: tree.shift,
    onPromote: tree.promote,
    onDemote: tree.demote,
    editingId: tree.editingId,
    onEditingChange: tree.setEditingId,
    dragging,
    onDraggingChange: setDragging,
  };

  return (
    <div className="flex flex-col gap-[21px]">
      {/* 높이를 여기서 한 번만 정한다 — 좌우 두 칸이 같은 높이를 나눠 쓴다 */}
      <div className="flex flex-col gap-7 lg:h-[560px] lg:flex-row">
        <DepartmentIntro departments={tree.departments} />

        {/* 높이 고정 — 부서를 아무리 추가해도 카드 크기는 그대로고 안에서만 스크롤된다 */}
        <section className="border-border bg-card flex h-[440px] flex-1 flex-col overflow-hidden rounded-xl border shadow-sm lg:h-full">
          <header className="border-border bg-muted flex h-12 shrink-0 items-center justify-between border-b px-4">
            <h2 className="flex items-center gap-2 text-[13px] leading-5">
              <span className="bg-foreground size-2 rounded-full" aria-hidden />
              부서 구조 미리보기
            </h2>
            {/* 계층 제약 안내는 좌측 안내문에 있다 — 헤더에 겹쳐 쓰면 지저분해진다 */}
            <span className="text-muted-foreground/70 text-xs leading-4 tabular-nums">
              부서 {total}개
            </span>
          </header>

          {/* 스크롤바는 숨긴다(스크롤 자체는 된다) */}
          <div className="flex-1 [scrollbar-width:none] overflow-auto overscroll-contain px-4 pt-4 pb-3 [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {tree.departments.length === 0 ? (
              <p className="text-muted-foreground/70 py-12 text-center text-[13px]">
                아래에서 첫 부서를 추가해 주세요
              </p>
            ) : (
              <ul>
                {tree.departments.map((node, index) => (
                  <li key={node.id} className={index > 0 ? "pt-[1.75px]" : undefined}>
                    <DepartmentNode node={node} depth={0} parentId={null} {...handlers} />
                  </li>
                ))}
              </ul>
            )}
          </div>

          <DepartmentAddRow value={draftName} onChange={setDraftName} onSubmit={handleAddRoot} />
        </section>
      </div>

      <div className="border-border flex items-center justify-end border-t pt-[17.5px]">
        {/* 시안의 주 버튼은 액센트(파랑)가 아니라 먹색이다(토큰 충돌 — 팀 확인 필요) */}
        <Link
          href="/onboarding/2"
          className={cn(
            buttonVariants(),
            "bg-foreground text-background hover:bg-foreground/90 h-[34px] gap-[5.25px] rounded-md px-[12.25px] text-[13px] leading-none",
          )}
        >
          <span className="leading-none">다음</span>
          <ChevronRight className="size-3.5" />
        </Link>
      </div>

      <DepartmentDeleteDialog
        target={tree.pendingDelete}
        onCancel={tree.cancelRemove}
        onConfirm={tree.confirmRemove}
      />
    </div>
  );
}
