"use client";

import { Search } from "lucide-react";
import { useMemo, useState } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useProfileAvatar } from "@/hooks/use-profile-avatar";

import {
  ATTENDEE_SCOPE_EMPTY,
  attendeeScopeGuideOf,
  type AttendeeScopeViewer,
  filterAttendeeCandidates,
} from "../attendee-scope";
import type { RoomMember } from "../types";

interface RoomAttendeePickerProps {
  members: RoomMember[];
  selectedIds: number[];
  onChange: (ids: number[]) => void;
  /**
   * 개설자 — 참석자 범위를 **이 값이 강제로** 정한다(`attendee-scope.ts`).
   * ⚠️ 예전 `viewerTeamName: string | null` 하나를 대체한다(2026-08-13). 팀 이름만으로
   *    "팀이 없으니 Owner"라고 **간접 추론**하던 자리인데, 그건 팀 정보가 비어 온 Leader를
   *    Owner로 읽는다 — 권한은 직급(`role`)에서 온다(CLAUDE.md §조직 계층).
   */
  viewer: AttendeeScopeViewer;
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
 * 회의실 예약·참석자 교체의 "참석자" 선택 — 검색으로 좁히되, 결과는 **후보 전체를 체크박스로**
 * 보여준다(디자인 반영). 검색 전에는 후보가 다 보이고, 검색하면 이름이 걸리는 사람만 남는다.
 *
 * ⚠️ **필터 토글(`AttendeeFilterGroup`)이 없다**(2026-08-13 확정 — 2026-08-12의 "전체 · 팀장급만"
 *    /"전체 · 내 부서만" 라디오를 걷어냈다). 범위가 개설자의 권한으로 **고정**돼 고를 것이 남지
 *    않는다: Owner면 팀장만, Leader·Member면 자기 팀만. 근거는 `attendee-scope.ts` 머리말 —
 *    **되살리지 않는다.**
 * ⚠️ 목록을 조용히 좁히지 않는다 — 왜 짧은지 라벨 옆 한 줄로 알린다(§정직성).
 * ⚠️ 여기서 좁히는 건 **UX일 뿐**이다. 제출값은 Server Action이 다시 본다(§권한).
 */
export function RoomAttendeePicker({
  members,
  selectedIds,
  onChange,
  viewer,
}: RoomAttendeePickerProps) {
  const [keyword, setKeyword] = useState("");

  const visible = useMemo(() => {
    const query = keyword.trim().toLowerCase();
    return filterAttendeeCandidates(members, viewer).filter(
      (member) => !query || member.name.toLowerCase().includes(query),
    );
  }, [members, keyword, viewer]);

  /* 후보가 아예 없는 것과 검색어에 안 걸리는 것은 원인이 달라 문구를 가른다(§정직성). */
  const hasCandidate = useMemo(
    () => filterAttendeeCandidates(members, viewer).length > 0,
    [members, viewer],
  );

  function toggle(id: number) {
    onChange(
      selectedIds.includes(id) ? selectedIds.filter((value) => value !== id) : [...selectedIds, id],
    );
  }

  return (
    <div className="flex h-full flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <Label>참석자</Label>
        <span className="text-muted-foreground text-[11px]">{attendeeScopeGuideOf(viewer)}</span>
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
            {hasCandidate ? "검색 결과가 없습니다" : ATTENDEE_SCOPE_EMPTY}
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
