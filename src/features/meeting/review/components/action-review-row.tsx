"use client";

import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { formatAssigneeLabel } from "../lib";
import type { AiActionDraft, AssigneeOption } from "../types";
import { InlineEditableField } from "./inline-editable-field";

interface ActionReviewRowProps {
  draft: AiActionDraft;
  assigneeOptions: AssigneeOption[];
  onTitleChange: (title: string) => void;
  onDescriptionChange: (description: string) => void;
  onAssigneeChange: (assigneeId: number) => void;
  onStartDateChange: (startDate: string) => void;
  onDueDateChange: (dueDate: string) => void;
  onReject: () => void;
}

/**
 * 액션 초안 한 행 — 담당자·시작일·마감일은 확정 전까지 전부 수정 가능하다
 * (WORKFLOW.md §3-4 "두 그룹 다 수정 가능(A안)").
 * ⚠️ 시작일·마감일은 **두 칸으로 나눈다**(2026-08-07 팀 확정) — 보드·프로젝트가 시작일로
 *    상태를 계산하므로 액션도 같은 값이 필요하다.
 */
export function ActionReviewRow({
  draft,
  assigneeOptions,
  onTitleChange,
  onDescriptionChange,
  onAssigneeChange,
  onStartDateChange,
  onDueDateChange,
  onReject,
}: ActionReviewRowProps) {
  return (
    <div className="border-border flex flex-col gap-2 border-t px-7 py-4 first:border-t-0">
      <div className="flex items-start gap-3">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <InlineEditableField value={draft.title} onChange={onTitleChange} ariaLabel="액션명" />
          <InlineEditableField
            value={draft.description}
            onChange={onDescriptionChange}
            ariaLabel="세부 내용"
            placeholder="세부 내용을 입력하세요"
            multiline
            allowEmpty
          />
        </div>

        <Select
          value={String(draft.assigneeId)}
          onValueChange={(value) => value && onAssigneeChange(Number(value))}
        >
          <SelectTrigger aria-label="담당자 선택" className="w-36">
            {/* 원본 값(id 문자열)이 아니라 이름·직급 라벨을 보여준다(role-select.tsx와 같은 패턴) */}
            <SelectValue>
              {(value) => {
                const option = assigneeOptions.find((candidate) => String(candidate.id) === value);
                return option ? formatAssigneeLabel(option) : value;
              }}
            </SelectValue>
          </SelectTrigger>
          <SelectContent side="bottom" alignItemWithTrigger={false}>
            {assigneeOptions.map((option) => (
              <SelectItem key={option.id} value={String(option.id)}>
                {formatAssigneeLabel(option)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Input
          type="date"
          aria-label="시작일"
          value={draft.startDate}
          max={draft.dueDate}
          onChange={(event) => onStartDateChange(event.target.value)}
          className="w-[150px]"
        />
        <Input
          type="date"
          aria-label="마감일"
          value={draft.dueDate}
          min={draft.startDate}
          onChange={(event) => onDueDateChange(event.target.value)}
          className="w-[150px]"
        />

        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="이 액션 반려"
          onClick={onReject}
        >
          <X />
        </Button>
      </div>

      {draft.evidence && (
        <p className="text-muted-foreground pl-0.5 text-[12px] leading-4 break-keep">
          💬 &ldquo;{draft.evidence.quote}&rdquo;
          <span className="text-muted-foreground/70 ml-2 tabular-nums">
            ▶ {draft.evidence.timestamp}
          </span>
        </p>
      )}
    </div>
  );
}
