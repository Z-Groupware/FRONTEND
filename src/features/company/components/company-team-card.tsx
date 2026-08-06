"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { Button } from "@/components/ui/button";
import { COMPANY_SECTION_TITLE } from "@/constants/company";
import { DepartmentAddRow } from "@/features/onboarding/components/department-add-row";
import {
  DepartmentNode,
  type DepartmentNodeHandlers,
} from "@/features/onboarding/components/department-node";
import { countDepartments, findNode } from "@/features/onboarding/tree";
import type { DraggingInfo } from "@/features/onboarding/use-department-drag";
import { useDepartmentTree } from "@/features/onboarding/use-department-tree";

import { saveDepartmentsAction } from "../actions";
import type { DepartmentNode as DepartmentNodeType } from "../types";
import { SettingCard } from "./setting-card";

/**
 * 팀 체계 — 온보딩 1단계에서 만든 트리를 나중에 고친다.
 *
 * ⚠️ 편집 조각은 **온보딩 것을 그대로 쓴다**(훅·행·추가줄·삭제 확인창).
 *    두 벌로 만들면 온보딩에서 되는 조작(끌어 옮기기·키보드 승격)이 여기서 조용히 빠진다.
 * ⚠️ 온보딩과 다른 건 **끝**뿐이다 — 거기선 [다음]으로 넘어가고 여기선 저장한다.
 *    임시 보관함(`draft.ts`)은 안 쓴다. 그건 단계를 오가는 동안 값을 지키는 장치지,
 *    이 화면은 오갈 단계가 없고 저장하면 서버가 정본을 들고 있다.
 * ⚠️ 트리를 **통째로** 보낸다 — 순서와 계층이 값이라 한 줄씩 보내면 중간 상태가 저장된다.
 */
export function CompanyTeamCard({ initial }: { initial: DepartmentNodeType[] }) {
  const tree = useDepartmentTree(initial);
  /*
    ⚠️ 삭제 확인은 **여기서 직접 받는다.** 온보딩의 `requestRemove`는 안에 역할이 있을 때만
       묻는데, 거기선 아직 아무도 안 쓰는 초안이라 그래도 됐다. 여기는 **실제 조직**이라
       빈 팀을 지워도 그 팀 소속 사원이 갈 곳을 잃는다 — 늘 묻는다(§토스트: 파괴적 작업은 Dialog).
  */
  const [pendingTeam, setPendingTeam] = useState<DepartmentNodeType | null>(null);
  const [draftName, setDraftName] = useState("");
  const [dragging, setDragging] = useState<DraggingInfo | null>(null);
  const [saved, setSaved] = useState(initial);
  const [isSaving, startSaving] = useTransition();

  const handlers: DepartmentNodeHandlers = {
    onRename: tree.rename,
    onAddChild: tree.addChild,
    onRemove: (id: string) => setPendingTeam(findNode(tree.departments, id) ?? null),
    onMove: tree.move,
    onShift: tree.shift,
    onPromote: tree.promote,
    onDemote: tree.demote,
    editingId: tree.editingId,
    onEditingChange: tree.setEditingId,
    dragging,
    onDraggingChange: setDragging,
  };

  /*
    ⚠️ **팀 수는 뿌리만 센다.** `countDepartments`는 안에 든 역할까지 다 세는데, 그 값을
       `팀 n개`라고 적으면 팀 셋짜리 회사가 `팀 5개`라고 나온다 — 역할은 따로 적는다.
  */
  const roleCount = countDepartments(tree.departments) - tree.departments.length;
  const aside = `팀 ${tree.departments.length}개 · 역할 ${roleCount}개`;

  // 안 고친 걸 저장하면 "저장했습니다"가 아무 뜻이 없다 — 바뀐 게 있을 때만 연다
  const isDirty = JSON.stringify(tree.departments) !== JSON.stringify(saved);

  const handleSave = () => {
    const next = tree.departments;
    startSaving(async () => {
      const result = await saveDepartmentsAction(next);
      if (!result.isSuccess) {
        toast.error(result.message ?? "팀 체계를 저장하지 못했습니다");
        return;
      }
      setSaved(next);
      toast.success("팀 체계를 저장했습니다");
    });
  };

  return (
    <>
      <SettingCard
        title={COMPANY_SECTION_TITLE.TEAM}
        aside={aside}
        description={
          <>
            <span className="text-foreground font-medium">팀 아래 역할까지 두 단계</span>입니다.
            사원은 팀에 소속되고, 역할은 비워 둘 수 있습니다.
          </>
        }
        footer={
          <Button
            type="button"
            size="sm"
            variant="ink"
            onClick={handleSave}
            disabled={isSaving || !isDirty}
          >
            {isSaving ? "저장 중…" : "저장"}
          </Button>
        }
      >
        {/*
          열 머리 — 표가 있는 다른 카드(저장소 관리)와 같은 모양이다.
          ⚠️ 여백은 카드 전체와 같은 24px다. 아래 목록은 `DepartmentNode`가 자기 몫으로
             8px(`px-2`)를 쓰므로 컨테이너가 16px만 대서 합이 24가 된다.
        */}
        <div className="text-muted-foreground bg-secondary/50 border-border flex items-center justify-between border-b px-6 py-3 text-[12px] leading-4">
          <span>팀 · 역할</span>
          <span>구분</span>
        </div>

        {/*
          ⚠️ 높이를 못박지 않는다. 옆 카드(직급)와 나란히 서서 **키를 나눠 쓰는데**,
             여기서 300px로 고정하면 남는 자리가 [추가] 줄 아래에 빈 띠로 남는다.
             길어지면 이 안에서만 스크롤된다.
        */}
        <div className="min-h-0 flex-1 overflow-auto overscroll-contain px-4 pt-4 pb-3">
          {tree.departments.length === 0 ? (
            <p className="text-muted-foreground/70 py-12 text-center text-[13px]">
              아래에서 첫 팀을 추가해 주세요
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

        <DepartmentAddRow
          insetClassName="px-6"
          value={draftName}
          onChange={setDraftName}
          onSubmit={() => {
            if (tree.addRoot(draftName)) setDraftName("");
          }}
        />
      </SettingCard>

      {/*
        ⚠️ **무엇을 잃는지** 적는다. 역할이 딸려 있으면 그 수까지 말한다 — "정말요?"만 묻는 건
           확인이 아니다. 지운 뒤 [저장]을 눌러야 실제로 반영된다는 것도 같이 말한다.
      */}
      <ConfirmDialog
        isOpen={pendingTeam !== null}
        onOpenChange={() => setPendingTeam(null)}
        title={`\u2018${pendingTeam?.name ?? ""}\u2019 팀을 지울까요?`}
        description={
          pendingTeam && pendingTeam.children.length > 0
            ? `안에 있는 역할 ${pendingTeam.children.length}개도 함께 사라집니다. 이 팀 소속 사원은 소속이 없어집니다.`
            : "이 팀 소속 사원은 소속이 없어집니다."
        }
        confirmLabel="삭제"
        isDestructive
        onConfirm={() => {
          if (!pendingTeam) return;
          tree.confirmRemove(pendingTeam.id);
          setPendingTeam(null);
        }}
      />
    </>
  );
}
