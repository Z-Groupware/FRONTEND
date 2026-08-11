"use client";

import { MessageSquareQuote, X } from "lucide-react";

import { DatePickerField } from "@/components/common/date-picker-field";
import { Button } from "@/components/ui/button";
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
    <div className="border-border flex flex-col gap-2 px-7 py-4 not-first:border-t">
      <div className="flex items-start gap-3">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <InlineEditableField value={draft.title} onChange={onTitleChange} ariaLabel="액션명" />
          <InlineEditableField
            value={draft.description}
            onChange={onDescriptionChange}
            ariaLabel="세부 내용"
            placeholder="세부 내용을 입력해 주세요"
            multiline
            allowEmpty
          />
        </div>

        <Select
          value={String(draft.assigneeId)}
          onValueChange={(value) => value && onAssigneeChange(Number(value))}
        >
          {/* ⚠️ 조작 셋은 **같은 폭**이다 — 144/180/180이라 열 끝이 어긋났다(§DESIGN 3 오와 열) */}
          <SelectTrigger aria-label="담당자 선택" className="w-[180px]">
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

        <DatePickerField
          aria-label="시작일"
          value={draft.startDate}
          max={draft.dueDate}
          onChange={onStartDateChange}
          className="w-[180px]"
        />
        <DatePickerField
          aria-label="마감일"
          value={draft.dueDate}
          min={draft.startDate}
          onChange={onDueDateChange}
          className="w-[180px]"
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

      {/*
        ⚠️ **이모지를 안 쓴다**(§디자인 토큰). `💬`·`▶`는 기기마다 다른 그림으로 그려지고
           글자 크기와도 안 맞는다 — 아이콘은 `lucide-react` 하나로 통일한다.
        ⚠️ 시각은 가운뎃점으로 잇는다 — 인용과 시각은 같은 근거의 두 쪽이라 줄을 나누지 않는다.
      */}
      {draft.evidence && (
        <p className="text-muted-foreground flex items-baseline gap-1.5 text-[12px] leading-4 break-keep">
          <MessageSquareQuote className="size-3.5 shrink-0 translate-y-0.5" aria-hidden />
          <span className="min-w-0">
            &ldquo;{draft.evidence.quote}&rdquo;
            <span className="text-muted-foreground/70 ml-2 tabular-nums">
              · {draft.evidence.timestamp}
            </span>
          </span>
        </p>
      )}
    </div>
  );
}
