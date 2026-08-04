import { formatNoticeDate } from "../format";
import type { Notice } from "../types";

/** 공지 상세 — 날짜·제목·본문. 순수 표시라 서버에서 그린다. */
export function NoticeDetail({ notice }: { notice: Notice }) {
  return (
    <article className="border-border bg-card mx-auto max-w-[720px] rounded-xl border p-6">
      <p className="text-muted-foreground text-[11px]">{formatNoticeDate(notice.publishedAt)}</p>
      <h2 className="text-foreground mt-2 text-lg font-semibold">{notice.title}</h2>

      <div className="border-border my-4 border-t" />

      <p className="text-muted-foreground text-sm leading-7 whitespace-pre-line">{notice.body}</p>
    </article>
  );
}
