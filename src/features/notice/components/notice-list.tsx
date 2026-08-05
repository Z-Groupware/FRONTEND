import type { NoticeSummary } from "../types";
import { NoticeListItem } from "./notice-list-item";

/** 공지 목록. 비어있으면 안내 문구로 대체한다(CLAUDE.md §정직성 · loading/error/empty). */
export function NoticeList({ notices }: { notices: NoticeSummary[] }) {
  if (notices.length === 0) {
    return (
      <div className="border-border bg-card flex items-center justify-center rounded-lg border p-10 text-center">
        <p className="text-muted-foreground text-sm">아직 등록된 공지가 없어요</p>
      </div>
    );
  }

  return (
    <ul className="border-border bg-card divide-border divide-y overflow-hidden rounded-lg border">
      {notices.map((notice) => (
        <li key={notice.id}>
          <NoticeListItem notice={notice} />
        </li>
      ))}
    </ul>
  );
}
