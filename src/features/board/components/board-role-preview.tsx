"use client";

import { useState, useTransition } from "react";

import { AUTHORITY, type Authority, AUTHORITY_LABEL } from "@/constants/domain";
import { cn } from "@/lib/utils";

import { getBoardPreviewAction } from "../actions";
import type { BoardCard, BoardType } from "../types";
import { BoardView } from "./board-view";

interface BoardRolePreviewProps {
  initialRole: Authority;
  initialBoardType: BoardType;
  initialCards: BoardCard[];
  todayIso: string;
}

const PREVIEW_ROLES: Authority[] = [AUTHORITY.OWNER, AUTHORITY.LEADER, AUTHORITY.MEMBER];

/**
 * ⚠️ 완전 임시 — 로그인이 붙기 전까지만 쓰는 QA용 권한 토글이다(2026-08-06).
 *    실제로는 로그인한 사람의 권한 하나로만 보드가 결정된다 — 이 토글과
 *    `getBoardPreviewAction`/`loadBoardForRole`을 로그인 붙는 대로 통째로 지운다.
 */
export function BoardRolePreview({
  initialRole,
  initialBoardType,
  initialCards,
  todayIso,
}: BoardRolePreviewProps) {
  const [role, setRole] = useState(initialRole);
  const [boardType, setBoardType] = useState(initialBoardType);
  const [cards, setCards] = useState(initialCards);
  const [isPending, startTransition] = useTransition();

  function handleSelect(nextRole: Authority) {
    if (nextRole === role) return;
    setRole(nextRole);
    startTransition(async () => {
      const result = await getBoardPreviewAction(nextRole);
      setBoardType(result.boardType);
      setCards(result.cards);
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="border-warning/40 bg-warning/5 flex items-center gap-2 rounded-lg border px-3.5 py-2 text-xs">
        <span className="text-warning font-semibold">⚠️ 임시 미리보기</span>
        <span className="text-muted-foreground">
          로그인 붙기 전까지만 있는 개발용 토글입니다. 실제로는 로그인한 권한 하나로만 보입니다.
        </span>
        <div className="ml-auto flex gap-1">
          {PREVIEW_ROLES.map((candidate) => (
            <button
              key={candidate}
              type="button"
              disabled={isPending}
              onClick={() => handleSelect(candidate)}
              className={cn(
                "rounded px-2 py-1 text-xs font-medium transition-colors disabled:opacity-50",
                role === candidate
                  ? "bg-foreground text-background"
                  : "bg-background text-muted-foreground hover:text-foreground border-border border",
              )}
            >
              {AUTHORITY_LABEL[candidate]}
            </button>
          ))}
        </div>
      </div>

      {/* key=role: 미리보기 전환마다 드래그 임시 상태를 새로 시작한다 */}
      <BoardView key={role} boardType={boardType} cards={cards} todayIso={todayIso} />
    </div>
  );
}
