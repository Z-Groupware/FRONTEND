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
import { MEETING_TOPIC_MAIN_LABEL, type MeetingTopicSub } from "@/constants/meeting";

import type {
  MeetingRoom,
  RoomMember,
  RoomProjectOption,
  RoomReservationFormErrors,
} from "../types";
import { RoomAttendeePicker } from "./room-attendee-picker";
import { NO_PROJECT_VALUE, type RoomReservationFormValues } from "./use-room-reservation-form";

interface RoomReservationFieldsProps {
  form: RoomReservationFormValues;
  setForm: Dispatch<SetStateAction<RoomReservationFormValues>>;
  errors: RoomReservationFormErrors;
  rooms: MeetingRoom[];
  members: RoomMember[];
  projects: RoomProjectOption[];
  topicSubOptions: MeetingTopicSub[];
}

/** 예약 모달의 입력 필드 전부 — 제목·회의실·프로젝트·대주제/소주제·참석자(`room-reservation-dialog.tsx`에서 뺀 조각). */
export function RoomReservationFields({
  form,
  setForm,
  errors,
  rooms,
  members,
  projects,
  topicSubOptions,
}: RoomReservationFieldsProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="reservation-title">회의 제목</Label>
        <Input
          id="reservation-title"
          value={form.title}
          onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
          placeholder="회의 제목을 입력해 주세요"
          aria-invalid={Boolean(errors.title)}
        />
        {errors.title && <p className="text-destructive text-xs">{errors.title}</p>}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="reservation-room">회의실</Label>
        <Select
          value={form.roomId}
          onValueChange={(value) => setForm((prev) => ({ ...prev, roomId: value ?? "" }))}
        >
          <SelectTrigger
            id="reservation-room"
            aria-invalid={Boolean(errors.roomId)}
            className="w-full"
          >
            <SelectValue placeholder="회의실을 선택해 주세요" />
          </SelectTrigger>
          <SelectContent>
            {rooms.map((room) => (
              <SelectItem key={room.id} value={room.id}>
                {room.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.roomId && <p className="text-destructive text-xs">{errors.roomId}</p>}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="reservation-project">프로젝트</Label>
        <Select
          value={form.projectId}
          onValueChange={(value) =>
            setForm((prev) => ({ ...prev, projectId: value ?? NO_PROJECT_VALUE }))
          }
        >
          <SelectTrigger id="reservation-project" className="w-full">
            <SelectValue placeholder="프로젝트를 선택해 주세요" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NO_PROJECT_VALUE}>없음</SelectItem>
            {projects.map((project) => (
              <SelectItem key={project.id} value={project.id}>
                {project.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.projectId && <p className="text-destructive text-xs">{errors.projectId}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="reservation-topic-main">대주제</Label>
          <Select
            value={form.topicMain}
            onValueChange={(value) =>
              setForm((prev) => ({ ...prev, topicMain: value ?? "", topicSub: "" }))
            }
          >
            <SelectTrigger
              id="reservation-topic-main"
              aria-invalid={Boolean(errors.topicMain)}
              className="w-full"
            >
              <SelectValue placeholder="대주제" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(MEETING_TOPIC_MAIN_LABEL).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.topicMain && <p className="text-destructive text-xs">{errors.topicMain}</p>}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="reservation-topic-sub">소주제</Label>
          <Select
            value={form.topicSub}
            onValueChange={(value) => setForm((prev) => ({ ...prev, topicSub: value ?? "" }))}
            disabled={!form.topicMain}
          >
            <SelectTrigger
              id="reservation-topic-sub"
              aria-invalid={Boolean(errors.topicSub)}
              className="w-full"
            >
              <SelectValue placeholder="소주제" />
            </SelectTrigger>
            <SelectContent>
              {topicSubOptions.map((sub) => (
                <SelectItem key={sub.value} value={sub.value}>
                  {sub.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.topicSub && <p className="text-destructive text-xs">{errors.topicSub}</p>}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>참석자</Label>
        <RoomAttendeePicker
          members={members}
          selectedIds={form.attendeeIds}
          onChange={(attendeeIds) => setForm((prev) => ({ ...prev, attendeeIds }))}
        />
        {errors.attendeeIds && <p className="text-destructive text-xs">{errors.attendeeIds}</p>}
      </div>
    </div>
  );
}
