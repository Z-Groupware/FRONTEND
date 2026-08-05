"use client";

import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { CalendarIcon, Plus } from "lucide-react";
import { useActionState, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

import { createPersonalTodoAction, type PersonalTodoFormState } from "../actions";
import type { PersonalCalendarEvent } from "../types";

interface AddTodoDialogProps {
  /** 지금 오른쪽 상세조회 패널이 보고 있는 날짜 — 모달을 열 때 이 날짜로 기본값을 맞춘다. */
  defaultDate: Date;
  /** 생성 성공 시 호출 — 재조회 없이 부모 화면에 바로 얹는다(§최적화: action 리턴값 그대로 반영). */
  onCreated: (created: PersonalCalendarEvent) => void;
}

const DATE_FORMAT = "yyyy-MM-dd";

const INITIAL_STATE: PersonalTodoFormState = { errors: {} };

/**
 * 개인 Todo 추가 — `ConfirmDialog`와 같은 모양(표식 → 제목 → 설명 → 버튼)으로 간다.
 * ⚠️ 색상 선택 입력은 두지 않는다 — 색은 팀 디자인 컨벤션으로 하드코딩한다(2026-08-05 확정).
 * ⚠️ 성공하면 `revalidatePath`는 백그라운드 정합성용이고, 화면은 action이 돌려준 `created`를
 *    바로 로컬에 얹어 즉시 반영한다(§최적화).
 * ⚠️ `ConfirmDialog`엔 `<form>`이 없다 — 확인 버튼 클릭 시 `formAction`을 직접 호출해 넘긴다.
 */
export function AddTodoDialog({ defaultDate, onCreated }: AddTodoDialogProps) {
  const [open, setOpen] = useState(false);
  const [datePopoverOpen, setDatePopoverOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(createPersonalTodoAction, INITIAL_STATE);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState<Date>(defaultDate);
  const handledCreatedId = useRef<string | null>(null);

  useEffect(() => {
    if (state.created && state.created.id !== handledCreatedId.current) {
      handledCreatedId.current = state.created.id;
      onCreated(state.created);
      setOpen(false);
      setTitle("");
      toast.success(`'${state.created.title}' Todo를 추가했습니다`);
    }
  }, [state.created, onCreated]);

  function handleOpen() {
    // 모달을 열 때마다 지금 상세조회 중인 날짜로 다시 맞춘다 — 며칠 전에 열었던 값이 남아있지 않게.
    setDate(defaultDate);
    setOpen(true);
  }

  function handleConfirm() {
    const formData = new FormData();
    formData.set("title", title);
    formData.set("date", format(date, DATE_FORMAT));
    formAction(formData);
  }

  return (
    <>
      <Button
        type="button"
        size="sm"
        className="bg-foreground text-background hover:bg-foreground/90"
        onClick={handleOpen}
      >
        <Plus aria-hidden />
        Todo 추가
      </Button>

      <ConfirmDialog
        isOpen={open}
        onOpenChange={setOpen}
        title="Todo를 추가할까요?"
        description="추가하면 캘린더에 바로 표시됩니다."
        confirmLabel="추가하기"
        pendingLabel="추가하는 중…"
        isPending={isPending}
        onConfirm={handleConfirm}
      >
        <div className="flex flex-col gap-4 text-left">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="todo-title">제목</Label>
            <Input
              id="todo-title"
              name="title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="할 일을 입력하세요"
              aria-invalid={Boolean(state.errors.title)}
            />
            {state.errors.title && <p className="text-destructive text-xs">{state.errors.title}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="todo-date">날짜</Label>
            <Popover open={datePopoverOpen} onOpenChange={setDatePopoverOpen}>
              <PopoverTrigger
                render={
                  <Button
                    id="todo-date"
                    type="button"
                    variant="outline"
                    className="w-full justify-start font-normal"
                  />
                }
              >
                <CalendarIcon aria-hidden className="text-muted-foreground" />
                {format(date, "yyyy년 M월 d일(EEE)", { locale: ko })}
              </PopoverTrigger>
              <PopoverContent align="start" className="w-auto p-0">
                <Calendar
                  mode="single"
                  locale={ko}
                  selected={date}
                  onSelect={(selected) => {
                    if (!selected) return;
                    setDate(selected);
                    setDatePopoverOpen(false);
                  }}
                />
              </PopoverContent>
            </Popover>
            {state.errors.date && <p className="text-destructive text-xs">{state.errors.date}</p>}
          </div>
        </div>
      </ConfirmDialog>
    </>
  );
}
