"use client";

import { Search } from "lucide-react";
import { useMemo, useState } from "react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

import { filterMembers, searchMembers } from "../manage-filter";
import {
  type ManagedMember,
  MEMBER_FILTER,
  MEMBER_FILTER_LABEL,
  type MemberFilter,
} from "../manage-types";
import { AccountIssueDialog } from "./account-issue-dialog";
import { MemberTable } from "./member-table";

/**
 * 사원 목록 — 검색·필터는 **화면 안에서** 한다.
 *
 * ⚠️ 열 명 남짓이라 서버 왕복을 만들지 않는다. 목록이 수백으로 늘면 그때 서버 페이징으로
 *    옮긴다(§목록·페이지네이션) — 지금 무한 스크롤을 붙이면 쓸 일 없는 장치만 남는다.
 * ⚠️ 표 자체는 **서버가 그린 것**을 받아도 되지만, 검색어에 따라 줄이 바뀌므로 여기서 그린다.
 *    조회는 여전히 서버가 한다(page.tsx) — 클라이언트로 넘어온 건 **거르는 일**뿐이다.
 */
export function MemberListView({
  members,
  pendingTypeById,
  canIssueAccount,
  teamNames,
  positionNames,
}: {
  members: ManagedMember[];
  /** 사람 id → 대기 중인 신청 종류. 목록 행에는 종류가 없어 따로 받는다 */
  pendingTypeById: Record<number, string | undefined>;
  canIssueAccount: boolean;
  /** 계정 발급 모달이 고를 팀 — 목록이 이미 서버에서 받아 온 값이라 같이 내려보낸다 */
  teamNames: string[];
  /** 회사가 만든 직급 이름들 — 발급 창이 이 안에서만 고르게 한다 */
  positionNames: string[];
}) {
  const [keyword, setKeyword] = useState("");
  const [filter, setFilter] = useState<MemberFilter>(MEMBER_FILTER.ALL);

  const shown = useMemo(
    () => searchMembers(filterMembers(members, filter, pendingTypeById), keyword),
    [members, filter, pendingTypeById, keyword],
  );

  return (
    <div className="flex-1 overflow-y-auto px-8 py-7">
      <div className="mx-auto w-full max-w-[1440px]">
        <section className="border-border bg-card overflow-hidden rounded-2xl border">
          <div className="flex flex-wrap items-center gap-3 px-7 pt-6 pb-5">
            <div className="relative w-full max-w-[280px]">
              <Search
                className="text-muted-foreground/70 pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
                aria-hidden
              />
              <Input
                id="member-search"
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                placeholder="이름·팀·이메일 검색"
                className="pl-9"
              />
              {/* 칸 이름은 자리표시자로만 두지 않는다 — 적기 시작하면 사라진다(§a11y) */}
              <label htmlFor="member-search" className="sr-only">
                사원 검색
              </label>
            </div>

            {/*
              ⚠️ 상태 전부를 칸으로 늘어놓지 않는다. 이 화면에서 **손이 필요한 것**만 추린다 —
                 재직·퇴사는 검색으로 충분하고, 승인 대기는 놓치면 사람이 기다린다.
            */}
            {/*
              ⚠️ **하나로 묶은 세그먼트다.** 전에는 고른 칸만 먹색으로 꽉 찬 버튼이고 나머지는
                 맨 글자였다 — 고른 칸이 [계정 발급]과 무게가 같아 둘 다 "누르면 뭔가 일어나는
                 버튼"으로 보였고(실제로는 거르기다), 안 고른 칸은 테두리가 없어 누를 수 있는지
                 안 보였다.
              ⚠️ 고른 칸은 **띄워서** 알린다(밝은 면 + 옅은 그림자). 색으로 알리는 건 에러뿐이고
                 (§디자인 토큰), 먹색 채움은 이 화면에서 **행동 버튼**의 몫이다.
            */}
            <div
              className="border-border bg-secondary/60 flex items-center gap-0.5 rounded-lg border p-0.5"
              role="group"
              aria-label="사원 거르기"
            >
              {Object.values(MEMBER_FILTER).map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setFilter(value)}
                  aria-pressed={filter === value}
                  className={cn(
                    "focus-visible:ring-ring h-7 rounded-md px-3 text-[13px] leading-5 transition-colors focus-visible:ring-2 focus-visible:outline-hidden",
                    filter === value
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {MEMBER_FILTER_LABEL[value]}
                </button>
              ))}
            </div>

            <div className="ml-auto flex items-center gap-3">
              {/*
                ⚠️ 전체가 아니라 **지금 보이는 수**를 적는다. 걸러 놓고 전체를 적으면
                   화면과 숫자가 다른 말을 한다(§목록: 전체 건수를 머리에 적는다).
              */}
              <p className="text-foreground/75 text-[12px] leading-4 tabular-nums">
                {keyword.trim() || filter !== MEMBER_FILTER.ALL
                  ? `${shown.length}명 / 전체 ${members.length}명`
                  : `${members.length}명`}
              </p>

              {/*
                ⚠️ 계정 발급은 **사이드바 탭이 아니라 이 화면 안 버튼**이다(WORKFLOW §11).
                   전용 라우트를 두지 않고 **모달**로 연다 — 한 번 쓰고 마는 폼에 주소를
                   만들면 뒤로 가기가 어색해진다(공지 작성과 같은 패턴).
              */}
              {canIssueAccount && (
                <AccountIssueDialog teamNames={teamNames} positionNames={positionNames} />
              )}
            </div>
          </div>

          <MemberTable members={shown} />
        </section>
      </div>
    </div>
  );
}
