import { Clock } from "lucide-react";
import Link from "next/link";

import type { RecentSearchEntry } from "../types";

interface RecentSearchChipsProps {
  entries: RecentSearchEntry[];
}

/** 최근 검색어 — 누르면 그 검색어로 바로 찾는다. 순수 이동이라 서버에서 그린다. */
export function RecentSearchChips({ entries }: RecentSearchChipsProps) {
  if (entries.length === 0) return null;

  return (
    <div className="flex flex-col items-center gap-2.5">
      {/*
        ⚠️ **입력 바로 아래, 가운데다.** 왼쪽에 라벨을 붙여 섹션으로 두니 "훑어볼 목록"처럼
           보였는데, 최근 검색어는 목록이 아니라 **입력을 돕는 것**이다 — 입력 밑에 붙어야
           그 뜻이 읽힌다(검색 서비스들이 두는 자리와 같다).
      */}
      <span className="text-muted-foreground/70 text-[11px] leading-4">최근 검색어</span>
      <ul className="flex flex-wrap justify-center gap-2">
        {entries.map((entry) => (
          <li key={entry.keyword}>
            <Link
              href={`/app/search?q=${encodeURIComponent(entry.keyword)}`}
              className="border-border text-foreground hover:bg-foreground/5 focus-visible:ring-ring flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] leading-4 transition-colors focus-visible:ring-2 focus-visible:outline-hidden"
            >
              <Clock className="text-muted-foreground/70 size-3" aria-hidden />
              {entry.keyword}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
