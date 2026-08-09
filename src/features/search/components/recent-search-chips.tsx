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
    <div>
      <h2 className="text-muted-foreground mb-3 text-[12px] leading-4">최근 검색어</h2>
      <ul className="flex flex-wrap gap-2">
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
