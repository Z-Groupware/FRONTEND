"use client";

import { ChevronRight, Folder, GripVertical } from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";

import {
  type DepartmentNode as DepartmentNodeType,
  getDepthLabel,
  MAX_DEPARTMENT_DEPTH,
} from "../types";
import { type DraggingInfo, type DropZone, useDepartmentDrag } from "../use-department-drag";
import { DepartmentNodeActions } from "./department-node-actions";

export interface DepartmentNodeHandlers {
  onRename: (id: string, name: string) => void;
  onAddChild: (parentId: string) => void;
  onRemove: (id: string) => void;
  /** 순서 변경과 다른 상위 부서로 옮기기를 모두 처리한다 */
  onMove: (draggedId: string, targetId: string, position: DropZone) => void;
  /** 키보드 대체 경로 — Alt + ↑/↓ 순서, Alt + ←/→ 계층 */
  onShift: (id: string, offset: 1 | -1) => void;
  onPromote: (id: string) => void;
  onDemote: (id: string) => void;
  /** 새로 만든 부서는 바로 편집 상태로 열린다 */
  editingId: string | null;
  onEditingChange: (id: string | null) => void;
  dragging: DraggingInfo | null;
  onDraggingChange: (info: DraggingInfo | null) => void;
}

interface DepartmentNodeProps extends DepartmentNodeHandlers {
  node: DepartmentNodeType;
  depth: number;
  parentId: string | null;
}

export function DepartmentNode({ node, depth, parentId, ...handlers }: DepartmentNodeProps) {
  const { onRename, onAddChild, onRemove, onShift, onPromote, onDemote } = handlers;
  const { editingId, onEditingChange } = handlers;

  const [isExpanded, setIsExpanded] = useState(true);

  const hasChildren = node.children.length > 0;
  const isEditing = editingId === node.id;

  const { isDragged, dropZone, handleProps, rowProps } = useDepartmentDrag({
    nodeId: node.id,
    parentId,
    depth,
    hasChildren,
    nodeName: node.name,
    dragging: handlers.dragging,
    onDraggingChange: handlers.onDraggingChange,
    onMove: handlers.onMove,
  });

  const submitName = (value: string) => {
    const name = value.trim();
    if (name) onRename(node.id, name);
    onEditingChange(null);
  };

  const handleKeyMove = (event: React.KeyboardEvent) => {
    if (!event.altKey) return;
    const actions: Record<string, () => void> = {
      ArrowUp: () => onShift(node.id, -1),
      ArrowDown: () => onShift(node.id, 1),
      ArrowLeft: () => onPromote(node.id),
      ArrowRight: () => onDemote(node.id),
    };
    const action = actions[event.key];
    if (!action) return;
    event.preventDefault();
    action();
  };

  return (
    <>
      <div
        {...rowProps}
        className={cn(
          "group relative flex h-[38px] items-center gap-2 rounded-md px-2 transition-[background-color,opacity]",
          isDragged ? "opacity-40" : "hover:bg-secondary",
          // 점선 = 여기 들어온다. 아래 "부서 추가" 입력창의 점선과 같은 표현을 쓴다.
          dropZone === "before" &&
            "before:border-ring before:absolute before:inset-x-0 before:-top-0.5 before:border-t-2 before:border-dashed before:content-['']",
          dropZone === "after" &&
            "after:border-ring after:absolute after:inset-x-0 after:-bottom-0.5 after:border-t-2 after:border-dashed after:content-['']",
          dropZone === "inside" && "bg-secondary outline-ring outline-2 outline-dashed",
        )}
      >
        <button
          {...handleProps}
          type="button"
          aria-label={`${node.name} 위치 이동 — Alt와 방향키로도 옮길 수 있어요(위아래: 순서, 왼쪽: 부서로 빼기, 오른쪽: 바로 위 부서의 역할로)`}
          onKeyDown={handleKeyMove}
          className="text-muted-foreground/40 hover:text-muted-foreground focus-visible:ring-ring shrink-0 cursor-grab rounded opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:outline-hidden active:cursor-grabbing"
        >
          <GripVertical className="size-3.5" />
        </button>

        {hasChildren ? (
          <button
            type="button"
            onClick={() => setIsExpanded((prev) => !prev)}
            aria-label={`${node.name} ${isExpanded ? "접기" : "펼치기"}`}
            aria-expanded={isExpanded}
            className="text-muted-foreground hover:text-foreground shrink-0"
          >
            <ChevronRight
              className={cn("size-3.5 transition-transform", isExpanded && "rotate-90")}
            />
          </button>
        ) : (
          <span className="size-3.5 shrink-0" aria-hidden />
        )}

        <Folder className="text-muted-foreground/60 size-3.5 shrink-0" aria-hidden />

        {isEditing ? (
          <input
            autoFocus
            defaultValue={node.name}
            aria-label="부서 이름"
            onFocus={(event) => event.currentTarget.select()}
            onBlur={(event) => submitName(event.target.value)}
            onKeyDown={(event) => {
              // 한글 조합 중의 Enter는 글자 확정용이다 — 편집을 끝내면 안 된다
              if (event.nativeEvent.isComposing) return;
              if (event.key === "Enter") submitName(event.currentTarget.value);
              if (event.key === "Escape") onEditingChange(null);
            }}
            className="border-ring bg-background min-w-0 flex-1 rounded border px-1.5 text-[13px] leading-5 outline-none"
          />
        ) : (
          <button
            type="button"
            onDoubleClick={() => onEditingChange(node.id)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onEditingChange(node.id);
              }
            }}
            aria-label={`${node.name} 이름 바꾸기`}
            className="min-w-0 flex-1 truncate text-left text-[13px] leading-5"
          >
            {node.name}
          </button>
        )}

        {/* 윗단은 부서, 아랫단은 그 안의 역할이다 */}
        <span className="text-muted-foreground/50 shrink-0 text-[11px] transition-opacity group-focus-within:opacity-0 group-hover:opacity-0">
          {getDepthLabel(depth)}
        </span>

        <DepartmentNodeActions
          name={node.name}
          canAddChild={depth + 1 < MAX_DEPARTMENT_DEPTH}
          onAddChild={() => {
            setIsExpanded(true);
            onAddChild(node.id);
          }}
          onRemove={() => onRemove(node.id)}
        />
      </div>

      {hasChildren && isExpanded && (
        <div className="ml-4">
          <ul className="border-border border-l pl-3">
            {node.children.map((child, index) => (
              <li key={child.id} className={index > 0 ? "pt-[1.75px]" : undefined}>
                <DepartmentNode node={child} depth={depth + 1} parentId={node.id} {...handlers} />
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}
