"use client";

import { Search } from "lucide-react";
import { useMemo, useState } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AUTHORITY } from "@/constants/authority";
import { useProfileAvatar } from "@/hooks/use-profile-avatar";
import { cn } from "@/lib/utils";

import {
  ROOM_ATTENDEE_FILTER,
  ROOM_ATTENDEE_FILTER_LABEL,
  type RoomAttendeeFilter,
} from "../constants";
import type { RoomMember } from "../types";

interface RoomAttendeePickerProps {
  members: RoomMember[];
  selectedIds: number[];
  onChange: (ids: number[]) => void;
  /** 지금 보고 있는 사람의 부서 — "내 부서만" 필터 기준(`null`이면 Owner처럼 부서가 없는 사람). */
  viewerTeamName: string | null;
}

const FILTER_OPTIONS = Object.values(ROOM_ATTENDEE_FILTER);

interface AttendeeFilterGroupProps {
  value: RoomAttendeeFilter;
  onChange: (value: RoomAttendeeFilter) => void;
}

/**
 * 참석자 필터 3종 — 서로 배타적이라 체크박스 모양이어도 동작은 라디오다(`RoomPickerList`와 같은 패턴).
 * ⚠️ 네이티브 `<input type="radio">`로 짠다(2026-08-10 정리) — 같은 `name`을 공유하는 라디오는
 *    브라우저·jsdom 모두 방향키로 이동·선택을 공짜로 지원한다(roving tabindex를 직접 짜지 않아도 된다).
 *    입력은 `sr-only`로 시각적으로만 숨기고 라벨이 모양을 그린다 — `peer-focus-visible`로 포커스
 *    링을 라벨에 얹어서, 숨긴 입력에 포커스가 가도 키보드 사용자에게는 그대로 보인다.
 */
function AttendeeFilterGroup({ value, onChange }: AttendeeFilterGroupProps) {
  return (
    <div className="flex items-center gap-1" role="radiogroup" aria-label="참석자 필터">
      {FILTER_OPTIONS.map((option) => {
        const selected = option === value;
        const inputId = `attendee-filter-${option}`;
        return (
          <label
            key={option}
            htmlFor={inputId}
            className={cn(
              "cursor-pointer rounded-full border px-2.5 py-1 text-[11px] transition-colors",
              "peer-focus-visible:ring-ring peer-focus-visible:ring-2 peer-focus-visible:ring-offset-1",
              selected
                ? "border-foreground bg-foreground/5 font-medium"
                : "border-input text-muted-foreground hover:bg-muted",
            )}
          >
            <input
              id={inputId}
              type="radio"
              name="attendee-filter"
              value={option}
              checked={selected}
              onChange={() => onChange(option)}
              className="peer sr-only"
            />
            {ROOM_ATTENDEE_FILTER_LABEL[option]}
          </label>
        );
      })}
    </div>
  );
}

const AVATAR_SIZE = 20;

/** 참석자 목록 한 줄 — 아바타는 훅이라 참석자 수만큼 이 컴포넌트를 마운트해 각자 한 번씩 부른다. */
function AttendeeRow({
  member,
  checked,
  onToggle,
}: {
  member: RoomMember;
  checked: boolean;
  onToggle: () => void;
}) {
  const avatar = useProfileAvatar(member.id, AVATAR_SIZE);

  return (
    <label className="hover:bg-muted flex cursor-pointer items-center gap-2.5 px-3 py-2 text-[13px] leading-5 transition-colors">
      <input
        type="checkbox"
        name="attendeeIds"
        value={member.id}
        checked={checked}
        onChange={onToggle}
        className="accent-foreground size-3.5 shrink-0"
      />
      {avatar}
      <span className="truncate">{member.name}</span>
    </label>
  );
}

/**
 * 회의실 예약 "참석자" 선택 — 검색으로 좁히되, 결과는 **전체 목록을 체크박스로** 보여준다
 * (디자인 반영). 검색 전에는 전체가 다 보이고, 검색하면 이름이 걸리는 사람만 남는다.
 */
export function RoomAttendeePicker({
  members,
  selectedIds,
  onChange,
  viewerTeamName,
}: RoomAttendeePickerProps) {
  const [keyword, setKeyword] = useState("");
  const [filter, setFilter] = useState<RoomAttendeeFilter>(ROOM_ATTENDEE_FILTER.ALL);

  const visible = useMemo(() => {
    const query = keyword.trim().toLowerCase();
    return members
      .filter((member) => {
        if (filter === ROOM_ATTENDEE_FILTER.LEADER) return member.authority === AUTHORITY.LEADER;
        if (filter === ROOM_ATTENDEE_FILTER.MY_TEAM) {
          return viewerTeamName !== null && member.teamName === viewerTeamName;
        }
        return true;
      })
      .filter((member) => !query || member.name.toLowerCase().includes(query));
  }, [members, keyword, filter, viewerTeamName]);

  function toggle(id: number) {
    onChange(
      selectedIds.includes(id) ? selectedIds.filter((value) => value !== id) : [...selectedIds, id],
    );
  }

  return (
    <div className="flex h-full flex-col gap-2">
      <div className="flex items-center justify-between">
        <Label>참석자</Label>
        <AttendeeFilterGroup value={filter} onChange={setFilter} />
      </div>

      <div className="relative">
        <Search
          className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2"
          aria-hidden
        />
        <Input
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
          placeholder="이름으로 검색"
          aria-label="참석자 검색"
          className="pl-8"
        />
      </div>

      <div className="border-border min-h-0 flex-1 overflow-y-auto rounded-lg border">
        {visible.length === 0 ? (
          <p className="text-muted-foreground px-3 py-3 text-[12px] leading-4">
            검색 결과가 없습니다
          </p>
        ) : (
          visible.map((member) => (
            <AttendeeRow
              key={member.id}
              member={member}
              checked={selectedIds.includes(member.id)}
              onToggle={() => toggle(member.id)}
            />
          ))
        )}
      </div>

      <p className="text-muted-foreground text-[11px]">선택 {selectedIds.length}명</p>
    </div>
  );
}
