"use client";

import type { Dispatch, SetStateAction } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AUTHORITY, type Authority } from "@/constants/authority";

import type {
  MeetingRoom,
  RoomProjectOption,
  RoomReservationFormErrors,
  RoomTeamActionOption,
} from "../types";
import { MeetingTopicList } from "./meeting-topic-list";
import { RoomPickerList } from "./room-picker-list";
import type { RoomReservationFormValues } from "./use-room-reservation-form";

interface RoomReservationFieldsProps {
  form: RoomReservationFormValues;
  setForm: Dispatch<SetStateAction<RoomReservationFormValues>>;
  errors: RoomReservationFormErrors;
  rooms: MeetingRoom[];
  projects: RoomProjectOption[];
  /** 지금 예약 모달을 여는 사람의 권한 — Owner가 아니면 "상위 팀 액션"이 뜬다(WORKFLOW.md §3-1). */
  hostAuthority: Authority;
  /** Host의 팀에 하달된 팀 액션 전체(프로젝트 무관) — 지금 고른 프로젝트로 화면에서 다시 거른다. */
  teamActions: RoomTeamActionOption[];
}

/**
 * 예약 모달 왼쪽 열 — 제목·회의실·프로젝트·상위 팀 액션·회의 주제(`room-reservation-dialog.tsx`가
 * 오른쪽 열의 참석자 패널과 나란히 배치한다).
 */
export function RoomReservationFields({
  form,
  setForm,
  errors,
  rooms,
  projects,
  hostAuthority,
  teamActions,
}: RoomReservationFieldsProps) {
  const selectedProjectTag = projects.find((project) => project.id === form.projectId)?.tag;
  const availableTeamActions = teamActions.filter(
    (teamAction) => teamAction.projectTag === selectedProjectTag,
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="reservation-title">회의 제목</Label>
        <Input
          id="reservation-title"
          value={form.title}
          onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
          placeholder="회의 제목을 입력하세요"
          aria-invalid={Boolean(errors.title)}
        />
        {errors.title && <p className="text-destructive text-xs">{errors.title}</p>}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>회의실</Label>
        <RoomPickerList
          rooms={rooms}
          selectedId={form.roomId}
          onChange={(roomId) => setForm((prev) => ({ ...prev, roomId }))}
          error={Boolean(errors.roomId)}
        />
        {errors.roomId && <p className="text-destructive text-xs">{errors.roomId}</p>}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="reservation-project">프로젝트</Label>
        <Select
          value={form.projectId}
          onValueChange={(value) =>
            // 프로젝트를 바꾸면 그 프로젝트 소속이 아닌 상위 팀 액션 선택은 의미가 없어진다.
            setForm((prev) => ({ ...prev, projectId: value ?? "", parentTeamActionId: "" }))
          }
        >
          <SelectTrigger
            id="reservation-project"
            aria-invalid={Boolean(errors.projectId)}
            className="w-full"
          >
            <SelectValue placeholder="프로젝트 선택" />
          </SelectTrigger>
          <SelectContent>
            {projects.map((project) => (
              <SelectItem key={project.id} value={project.id}>
                {project.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.projectId && <p className="text-destructive text-xs">{errors.projectId}</p>}
      </div>

      {hostAuthority !== AUTHORITY.OWNER && (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="reservation-parent-team-action">상위 팀 액션</Label>
          <Select
            value={form.parentTeamActionId}
            onValueChange={(value) =>
              setForm((prev) => ({ ...prev, parentTeamActionId: value ?? "" }))
            }
            disabled={!form.projectId}
          >
            <SelectTrigger
              id="reservation-parent-team-action"
              aria-invalid={Boolean(errors.parentTeamActionId)}
              className="w-full"
            >
              <SelectValue
                placeholder={form.projectId ? "상위 팀 액션 선택" : "프로젝트를 먼저 선택해 주세요"}
              />
            </SelectTrigger>
            <SelectContent>
              {availableTeamActions.map((teamAction) => (
                <SelectItem key={teamAction.id} value={String(teamAction.id)}>
                  {teamAction.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.parentTeamActionId && (
            <p className="text-destructive text-xs">{errors.parentTeamActionId}</p>
          )}
        </div>
      )}

      <MeetingTopicList
        topics={form.topics}
        onChange={(topics) => setForm((prev) => ({ ...prev, topics }))}
        error={errors.topics}
      />
    </div>
  );
}
