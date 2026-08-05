"use client";

import { useState } from "react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { formatGb } from "@/features/billing/pricing";
import type { BillingConfig } from "@/features/billing/types";

import { deleteRecordingsAction } from "../actions";
import { buildStorageTotals, freedGb } from "../storage";
import type { ProjectStorage, StorageOverview } from "../types";
import { ProjectStorageTable } from "./project-storage-table";
import { StorageSummary } from "./storage-summary";

interface StorageViewProps {
  overview: StorageOverview;
  config: BillingConfig;
  /** 지울 수 있는 사람인지 — 대표이거나 Admin을 겸한 사람 */
  canManage: boolean;
}

/**
 * 녹음 용량 — **지울지 판단하는 화면**이다.
 *
 * 읽는 순서는 **얼마나 찼나 → 지우면 무엇을 잃나 → 어디를 지울까**다.
 * 가운데 한 줄이 빠지면 사용자는 요약과 액션까지 사라지는 줄 알고 손을 못 댄다.
 *
 * ⚠️ 데이터는 **서버에서 받아 props로** 내려온다. 이 컴포넌트가 클라이언트인 건 확인 창과
 *    아래 목 상태 때문이지 데이터를 가져오려는 게 아니다(§서버우선).
 * ⚠️ **삭제는 창으로 확인받는다.** 되돌릴 수 없는 일이라 토스트로 알리고 지나갈 수 없다
 *    (CLAUDE.md §렌더링: 파괴적 작업 확인은 Dialog).
 * ⚠️ 지운 결과는 지금 **화면 안에서만** 반영된다. 목이라서다 — 연동되면 이 `useState`를
 *    지우고 `revalidatePath`가 새 값을 내려 준다.
 */
export function StorageView({ overview, config, canManage }: StorageViewProps) {
  const [projects, setProjects] = useState<readonly ProjectStorage[]>(overview.projects);
  const [target, setTarget] = useState<ProjectStorage | null>(null);
  const [isPending, setIsPending] = useState(false);

  /*
    ⚠️ 합계를 서버 값 그대로 쓰지 않고 **목록에서 다시 낸다.** 지운 직후에도 위 카드가 따라
       줄어야 하는데, 서버가 준 총량을 그대로 두면 표만 줄고 게이지는 그대로여서 화면이
       두 가지 말을 하게 된다.
  */
  const totals = buildStorageTotals(
    {
      voiceGb: projects.reduce((sum, project) => sum + project.voiceGb, 0),
      sttGb: projects.reduce((sum, project) => sum + project.sttGb, 0),
      projects,
    },
    config,
  );

  const handleDelete = async () => {
    if (!target) return;

    setIsPending(true);
    /*
      ⚠️ 액션은 **거절될 수도 있다.** 권한·검증 실패는 값으로 오지만, 네트워크가 끊기거나
         서버가 죽으면 호출 자체가 거절된다 — 잡지 않으면 아무 일도 안 일어난 것처럼 보이고
         콘솔에만 남는다(§정직성).
      ⚠️ `finally`로 푼다. `await` 뒤에서만 풀면 거절됐을 때 버튼이 영영 잠긴다.
    */
    try {
      const result = await deleteRecordingsAction(target.tag);

      if (!result.isSuccess) {
        // ⚠️ 토스트는 한 줄(220px)이라 짧게 쓴다 — 길면 잘린다(`sonner.tsx`)
        toast(result.message ?? "녹음을 지우지 못했습니다");
        return;
      }

      const freed = freedGb(target);
      setProjects((prev) =>
        prev.map((project) =>
          project.tag === target.tag ? { ...project, voiceGb: 0, meetingCount: 0 } : project,
        ),
      );
      setTarget(null);
      toast(`${formatGb(freed)}를 비웠습니다`);
    } catch {
      toast("녹음을 지우지 못했습니다");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto px-8 py-7">
      {/* ⚠️ 목록 화면 규격은 1440이다(CLAUDE.md §디자인 토큰 — PageLayout `list`) */}
      <div className="mx-auto w-full max-w-[1440px]">
        <div className="flex flex-col gap-7">
          <StorageSummary totals={totals} />

          <ProjectStorageTable
            projects={projects}
            totalVoiceGb={totals.voiceGb}
            canManage={canManage}
            onDelete={setTarget}
          />
        </div>
      </div>

      {/*
        ⚠️ 확인 창은 **무엇을 잃는지와 얼마가 비는지**를 같이 말한다. "정말요?"만 묻는 건
           확인이 아니다 — 되돌릴 수 없는 일이라 판단할 재료를 줘야 한다.
      */}
      <ConfirmDialog
        isOpen={target !== null}
        onOpenChange={(open) => !open && setTarget(null)}
        title="이 프로젝트의 녹음을 지울까요?"
        description={
          target ? (
            <>
              <span className="font-medium">{target.name}</span>의 음성 {formatGb(target.voiceGb)}
              가 사라지고 다시 들을 수 없습니다.
              <br />
              자막·요약과 액션은 그대로 남습니다.
            </>
          ) : null
        }
        confirmLabel="녹음 지우기"
        pendingLabel="지우는 중"
        isPending={isPending}
        isDestructive
        onConfirm={handleDelete}
      />
    </div>
  );
}
