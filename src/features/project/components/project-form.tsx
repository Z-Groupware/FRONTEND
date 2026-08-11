"use client";

import { Paperclip, Plus, X } from "lucide-react";
import Link from "next/link";
import type { CSSProperties } from "react";
import { useActionState, useRef, useState } from "react";

import { DatePickerField } from "@/components/common/date-picker-field";
import { FieldError } from "@/components/common/field-error";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PROJECT_DESCRIPTION_MAX_LENGTH, PROJECT_TAG_MAX_LENGTH } from "@/constants/project";
import { paletteColorByName, TAG_NAME_LABEL, TAG_NAMES, type TagColorName } from "@/lib/palette";
import { cn } from "@/lib/utils";

import type { ProjectFormState } from "../actions";

interface TeamRow {
  /** React key용 — 팀명이 아니라 행 자체의 정체성(같은 팀을 지웠다 다시 골라도 행은 별개). */
  rowId: number;
  team: string;
}

interface ProjectFormProps {
  action: (prev: ProjectFormState, formData: FormData) => Promise<ProjectFormState>;
  /** 참여 팀 드롭다운 선택지 — 회사 전체 팀 목록. */
  teamOptions: string[];
  cancelHref: string;
}

/** 대문자 A-Z가 아닌 문자를 전부 걷어낸다 — 소문자는 버리지 않고 대문자로 살린다. */
function toTagInput(raw: string): string {
  return raw
    .toUpperCase()
    .replace(/[^A-Z]/g, "")
    .slice(0, PROJECT_TAG_MAX_LENGTH);
}

let nextRowId = 1;

/**
 * 프로젝트 생성 폼.
 * ⚠️ 참여 팀은 **드롭다운 하나가 아니라 다중 지정**이다 — 프로젝트 하나에 여러 팀이 참여할 수 있어
 *    행을 늘려가며 고른다(팀당 한 행, 중복 선택 불가).
 * ⚠️ 태그 색상은 고정 팔레트(`lib/palette`)에서만 고른다 — 자유 HEX는 다크모드에 안 맞는다.
 */
