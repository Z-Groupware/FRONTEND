import type { ReactNode } from "react";

import type { NoticeSummary } from "../types";
import { NoticeListItem } from "./notice-list-item";

/**
 * 공지 목록 — 카드 헤더(점+제목+우측 건수)는 DESIGN §2 카드 anatomy를 따른다.
 * 비어있으면 안내 문구로 대체한다(CLAUDE.md §정직성 · loading/error/empty).
 */
export function NoticeList({ notices, action }: { notices: NoticeSummary[]; action?: ReactNode }) {
  return (
    <div className="border-border bg-card overflow-hidden rounded-2xl border">
      <div className="border-border flex items-center justify-between gap-3 border-b px-7 pt-6 pb-3">
        {/* ⚠️ 제목 앞 검은 점을 뺀다 — 상태점과 같은 생김새라 뜻이 있는 표식처럼 읽혔다(DESIGN §5) */}
        <h2 className="text-[17px] leading-7 font-semibold tracking-[-0.3px]">공지 목록</h2>
        {/*
          ⚠️ **[새 공지]를 카드 머리 안에 둔다.** 카드 밖 위쪽에 혼자 떠 있으면 그 줄이
             빈 띠가 되고, 다른 목록 화면(프로젝트·사원)은 전부 머리 안에 둔다 —
             같은 것이 화면마다 다르면 안 된다.
        */}
        <div className="flex shrink-0 items-center gap-3">
          <p className="text-muted-foreground text-[12px] leading-4 tabular-nums">
            전체 {notices.length}개
          </p>
          {action}
        </div>
      </div>

      {notices.length === 0 ? (
        <div className="flex items-center justify-center p-10 text-center">
          {/* ⚠️ `text-sm`은 규격 밖이다 — 다섯 크기 중 13px를 쓴다(§DESIGN 4) */}
          <p className="text-muted-foreground text-[13px] leading-5">아직 등록된 공지가 없습니다</p>
        </div>
      ) : (
        <ul className="divide-border divide-y">
          {notices.map((notice) => (
            <li key={notice.id}>
              <NoticeListItem notice={notice} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
