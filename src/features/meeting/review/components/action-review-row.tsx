"use client";

import { MessageSquareQuote, X } from "lucide-react";

import { DatePickerField } from "@/components/common/date-picker-field";
import { ProfileAvatar } from "@/components/common/profile-avatar";
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
    <div className="border-border hover:bg-foreground/[0.015] px-7 py-4 transition-colors not-first:border-t">
      {/*
        ⚠️ **두 열이다**(2026-08-11). 왼쪽은 읽는 것(이름·설명·근거), 오른쪽은 고치는 것
           (담당자·기간·반려) — 글이 조작 아래로 흘러들지 않게 열을 못 박는다.
        ⚠️ 조작은 **글 덩이 전체의 세로 가운데**다(`items-center`). 이름 줄에만 맞춰 두면
           글이 세 줄인데 조작만 맨 위에 붙어 행의 무게중심이 위로 쏠린다.
      */}
      <div className="flex items-center gap-6">
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <InlineEditableField value={draft.title} onChange={onTitleChange} ariaLabel="액션명" />

          {/* ⚠️ 설명과 근거는 **한 덩이**다(gap-1) — 근거는 그 설명의 출처라 사이를 벌리지 않는다 */}
          <div className="flex min-w-0 flex-col gap-1">
            <InlineEditableField
              value={draft.description}
              onChange={onDescriptionChange}
              ariaLabel="세부 내용"
              placeholder="세부 내용을 입력해 주세요"
              multiline
              allowEmpty
            />

            {/*
              ⚠️ **이모지를 안 쓴다**(§디자인 토큰). `💬`·`▶`는 기기마다 다른 그림으로 그려지고
                 글자 크기와도 안 맞는다 — 아이콘은 `lucide-react` 하나로 통일한다.
              ⚠️ 근거는 **왼쪽에 선을 세워** 인용임을 모양으로 말한다. 설명과 같은 12px 흐린
                 글자라 나란히 두면 어디까지가 우리 말이고 어디부터가 회의에서 나온 말인지 흐렸다.
            */}
            {draft.evidence && (
              <p className="border-border text-muted-foreground flex items-baseline gap-1.5 border-l-2 pl-2.5 text-[12px] leading-4 break-keep">
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
        </div>

        {/*
          ⚠️ 조작은 **키가 같다**(32). 셀렉트 32 · 날짜 40 · ✕ 28로 셋이 제각각이라 같은 줄인데
             중앙이 어긋나 보였다 — 날짜 칸의 높이는 공용 컴포넌트에서 바로잡았다(§DESIGN 3).
          ⚠️ 날짜 칸은 **값에 맞춘 폭**(140)이다. 연도를 뗀 뒤에도 180으로 두니 `8월 7일(금)`
             한 덩이가 칸 왼쪽에만 붙어 오른쪽이 비었다.
        */}
        {/* ⚠️ 좁아지면 줄을 바꾼다 — 셋(180+140+140)+✕는 1180px 아래에서 글 칸을 0으로 밀어냈다 */}
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
          <Select
            value={String(draft.assigneeId)}
            onValueChange={(value) => value && onAssigneeChange(Number(value))}
          >
            <SelectTrigger aria-label="담당자 선택" className="w-[180px]">
              {/*
                ⚠️ **아바타를 붙인다**(2026-08-11). 이름만 늘어놓으니 다섯 줄이 회색 글자
                   덩어리였다 — 아바타는 색을 써도 되는 자리이고(§DESIGN 5), 그 사람 id에서
                   나온 색이라 목록·회의 상세에서 익힌 색과 같다. 누가 맡는지가 색으로 먼저 잡힌다.
              */}
              <SelectValue>
                {(value) => {
                  const option = assigneeOptions.find(
                    (candidate) => String(candidate.id) === value,
                  );
                  if (!option) return value;
                  return (
                    <>
                      <ProfileAvatar userId={option.id} size={18} />
                      <span className="truncate">{formatAssigneeLabel(option)}</span>
                    </>
                  );
                }}
              </SelectValue>
            </SelectTrigger>
            <SelectContent side="bottom" alignItemWithTrigger={false}>
              {assigneeOptions.map((option) => (
                <SelectItem key={option.id} value={String(option.id)}>
                  <ProfileAvatar userId={option.id} size={18} />
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
            className="w-[140px]"
          />
          <DatePickerField
            aria-label="마감일"
            value={draft.dueDate}
            min={draft.startDate}
            onChange={onDueDateChange}
            className="w-[140px]"
          />

          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="이 액션 반려"
            onClick={onReject}
          >
            <X />
          </Button>
        </div>
      </div>
    </div>
  );
}
