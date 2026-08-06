"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { LeaveGuard } from "@/components/common/leave-guard";
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
export function CompanyTeamCard({
  initial,
  memberCounts,
}: {
  initial: DepartmentNodeType[];
  /** 팀 id → 사원 수. 사람이 딸린 팀은 못 지운다 */
  memberCounts: Record<string, number>;
}) {
  const router = useRouter();
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
  /*
    ⚠️ 저장 실패는 **화면에 남긴다.** 검증 문구는 `같은 이름이 둘 있습니다 — 개발팀`처럼
       어느 줄이 문제인지 담고 있는데, 토스트로 띄우면 한 줄에 잘리고 몇 초 뒤 사라진다 —
       그러면 사라진 문장을 기억해 목록을 눈으로 훑어야 한다(§토스트: 사라지므로 보조다).
  */
  /**
   * 마지막으로 **실패한 저장**과 그때 보낸 값.
   * ⚠️ 문구만 들고 있으면 값을 고쳐도 빨간 글씨가 남는다 — `같은 이름이 둘 있습니다`를
   *    고쳤는데 화면은 계속 그렇다고 말한다. 되돌려서 [저장]이 잠기면 지울 길조차 없다.
   *    실패한 값과 지금 값이 **같을 때만** 보여 주면 편집하는 순간 저절로 사라진다.
   */
  const [failed, setFailed] = useState<{ snapshot: string; message: string } | null>(null);

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

  /* 편집하면 스냅샷이 어긋나 문구가 저절로 사라진다 */
  const error =
    failed && JSON.stringify(tree.departments) === failed.snapshot ? failed.message : null;

  /**
   * 지우려는 팀에 남은 사원 수.
   * ⚠️ 0이면 확인만 받고, 1명이라도 있으면 **막고 갈 곳을 알려 준다** — 팀은 인수인계·액션
   *    귀속의 단위라 소속이 사라지면 그 사람을 아무도 관리할 수 없다(§validate).
   */
  const pendingMembers = pendingTeam ? (memberCounts[pendingTeam.id] ?? 0) : 0;
  const isBlocked = pendingMembers > 0;

  const handleSave = () => {
    const next = tree.departments;
    startSaving(async () => {
      const result = await saveDepartmentsAction(next);
      if (!result.isSuccess) {
        setFailed({
          snapshot: JSON.stringify(next),
          message: result.message ?? "팀 체계를 저장하지 못했습니다",
        });
        return;
      }
      setFailed(null);
      setSaved(next);
      toast.success("팀 체계를 저장했습니다");
    });
  };

  return (
    <>
      {/*
        ⚠️ 저장 안 한 편집을 들고 나가면 **조용히 사라진다.** 확인창에서 "[저장]을 눌러야
           반영됩니다"라고 말해 놓고 저장 없이 나가는 걸 안 막으면 앞뒤가 안 맞는다.
        ⚠️ 아직 안 누른 입력칸도 센다 — 적다가 닫으면 그것도 사라진다.
      */}
      <LeaveGuard hasUnsaved={isDirty || draftName.trim().length > 0} />

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
          <>
            {error && (
              <p role="alert" className="text-destructive mr-auto text-[12px] leading-4 break-keep">
                {error}
              </p>
            )}
            <Button
              type="button"
              size="sm"
              variant="ink"
              onClick={handleSave}
              disabled={isSaving || !isDirty}
            >
              {isSaving ? "저장 중…" : "저장"}
            </Button>
          </>
        }
      >
        {/*
          열 머리 — 표가 있는 다른 카드(저장소 관리)와 같은 모양이다.
          ⚠️ 여백은 카드 전체와 같은 28px다. 아래 목록은 `DepartmentNode`가 자기 몫으로
             8px(`px-2`)를 쓰므로 컨테이너가 20px만 대서 합이 28이 된다.
        */}
        <div className="text-muted-foreground bg-secondary/50 border-border flex items-center justify-between border-b px-7 py-3 text-[12px] leading-4">
          <span>팀 · 역할</span>
          <span>구분</span>
        </div>

        {/*
          ⚠️ 높이를 못박지 않는다. 옆 카드(직급)와 나란히 서서 **키를 나눠 쓰는데**,
             여기서 300px로 고정하면 남는 자리가 [추가] 줄 아래에 빈 띠로 남는다.
             길어지면 이 안에서만 스크롤된다.
        */}
        <div className="min-h-0 flex-1 overflow-auto overscroll-contain px-5 pt-4 pb-3">
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
          insetClassName="px-7"
          value={draftName}
          onChange={setDraftName}
          onSubmit={() => {
            if (tree.addRoot(draftName)) setDraftName("");
          }}
        />
      </SettingCard>

      {/*
        ⚠️ **무엇을 잃는지**와 **언제 그렇게 되는지**를 같이 적는다. 여기서 [삭제]를 눌러도
           화면에서만 빠지고, 카드 밑 [저장]을 눌러야 서버에 간다 — 그 말을 빼면 이미
           지워진 줄 알고 저장 없이 나가서, 지운 팀이 그대로 남는다(§정직성).
        ⚠️ 사람이 딸린 팀이면 **창이 하는 일이 달라진다** — 확인이 아니라 막는 안내다.
           워크플로우에서 사람이 빠질 때는 늘 명시적 재할당을 거치므로(휴직·오프보딩 →
           인수인계 → 귀속), 팀 삭제만 조용히 소속을 지우게 두지 않는다.
      */}
      <ConfirmDialog
        isOpen={pendingTeam !== null}
        onOpenChange={() => setPendingTeam(null)}
        title={
          isBlocked
            ? `\u2018${pendingTeam?.name ?? ""}\u2019 팀은 지울 수 없습니다`
            : `\u2018${pendingTeam?.name ?? ""}\u2019 팀을 지울까요?`
        }
        description={
          isBlocked ? (
            <>
              사원 {pendingMembers}명이 이 팀에 속해 있습니다.
              <br />
              사원 관리에서 다른 팀으로 옮긴 뒤 지워 주세요.
            </>
          ) : (
            <>
              {pendingTeam && pendingTeam.children.length > 0
                ? `안에 있는 역할 ${pendingTeam.children.length}개도 함께 목록에서 빠집니다.`
                : "이 팀에는 사원이 없어 바로 지울 수 있습니다."}
              <br />
              [저장]을 눌러야 반영됩니다.
            </>
          )
        }
        /* 막힌 창은 **다음 걸음**을 준다 — "안 됩니다"만 말하고 끝내면 갈 곳을 찾아 헤맨다 */
        confirmLabel={isBlocked ? "사원 관리 열기" : "삭제"}
        cancelLabel={isBlocked ? "닫기" : undefined}
        mark={isBlocked ? "alert" : "check"}
        isDestructive={!isBlocked}
        onConfirm={() => {
          if (!pendingTeam) return;
          if (isBlocked) {
            router.push("/manage/members");
            return;
          }
          tree.confirmRemove(pendingTeam.id);
          setPendingTeam(null);
        }}
      />
    </>
  );
}
