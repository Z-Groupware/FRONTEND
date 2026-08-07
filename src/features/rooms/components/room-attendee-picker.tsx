"use client";

import { Search } from "lucide-react";
import { useMemo, useState } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useProfileAvatar } from "@/hooks/use-profile-avatar";

import type { RoomMember } from "../types";

interface RoomAttendeePickerProps {
  members: RoomMember[];
  selectedIds: number[];
  onChange: (ids: number[]) => void;
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
    <label className="hover:bg-muted flex cursor-pointer items-center gap-2.5 px-3 py-2 text-sm transition-colors">
      <input
        type="checkbox"
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
export function RoomAttendeePicker({ members, selectedIds, onChange }: RoomAttendeePickerProps) {
  const [keyword, setKeyword] = useState("");

  const visible = useMemo(() => {
    const query = keyword.trim().toLowerCase();
    if (!query) return members;
    return members.filter((member) => member.name.toLowerCase().includes(query));
  }, [members, keyword]);

  function toggle(id: number) {
    onChange(
      selectedIds.includes(id) ? selectedIds.filter((value) => value !== id) : [...selectedIds, id],
    );
  }

  return (
    <div className="flex h-full flex-col gap-2">
      <Label>참석자</Label>

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
          <p className="text-muted-foreground px-3 py-3 text-xs">검색 결과가 없어요</p>
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