export function ProjectForm({ action, teamOptions, cancelHref }: ProjectFormProps) {
  const [state, formAction, isPending] = useActionState(action, { errors: {} });

  const [name, setName] = useState("");
  const [tag, setTag] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [tagColor, setTagColor] = useState<TagColorName>(TAG_NAMES[0]);
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const [teamRows, setTeamRows] = useState<TeamRow[]>([{ rowId: nextRowId++, team: "" }]);
  const [attachmentName, setAttachmentName] = useState<string | undefined>(undefined);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canSubmit =
    name.trim().length > 0 &&
    tag.length > 0 &&
    description.trim().length > 0 &&
    startDate.trim().length > 0 &&
    dueDate.trim().length > 0 &&
    teamRows.length > 0 &&
    teamRows.every((row) => row.team.trim().length > 0);
  const mainColor = paletteColorByName(tagColor);
  const usedTeams = new Set(teamRows.map((row) => row.team).filter(Boolean));
  const canAddTeamRow = teamRows.length < teamOptions.length;

  function cycleTagColor() {
    const rest = TAG_NAMES.filter((candidate) => candidate !== tagColor);
    const next = rest[Math.floor(Math.random() * rest.length)] ?? tagColor;
    setTagColor(next);
  }

  function updateTeamRow(rowId: number, team: string) {
    setTeamRows((rows) => rows.map((row) => (row.rowId === rowId ? { ...row, team } : row)));
  }

  function removeTeamRow(rowId: number) {
    setTeamRows((rows) => rows.filter((row) => row.rowId !== rowId));
  }

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <input type="hidden" name="tagColor" value={tagColor} />

      {/*
        ⚠️ **두 칸으로 가른다**(2026-08-11). 폭을 1440으로 넓히면서 한 줄에 `태그 색상 … 시작일`을
           나란히 두니, 왼쪽 칸 하나와 오른쪽 칸 하나 사이가 700px씩 벌어져 같은 줄인데도
           서로 상관없어 보였다 — 왼쪽은 **적는 것**(이름·설명·참여 팀), 오른쪽은
           **정하는 것**(태그·색·기간·첨부)이다(§DESIGN 4 detail 2컬럼, 인수인계 상세와 같은 해부).
        ⚠️ 곁 칸은 300px 고정이다. 비율로 두면 화면 폭에 따라 날짜 칸이 늘었다 줄었다 한다.
        ⚠️ 좁아지면 한 줄로 떨어진다(`lg:`).
      */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-10">
        <div className="flex min-w-0 flex-1 flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="project-name">
              프로젝트명 <span className="text-destructive">*</span>
            </Label>
            <Input
              id="project-name"
              name="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="예: 온라인 굿즈샵 웹 구축"
              aria-invalid={Boolean(state.errors.name)}
            />
            <FieldError message={state.errors.name} />
          </div>

          {/* ⚠️ 폭 상한은 안 건다 — 본문 칸 자체가 곁 칸(300)을 뺀 나머지라 이미 좁다 */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="project-description">
              세부 설명 <span className="text-destructive">*</span>
            </Label>
            <textarea
              id="project-description"
              name="description"
              /* ⚠️ 곁 칸(태그·색·기간·첨부)과 키를 맞춘다 — 4줄이면 왼쪽 아래가 통째로 비었다 */
              rows={8}
              value={description}
              onChange={(event) =>
                setDescription(event.target.value.slice(0, PROJECT_DESCRIPTION_MAX_LENGTH))
              }
              placeholder="예: 아티스트 공식 굿즈를 판매하는 온라인 커머스 웹을 신규 구축합니다."
              maxLength={PROJECT_DESCRIPTION_MAX_LENGTH}
              aria-invalid={Boolean(state.errors.description)}
              className="border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:border-destructive dark:bg-input/30 w-full resize-none rounded-lg border bg-transparent px-2.5 py-2 text-[13px] leading-5 transition-colors outline-none focus-visible:ring-3"
            />
            <p className="text-muted-foreground text-right text-[12px] leading-4 tabular-nums">
              {description.length}/{PROJECT_DESCRIPTION_MAX_LENGTH}
            </p>
            <FieldError message={state.errors.description} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>
              참여 팀 <span className="text-destructive">*</span>
            </Label>
            <div className="flex flex-col gap-2">
              {teamRows.map((row) => (
                <div key={row.rowId} className="flex items-center gap-2">
                  <Select
                    value={row.team}
                    onValueChange={(value) => updateTeamRow(row.rowId, value ?? "")}
                  >
                    <SelectTrigger aria-label="참여 팀 선택" className="w-48">
                      <SelectValue placeholder="팀 선택" />
                    </SelectTrigger>
                    <SelectContent side="bottom" alignItemWithTrigger={false}>
                      {teamOptions.map((team) => (
                        <SelectItem
                          key={team}
                          value={team}
                          disabled={team !== row.team && usedTeams.has(team)}
                        >
                          {team}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {teamRows.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label="이 팀 지정 삭제"
                      onClick={() => removeTeamRow(row.rowId)}
                    >
                      <X />
                    </Button>
                  )}
                  {row.team && <input type="hidden" name="teamNames" value={row.team} />}
                </div>
              ))}

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-fit"
                disabled={!canAddTeamRow}
                onClick={() => setTeamRows((rows) => [...rows, { rowId: nextRowId++, team: "" }])}
              >
                <Plus />팀 추가
              </Button>
            </div>
            <FieldError message={state.errors.teamNames} />
          </div>
        </div>

        {/* 곁 칸 — 정하는 것 */}
        <div className="flex flex-col gap-5 lg:w-[300px] lg:shrink-0">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="project-tag">
              프로젝트 태그 <span className="text-destructive">*</span>
            </Label>
            <Input
              id="project-tag"
              name="tag"
              value={tag}
              onChange={(event) => setTag(toTagInput(event.target.value))}
              placeholder="GOODS"
              maxLength={PROJECT_TAG_MAX_LENGTH}
              className="font-mono"
              aria-invalid={Boolean(state.errors.tag)}
            />
            <p className="text-muted-foreground text-[12px] leading-4">
              영문 대문자만, 최대 {PROJECT_TAG_MAX_LENGTH}자
            </p>
            <FieldError message={state.errors.tag} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>
              태그 색상 <span className="text-destructive">*</span>
            </Label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={cycleTagColor}
                className="ring-offset-background size-8 shrink-0 rounded-full ring-2 ring-offset-2 transition-transform outline-none active:scale-95"
                style={
                  {
                    backgroundColor: mainColor.solidColor,
                    "--tw-ring-color": mainColor.solidColor,
                  } as CSSProperties
                }
                aria-label={`태그 색상: ${TAG_NAME_LABEL[tagColor]} (클릭하면 다른 색으로 바뀌어요)`}
              />

              <Popover open={colorPickerOpen} onOpenChange={setColorPickerOpen}>
                <PopoverTrigger
                  render={
                    <Button type="button" variant="outline" size="sm">
                      더보기
                    </Button>
                  }
                />
                {/* 버튼 우측에, 바닥면을 버튼 바닥과 맞춰서 띄운다. */}
                <PopoverContent side="right" align="end" sideOffset={8} className="w-56">
                  <div className="grid grid-cols-4 gap-2">
                    {TAG_NAMES.map((colorName) => {
                      const color = paletteColorByName(colorName);
                      const label = TAG_NAME_LABEL[colorName];
                      return (
                        <button
                          key={colorName}
                          type="button"
                          onClick={() => {
                            setTagColor(colorName);
                            setColorPickerOpen(false);
                          }}
                          className={cn(
                            "hover:bg-muted focus-visible:ring-ring/50 flex flex-col items-center gap-1 rounded-md p-1.5 outline-none focus-visible:ring-3",
                            colorName === tagColor && "bg-muted",
                          )}
                        >
                          <span
                            className="size-6 rounded-full"
                            style={{ backgroundColor: color.solidColor }}
                            aria-hidden
                          />
                          {/* 4글자부터 칸 폭에서 줄바꿈되므로 그만큼 작게 — 전부 한 줄로 보이게 */}
                          <span
                            className={cn(
                              "text-muted-foreground whitespace-nowrap",
                              label.length >= 4 ? "text-[9px]" : "text-[11px]",
                            )}
                          >
                            {label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            {/* ⚠️ 화면엔 노출하지 않는다 — 상태·타임라인 계산용 값일 뿐 마감일처럼 보여줄 정보가
                아니다(사용자 확인). 생성 폼에서만 받는다. */}
            <Label htmlFor="project-start-date">
              시작일 <span className="text-destructive">*</span>
            </Label>
            <DatePickerField
              id="project-start-date"
              name="startDate"
              value={startDate}
              onChange={setStartDate}
              max={dueDate || undefined}
              aria-invalid={Boolean(state.errors.startDate)}
              className="w-full"
            />
            <FieldError message={state.errors.startDate} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="project-due-date">
              마감 기한 <span className="text-destructive">*</span>
            </Label>
            <DatePickerField
              id="project-due-date"
              name="dueDate"
              value={dueDate}
              onChange={setDueDate}
              min={startDate || undefined}
              aria-invalid={Boolean(state.errors.dueDate)}
              className="w-full"
            />
            <FieldError message={state.errors.dueDate} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="project-attachment">첨부파일</Label>
            <input
              ref={fileInputRef}
              id="project-attachment"
              type="file"
              className="hidden"
              onChange={(event) => setAttachmentName(event.target.files?.[0]?.name)}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full justify-start"
              onClick={() => fileInputRef.current?.click()}
            >
              <Paperclip />
              {attachmentName ?? "파일 첨부 (선택)"}
            </Button>
            {attachmentName && <input type="hidden" name="attachmentName" value={attachmentName} />}
            <p className="text-muted-foreground text-[12px] leading-4">
              프로젝트 기획서 등 참고 문서가 있다면 첨부해 주세요.
            </p>
          </div>
        </div>
      </div>

      {/* ⚠️ 제출은 **두 칸 아래 한 줄**이다 — 곁 칸에 붙이면 본문을 다 적기 전에 눈에 들어온다 */}
      <div className="border-border flex justify-end gap-2 border-t pt-5">
        <Link href={cancelHref} className={buttonVariants({ variant: "outline", size: "sm" })}>
          취소
        </Link>
        <Button
          type="submit"
          size="sm"
          disabled={isPending || !canSubmit}
          className="bg-foreground text-background hover:bg-foreground/90"
        >
          {isPending ? "생성 중…" : "프로젝트 생성"}
        </Button>
      </div>
    </form>
  );
}
