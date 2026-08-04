import { NOTICE_TARGET_LABEL } from "@/constants/domain";

import type { NoticeHistoryItem } from "../types";

/** "발행 이력" 카드 — 순수 표시라 서버에서 그린다. 비어있으면 안내 문구로 대체한다(§정직성). */
export function NoticeHistoryCard({ items }: { items: NoticeHistoryItem[] }) {
  return (
    <section className="border-border bg-card overflow-hidden rounded-xl border">
      <h2 className="text-foreground border-border border-b px-4 py-3 text-sm font-semibold">
        발행 이력
      </h2>

      {items.length === 0 ? (
        <p className="text-muted-foreground px-4 py-10 text-center text-xs">
          아직 발행한 공지가 없어요
        </p>
      ) : (
        <ul>
          {items.map((item) => (
            <li
              key={item.id}
              className="border-border hover:bg-muted/40 border-b px-4 py-3 transition-colors last:border-b-0"
            >
              <div className="mb-1 flex items-start justify-between gap-2">
                <p className="text-foreground text-xs font-medium">{item.title}</p>
                <span className="text-muted-foreground/70 shrink-0 text-[11px] tabular-nums">
                  {item.sentAt}
                </span>
              </div>
              <div className="text-muted-foreground flex items-center gap-2 text-[11px]">
                <span>{NOTICE_TARGET_LABEL[item.target]}</span>
                <span aria-hidden>·</span>
                <span className="tabular-nums">{item.recipientCompanyCount}개사 발송</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
