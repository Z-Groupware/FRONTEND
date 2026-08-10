import { formatDate } from "@/lib/date";

import type { Notice } from "../types";
import { MarkNoticeRead } from "./mark-notice-read";
import { NoticeDeleteButton } from "./notice-delete-button";
import { NoticeEditDialog } from "./notice-edit-dialog";

/** 공지 상세 — 날짜·제목·본문. 관리 권한이 있으면 수정·삭제로 갈 수 있다. */
export function NoticeDetail({ notice, canManage }: { notice: Notice; canManage: boolean }) {
  return (
    <article className="border-border bg-card mx-auto max-w-[720px] rounded-2xl border p-6">
      {/* 열람하면 읽음 처리 — 화면엔 아무것도 안 그린다 */}
      <MarkNoticeRead id={notice.id} />

      <div className="flex items-start justify-between gap-3">
        <p className="text-muted-foreground text-[11px]">{formatDate(notice.publishedAt)}</p>
        {canManage && (
          <div className="flex shrink-0 gap-2">
            <NoticeEditDialog notice={notice} />
            <NoticeDeleteButton id={notice.id} title={notice.title} />
          </div>
        )}
      </div>

      <h2 className="text-foreground mt-2 text-lg font-semibold">{notice.title}</h2>

      <div className="border-border my-4 border-t" />

      {/*
        ⚠️ **본문은 13px이다**(다섯 크기 — DESIGN §4). 14px은 규격 밖이고, 이 글은 읽는 글이라
           줄 간격을 넉넉히(22px) 준다.
        ⚠️ 색을 본문색으로 올린다. 보조색으로 깔아 두니 **정작 읽으라고 띄운 글이 제일 흐렸다**.
      */}
      <p className="text-foreground/85 text-[13px] leading-[22px] whitespace-pre-line">
        {notice.body}
      </p>
    </article>
  );
}
