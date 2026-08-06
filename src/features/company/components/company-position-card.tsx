"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { COMPANY_SECTION_TITLE } from "@/constants/company";
import { PositionAddRow } from "@/features/onboarding/components/position-add-row";
import { POSITION_COLUMN } from "@/features/onboarding/components/position-columns";
import {
  PositionRow,
  type PositionRowHandlers,
} from "@/features/onboarding/components/position-row";
import { blockedRoles } from "@/features/onboarding/positions";
import type { AssignableRole } from "@/features/onboarding/types";
import type { DraggingPositionId } from "@/features/onboarding/use-position-drag";
import { usePositionList } from "@/features/onboarding/use-position-list";
import { cn } from "@/lib/utils";

import { savePositionsAction } from "../actions";
import type { Position } from "../types";
import { SettingCard } from "./setting-card";

/**
 * 직급·권한 — 온보딩 2단계에서 만든 직급을 나중에 고친다.
 *
 * ⚠️ 편집 조각은 **온보딩 것을 그대로 쓴다**(§팀 체계 카드와 같은 이유).
 * ⚠️ **Admin은 여기 없다.** 직급이 아니라 사람에게 붙는 겸직이라 사원 관리에서 켠다
 *    (CLAUDE.md §라우트 그룹 — `is_admin`은 역할이 아니라 플래그다).
 * ⚠️ Leader는 **한 직급만** 가진다 — 훅이 막고, 서버가 다시 본다.
 */
export function CompanyPositionCard({ initial }: { initial: Position[] }) {
  const list = usePositionList(initial);
  const [draftName, setDraftName] = useState("");
  const [draftRole, setDraftRole] = useState<AssignableRole>(list.defaultRole);
  const [draggingId, setDraggingId] = useState<DraggingPositionId>(null);
  const [saved, setSaved] = useState(initial);
  const [isSaving, startSaving] = useTransition();

  const handlers: PositionRowHandlers = {
    onRename: list.rename,
    onChangeRole: list.changeRole,
    onRemove: list.remove,
    onMove: list.move,
    onShift: list.shift,
    blockedRolesOf: (id: string) => blockedRoles(list.positions, id),
    editingId: list.editingId,
    onEditingChange: list.setEditingId,
    draggingId,
    onDraggingChange: setDraggingId,
  };

  const isDirty = JSON.stringify(list.positions) !== JSON.stringify(saved);

  const handleSave = () => {
    const next = list.positions;
    startSaving(async () => {
      const result = await savePositionsAction(next);
      if (!result.isSuccess) {
        toast.error(result.message ?? "직급을 저장하지 못했습니다");
        return;
      }
      setSaved(next);
      toast.success("직급·권한을 저장했습니다");
    });
  };

  return (
    <SettingCard
      title={COMPANY_SECTION_TITLE.POSITION}
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
      {/* 칸 너비는 행(`PositionRow`)과 같은 곳에서 온다 — 따로 적으면 머리와 몸이 어긋난다 */}
      <div className="text-muted-foreground/60 border-border bg-card flex h-8 shrink-0 items-center gap-2 border-b px-4 text-[12px] leading-4">
        <span className={cn(POSITION_COLUMN.INDEX, "shrink-0")} aria-hidden />
        <span className={cn(POSITION_COLUMN.NAME, "shrink-0 text-center")}>직급명</span>
        <span className="flex-1" aria-hidden />
        <span className={cn(POSITION_COLUMN.ROLE, "shrink-0 text-center")}>권한</span>
        <span className={cn(POSITION_COLUMN.REMOVE, "shrink-0")} aria-hidden />
      </div>

      {/* 목록이 짧으면 카드도 짧다 — 팀 체계 카드와 같은 이유 */}
      <div className="max-h-[268px] overflow-auto overscroll-contain">
        {list.positions.length === 0 ? (
          <p className="text-muted-foreground/70 py-12 text-center text-[13px]">
            아래에서 첫 직급을 추가해 주세요
          </p>
        ) : (
          list.positions.map((position, index) => (
            <PositionRow key={position.id} position={position} index={index} {...handlers} />
          ))
        )}
      </div>

      <PositionAddRow
        name={draftName}
        role={draftRole}
        blocked={blockedRoles(list.positions)}
        onNameChange={setDraftName}
        onRoleChange={setDraftRole}
        onSubmit={() => {
          if (list.add(draftName, draftRole)) {
            setDraftName("");
            setDraftRole(list.defaultRole);
          }
        }}
      />
    </SettingCard>
  );
}
