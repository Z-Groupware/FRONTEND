"use client";

import { GripVertical, X } from "lucide-react";

import { cn } from "@/lib/utils";

import { type AssignableRole, MAX_ORG_NAME_LENGTH, type Position } from "../types";
import {
  type DraggingPositionId,
  type PositionDropEdge,
  usePositionDrag,
} from "../use-position-drag";
import { POSITION_COLUMN } from "./position-columns";
import { RoleSelect } from "./role-select";

export interface PositionRowHandlers {
  onRename: (id: string, name: string) => void;
  onChangeRole: (id: string, role: AssignableRole) => void;
  onRemove: (id: string) => void;
  onMove: (draggedId: string, targetId: string, edge: PositionDropEdge) => void;
  /** 키보드 대체 경로 — Alt + ↑/↓ */
  onShift: (id: string, offset: 1 | -1) => void;
  /** 이미 다른 직급이 가져간 권한 — 리더는 하나뿐이다 */
  blockedRolesOf: (id: string) => readonly AssignableRole[];
  editingId: string | null;
  onEditingChange: (id: string | null) => void;
  draggingId: DraggingPositionId;
  onDraggingChange: (id: DraggingPositionId) => void;
}

interface PositionRowProps extends PositionRowHandlers {
  position: Position;
  /** 서열 순서(0부터). 화면에는 1부터 보여준다. */
  index: number;
  /**
   * 줄의 좌우 여백.
   * ⚠️ **쓰는 카드가 정한다.** 온보딩 카드와 기업 설정 카드는 머리 여백이 달라서, 여기서
   *    한 값으로 못박으면 한쪽은 반드시 오와 열이 어긋난다. 기본값은 온보딩 기준이다.
   */
  insetClassName?: string;
}

export function PositionRow({
  position,
  index,
  insetClassName = "px-4",
  ...handlers
}: PositionRowProps) {
  const { onRename, onChangeRole, onRemove, onShift, editingId, onEditingChange } = handlers;

  const isEditing = editingId === position.id;

  const { isDragged, dropEdge, handleProps, rowProps } = usePositionDrag({
    positionId: position.id,
    positionName: position.name,
    draggingId: handlers.draggingId,
    onDraggingChange: handlers.onDraggingChange,
    onMove: handlers.onMove,
  });

  const submitName = (value: string) => {
    const name = value.trim();
    if (name) onRename(position.id, name);
    onEditingChange(null);
  };

  return (
    <div
      {...rowProps}
      className={cn(
        "group border-border relative flex h-[38px] items-center gap-2 border-t transition-[background-color,opacity]",
        insetClassName,
        isDragged ? "opacity-40" : "hover:bg-secondary/60",
        // 점선 = 여기 들어온다. 하단 "직급명 입력"의 점선과 같은 표현이다.
        dropEdge === "before" &&
          "before:border-ring before:absolute before:inset-x-0 before:-top-0.5 before:border-t-2 before:border-dashed before:content-['']",
        dropEdge === "after" &&
          "after:border-ring after:absolute after:inset-x-0 after:-bottom-0.5 after:border-t-2 after:border-dashed after:content-['']",
      )}
    >
      {/* 평소엔 서열 번호, 마우스를 올리면 그 자리가 드래그 손잡이가 된다 */}
      <span
        className={cn(POSITION_COLUMN.INDEX, "relative flex shrink-0 items-center justify-center")}
      >
        <span className="text-muted-foreground/40 text-[11px] leading-none tabular-nums transition-opacity group-focus-within:opacity-0 group-hover:opacity-0">
          {index + 1}
        </span>
        <button
          {...handleProps}
          type="button"
          aria-label={`${position.name} 순서 이동 — Alt와 위아래 방향키로도 옮길 수 있습니다`}
          onKeyDown={(event) => {
            if (!event.altKey) return;
            if (event.key === "ArrowUp") {
              event.preventDefault();
              onShift(position.id, -1);
            }
            if (event.key === "ArrowDown") {
              event.preventDefault();
              onShift(position.id, 1);
            }
          }}
          className="text-muted-foreground/50 hover:text-muted-foreground focus-visible:ring-ring absolute inset-0 flex cursor-grab items-center justify-center rounded opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:outline-hidden active:cursor-grabbing"
        >
          <GripVertical className="size-3.5" />
        </button>
      </span>

      {isEditing ? (
        <>
          {/* ⚠️ `aria-label`만으로는 부족하다 — 입력은 `label htmlFor`로 잇는다(§a11y).
              줄마다 있는 입력이라 id에 직급 id를 섞어 겹치지 않게 한다 */}
          <label htmlFor={`position-name-${position.id}`} className="sr-only">
            직급 이름
          </label>
          <input
            id={`position-name-${position.id}`}
            maxLength={MAX_ORG_NAME_LENGTH}
            autoFocus
            defaultValue={position.name}
            onFocus={(event) => event.currentTarget.select()}
            onBlur={(event) => submitName(event.target.value)}
            onKeyDown={(event) => {
              // 한글 조합 중의 Enter는 글자 확정용이다 — 편집을 끝내면 안 된다
              if (event.nativeEvent.isComposing) return;
              if (event.key === "Enter") submitName(event.currentTarget.value);
              if (event.key === "Escape") onEditingChange(null);
            }}
            className={cn(
              POSITION_COLUMN.NAME,
              "border-ring bg-background shrink-0 rounded border px-1.5 text-center text-[13px] leading-5 outline-none",
            )}
          />
        </>
      ) : (
        <button
          type="button"
          onDoubleClick={() => onEditingChange(position.id)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              onEditingChange(position.id);
            }
          }}
          aria-label={`${position.name} 이름 바꾸기`}
          className={cn(
            POSITION_COLUMN.NAME,
            "shrink-0 truncate text-center text-[13px] leading-5",
          )}
        >
          {position.name}
        </button>
      )}

      <span className="flex-1" aria-hidden />

      <span className="shrink-0">
        <RoleSelect
          value={position.role}
          onChange={(role) => onChangeRole(position.id, role)}
          label={`${position.name} 권한`}
          blocked={handlers.blockedRolesOf(position.id)}
        />
      </span>

      <button
        type="button"
        aria-label={`${position.name} 삭제`}
        onClick={() => onRemove(position.id)}
        className={cn(
          POSITION_COLUMN.REMOVE,
          "text-muted-foreground hover:text-foreground hover:bg-foreground/10 focus-visible:ring-ring flex shrink-0 items-center justify-center rounded opacity-0 transition-[color,background-color,opacity] group-focus-within:opacity-100 group-hover:opacity-100 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:outline-hidden",
        )}
      >
        <X className="size-3.5" />
      </button>
    </div>
  );
}
