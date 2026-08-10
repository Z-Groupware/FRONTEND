"use client";

import { Search, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { Input } from "@/components/ui/input";

import { recordSearchAction } from "../actions";

/** 적기를 멈춘 뒤 이만큼 지나면 보낸다 — 짧으면 요청이 줄줄이 나가고 길면 굼떠 보인다 */
const SEARCH_DEBOUNCE_MS = 300;

interface SearchInputProps {
  keyword: string;
}

/**
 * 검색창 — **상호작용 잎사귀만** 클라이언트다(§핵심 4원칙 1).
 *
 * ⚠️ 검색어는 **주소에 적는다**(`?q=`). 화면 안 상태로 두면 새로고침·뒤로 가기에서
 *    조건이 날아가고, 찾은 결과를 남에게 링크로 보낼 수도 없다(`people-search.tsx`와 같은 규칙).
 * ⚠️ **적는 동안 기록하지 않는다.** 한 글자마다 최근 검색어를 남기면 "ㅈ"·"제"·"제품"이
 *    전부 기록된다 — 잠깐 멈추면 그때 주소를 바꾸고, 그때 딱 한 번만 기록한다.
 */
export function SearchInput({ keyword }: SearchInputProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [value, setValue] = useState(keyword);
  /* 마지막으로 `value`를 맞춘 주소값 — 아래 렌더 중 동기화가 한 번만 일어나게 지키는 표시다 */
  const [syncedKeyword, setSyncedKeyword] = useState(keyword);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  /*
    ⚠️ **주소가 바깥에서 바뀌면 입력칸도 맞춘다 — 렌더 중에, 이펙트가 아니다**
       (react.dev "Adjusting some state when a prop changes"). 최근 검색어 칩·탭처럼
       `Link`로 `q`가 바뀌는 경로가 따로 있다 — 그때 입력칸이 옛 글자를 그대로 들고 있으면
       주소와 화면이 다른 말을 한다.
    ⚠️ 여기서 타이머를 직접 건드리지 않는다(ref는 렌더 중에 못 읽는다) — `value`가 이
       렌더에서 `keyword`로 맞춰지면 아래 디바운스 이펙트가 다시 돌면서 **그 이펙트의
       클린업이** 밀린 타이머를 알아서 지운다.
  */
  if (keyword !== syncedKeyword) {
    setSyncedKeyword(keyword);
    setValue(keyword);
  }

  useEffect(() => {
    if (value.trim() === keyword.trim()) return;
    debounceTimer.current = setTimeout(() => commit(value), SEARCH_DEBOUNCE_MS);
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [value, keyword, commit]);

  return (
    <div className="relative w-full">
      <Search
        className="text-muted-foreground/70 pointer-events-none absolute top-1/2 left-5 size-[18px] -translate-y-1/2"
        aria-hidden
      />
      <Input
        id="workbench-search"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="회의·액션·프로젝트·사람을 검색해 주세요"
        /*
          ⚠️ **찾으러 온 사람이 제일 먼저 보는 것**이라 크게 세운다(h-13·완전 둥근 모서리).
             검색 서비스들이 입력을 크고 둥글게 두는 이유는 "여기에 쓰면 된다"를 모양으로
             말하기 때문이다 — 다른 폼 입력과 같은 크기면 그 말을 못 한다.
          ⚠️ 그림자는 **아주 얕게**. 사내 도구라 붕 떠 보이면 산만하다(§디자인 토큰).
          ⚠️ 글자는 다섯 크기의 `13px`이다 — 상자가 커졌다고 글자까지 키우지 않는다.
        */
        className="focus-visible:border-foreground/30 h-13 rounded-full pl-12 text-[13px] shadow-[0_1px_2px_color-mix(in_oklch,var(--foreground)_5%,transparent),0_2px_8px_color-mix(in_oklch,var(--foreground)_4%,transparent)] md:text-[13px]"
      />
      <label htmlFor="workbench-search" className="sr-only">
        검색
      </label>

      {value.length > 0 && (
        <button
          type="button"
          aria-label="검색어 지우기"
          onClick={() => setValue("")}
          className="text-muted-foreground hover:text-foreground focus-visible:ring-ring absolute top-1/2 right-4 flex size-7 -translate-y-1/2 items-center justify-center rounded-full focus-visible:ring-2 focus-visible:outline-hidden"
        >
          <X className="size-4" aria-hidden />
        </button>
      )}
    </div>
  );
}
