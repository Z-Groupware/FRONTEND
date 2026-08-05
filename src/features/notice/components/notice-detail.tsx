import { Pencil } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";

import { formatNoticeDate } from "../format";
import type { Notice } from "../types";
import { MarkNoticeRead } from "./mark-notice-read";
import { NoticeDeleteButton } from "./notice-delete-button";

/** 공지 상세 — 날짜·제목·본문. 관리 권한이 있으면 수정·삭제로 갈 수 있다. */
export function NoticeDetail({ notice, canManage }: { notice: Notice; canManage: boolean }) {
  return (
    <article className="border-border bg-card mx-auto max-w-[720px] rounded-xl border p-6">
      {/* 열람하면 읽음 처리 — 화면엔 아무것도 안 그린다 */}
      <MarkNoticeRead id={notice.id} />

      <div className="flex items-start justify-between gap-3">
        <p className="text-muted-foreground text-[11px]">{formatNoticeDate(notice.publishedAt)}</p>
        {canManage && (
          <div className="flex shrink-0 gap-2">
            <Link
              href={`/app/notice/${notice.id}/edit`}
              className={buttonVariants({ variant: "outline", size: "xs" })}
            >
              <Pencil aria-hidden />
              수정
            </Link>
            <NoticeDeleteButton id={notice.id} title={notice.title} />
          </div>
        )}
      </div>

      <h2 className="text-foreground mt-2 text-lg font-semibold">{notice.title}</h2>

      <div className="border-border my-4 border-t" />

      <p className="text-muted-foreground text-sm leading-7 whitespace-pre-line">{notice.body}</p>
    </article>
  );
}
