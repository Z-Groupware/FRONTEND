"use client";

import { Search, X } from "lucide-react";
import { useMemo, useState } from "react";

import { Input } from "@/components/ui/input";

import type { RoomMember } from "../types";

interface RoomAttendeePickerProps {
  members: RoomMember[];
  selectedIds: number[];
  onChange: (ids: number[]) => void;
}

/** 검색 결과로 한 번에 보여줄 최대 인원 — `notice-company-picker.tsx`와 같은 값. */
const MAX_RESULTS = 6;

/** 회의실 예약 "참석자" 선택 — 이름으로 검색해 여러 명을 골라 담는다(`notice-company-picker.tsx`와 같은 모양). */
export function RoomAttendeePicker({ members, selectedIds, onChange }: RoomAttendeePickerProps) {
  const [keyword, setKeyword] = useState("");

  const selected = useMemo(
    () => members.filter((member) => selectedIds.includes(member.id)),
    [members, selectedIds],
  );

  const results = useMemo(() => {
    const query = keyword.trim().toLowerCase();
    if (!query) return [];
    return members
      .filter(
        (member) => !selectedIds.includes(member.id) && member.name.toLowerCase().includes(query),
      )
      .slice(0, MAX_RESULTS);
  }, [members, keyword, selectedIds]);

  const handleAdd = (id: number) => {
    onChange([...selectedIds, id]);
    setKeyword("");
  };
  const handleRemove = (id: number) => onChange(selectedIds.filter((value) => value !== id));

  return (
    <div className="flex flex-col gap-2">
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

      {keyword.trim().length > 0 && (
        <div className="border-border overflow-hidden rounded-lg border">
          {results.length === 0 ? (
            <p className="text-muted-foreground px-3 py-3 text-xs">검색 결과가 없어요</p>
          ) : (
            <ul>
              {results.map((member) => (
                <li key={member.id}>
                  <button
                    type="button"
                    onClick={() => handleAdd(member.id)}
                    className="hover:bg-muted focus-visible:ring-ring flex w-full items-center px-3 py-2 text-left transition-colors focus-visible:ring-2 focus-visible:outline-none"
                  >
                    <span className="text-foreground truncate text-xs">{member.name}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {selected.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((member) => (
            <span
              key={member.id}
              className="bg-muted text-foreground inline-flex items-center gap-1 rounded-md py-1 pr-1 pl-2 text-xs"
            >
              {member.name}
              <button
                type="button"
                onClick={() => handleRemove(member.id)}
                aria-label={`${member.name} 제외`}
                className="hover:bg-foreground/10 focus-visible:ring-ring flex size-4 items-center justify-center rounded transition-colors focus-visible:ring-2 focus-visible:outline-none"
              >
                <X className="size-3" aria-hidden />
              </button>
            </span>
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground text-[11px]">참석자를 검색해 선택하세요</p>
      )}
    </div>
  );
}
