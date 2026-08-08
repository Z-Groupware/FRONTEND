"use client";

import { Search, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { Input } from "@/components/ui/input";

import { recordSearchAction } from "../actions";

/** 적기를 멈춘 뒤 이만큼 지나면 보낸다 — 짧으면 요청이 줄줄이 나가고 길면 굼떠 보인다 */
const SEARCH_DEBOUNCE_MS = 300;

/**
 * 검색창 — **상호작용 잎사귀만** 클라이언트다(§핵심 4원칙 1).
 *
 * ⚠️ 검색어는 **주소에 적는다**(`?q=`). 화면 안 상태로 두면 새로고침·뒤로 가기에서
 *    조건이 날아가고, 찾은 결과를 남에게 링크로 보낼 수도 없다(`people-search.tsx`와 같은 규칙).
 * ⚠️ **적는 동안 기록하지 않는다.** 한 글자마다 최근 검색어를 남기면 "ㅈ"·"제"·"제품"이
 *    전부 기록된다 — 잠깐 멈추면 그때 주소를 바꾸고, 그때 딱 한 번만 기록한다.
 */
export function SearchInput({ keyword }: { keyword: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [value, setValue] = useState(keyword);

  const commit = useCallback(
    (next: string) => {
      const trimmed = next.trim();
      const params = new URLSearchParams(searchParams.toString());
      if (trimmed) params.set("q", trimmed);
      else params.delete("q");

      router.replace(`/app/search${params.size > 0 ? `?${params}` : ""}`, { scroll: false });
      if (trimmed) void recordSearchAction(trimmed);
    },
    [router, searchParams],
  );

  useEffect(() => {
    if (value.trim() === keyword.trim()) return;
    const timer = setTimeout(() => commit(value), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [value, keyword, commit]);

  return (
    <div className="relative w-full">
      <Search
        className="text-muted-foreground/70 pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2"
        aria-hidden
      />
      <Input
        id="workbench-search"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="회의·액션·프로젝트·사람을 검색해 보세요"
        className="h-11 rounded-xl pl-11"
      />
      <label htmlFor="workbench-search" className="sr-only">
        검색
      </label>

      {value.length > 0 && (
        <button
          type="button"
          aria-label="검색어 지우기"
          onClick={() => setValue("")}
          className="text-muted-foreground hover:text-foreground focus-visible:ring-ring absolute top-1/2 right-3 flex size-6 -translate-y-1/2 items-center justify-center rounded-md focus-visible:ring-2 focus-visible:outline-hidden"
        >
          <X className="size-4" aria-hidden />
        </button>
      )}
    </div>
  );
}
