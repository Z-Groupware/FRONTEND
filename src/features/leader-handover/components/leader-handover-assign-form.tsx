"use client";

import { Download } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LEADER_HANDOVER_CUSTODY_STATUS } from "@/constants/domain";

import { assignLeaderHandoverAction } from "../actions";
import type { LeaderHandoverDetail } from "../types";

interface LeaderHandoverAssignFormProps {
  handover: LeaderHandoverDetail;
}

/**
 * 수신자(신규 팀장) 선택 + [OOO에게 귀속](WORKFLOW.md §7).
 * ⚠️ 이미 귀속 완료된 건은 다시 못 바꾼다 — 일괄 이전은 한 번뿐이다.
 * ⚠️ 실제 PDF 생성 API는 아직 BE와 경로가 확정 전이다(§연동 검증) — 버튼만 두고
 *    눌렀을 때 "연동 전"임을 그대로 알린다(§정직성).
 */
export function LeaderHandoverAssignForm({ handover }: LeaderHandoverAssignFormProps) {
  const isAssigned = handover.custodyStatus === LEADER_HANDOVER_CUSTODY_STATUS.ASSIGNED;
  const [selectedId, setSelectedId] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const selectedCandidate = handover.candidates.find((candidate) => candidate.id === selectedId);

  function handleConfirm() {
    setError(null);
    startTransition(async () => {
      /*
        ⚠️ **던질 수 있는 호출이다.** `isMock`이 꺼지면 Action이 예외를 던지는데, 여기서
           안 잡으면 이 창이 아니라 페이지 전체 error.tsx로 넘어가 확인 창이 통째로
           사라진다(§토스트: 페이지 전체 실패는 error.tsx, 이건 그 자리가 아니다).
      */
      try {
        const result = await assignLeaderHandoverAction(handover.id, selectedId);
        if (!result.isSuccess) {
          setError("귀속 처리에 실패했습니다. 잠시 후 다시 시도해 주세요.");
          return;
        }
        setConfirmOpen(false);
        toast.success(`${selectedCandidate?.name} 님에게 귀속했습니다`);
      } catch {
        setError("귀속 처리에 실패했습니다. 잠시 후 다시 시도해 주세요.");
      }
    });
  }

  return (
    <section className="border-border bg-card flex flex-col gap-4 rounded-2xl border p-7">
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-[15px] leading-6 font-semibold tracking-[-0.2px]">
          새 팀장에게 귀속
        </h2>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => toast("PDF 생성은 아직 연동되지 않았습니다")}
        >
          <Download />
          인수인계서 PDF 다운로드
        </Button>
      </div>

      {isAssigned ? (
        <p className="text-muted-foreground text-[13px] leading-5">
          이미 귀속이 완료된 인수인계서입니다.
        </p>
      ) : handover.candidates.length === 0 ? (
        /*
          ⚠️ **타 부서 팀장은 후보에 안 넣는다**(팀 정정, 2026-08-08) — 그 팀에 새 팀장이
             생기기 전까지는 넘길 곳이 없다는 뜻이라, 빈 셀렉트 대신 다음 할 일을 알려준다.
        */
        <p className="text-muted-foreground text-[13px] leading-5 break-keep">
          {handover.teamName}에 아직 새 팀장이 지정되지 않았습니다. 먼저{" "}
          <Link href="/manage/members" className="text-foreground underline underline-offset-2">
            사원 관리
          </Link>
          에서 그 팀 소속 사원을 팀장으로 승급해 주세요.
        </p>
      ) : (
        <div className="flex items-center gap-3">
          <Select value={selectedId} onValueChange={(value) => setSelectedId(value ?? "")}>
            <SelectTrigger aria-label="수신자 선택" className="w-56">
              {/* 원본 값(id)이 아니라 이름·팀 라벨을 보여준다(다른 화면의 담당자 선택과 같은 패턴) */}
              <SelectValue placeholder="수신자(신규 팀장) 선택">
                {(value) => {
                  const candidate = handover.candidates.find((c) => c.id === value);
                  return candidate ? `${candidate.name} · ${candidate.teamName}` : value;
                }}
              </SelectValue>
            </SelectTrigger>
            <SelectContent side="bottom" alignItemWithTrigger={false}>
              {handover.candidates.map((candidate) => (
                <SelectItem key={candidate.id} value={candidate.id}>
                  {candidate.name} · {candidate.teamName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            type="button"
            disabled={!selectedId}
            className="bg-foreground text-background hover:bg-foreground/90"
            onClick={() => setConfirmOpen(true)}
          >
            {selectedCandidate ? `${selectedCandidate.name}에게 귀속` : "귀속"}
          </Button>
        </div>
      )}

      <ConfirmDialog
        isOpen={confirmOpen}
        onOpenChange={(open) => {
          setConfirmOpen(open);
          if (!open) setError(null);
        }}
        title={`${selectedCandidate?.name} 님에게 귀속할까요?`}
        description={`담긴 액션 ${handover.actionCount}건 전체의 담당자가 ${selectedCandidate?.name} 님으로 한 번에 바뀝니다. 되돌릴 수 없습니다.`}
        confirmLabel="귀속"
        isPending={isPending}
        pendingLabel="귀속 중"
        error={error}
        onConfirm={handleConfirm}
      />
    </section>
  );
}
