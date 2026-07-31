"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { countDepartments } from "../tree";
import type { DepartmentNode } from "../types";

interface DepartmentDeleteDialogProps {
  /** 지울 대상. null이면 닫힌 상태다. */
  target: DepartmentNode | null;
  onCancel: () => void;
  onConfirm: (id: string) => void;
}

/** 안에 든 역할까지 함께 사라지므로 확인을 받는다(CLAUDE.md: 파괴적 작업은 토스트가 아니라 Dialog). */
export function DepartmentDeleteDialog({
  target,
  onCancel,
  onConfirm,
}: DepartmentDeleteDialogProps) {
  const childCount = target ? countDepartments(target.children) : 0;

  return (
    <Dialog open={target !== null} onOpenChange={onCancel}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>&lsquo;{target?.name}&rsquo; 부서를 지울까요?</DialogTitle>
          <DialogDescription>
            역할 {childCount}개도 함께 사라져요. 되돌릴 수 없습니다.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>
            취소
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={() => target && onConfirm(target.id)}
          >
            지우기
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
