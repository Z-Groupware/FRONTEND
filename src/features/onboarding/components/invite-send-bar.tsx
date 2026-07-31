"use client";

import { Mail, Plus } from "lucide-react";

interface InviteSendBarProps {
  /** 이번에 나갈 줄 수 — 주소가 유효하고 아직 안 보낸 것 */
  sendableCount: number;
  onAddRow: () => void;
  onSend: () => void;
}

/**
 * 카드 하단 바 — [행 추가]와 [초대 발송].
 *
 * 추가 버튼이 목록 안에 있으면 줄이 늘 때마다 아래로 밀려 스크롤해야 눌린다 — 여기 고정한다.
 * 제출 버튼은 하단 우측(CONVENTIONS §9).
 */
export function InviteSendBar({ sendableCount, onAddRow, onSend }: InviteSendBarProps) {
  return (
    <div className="border-border bg-muted flex h-[54px] shrink-0 items-center gap-3 border-t px-4">
      <button
        type="button"
        onClick={onAddRow}
        className="text-muted-foreground hover:bg-foreground/10 focus-visible:ring-ring flex h-7 shrink-0 items-center gap-1.5 rounded-md px-2.5 text-xs leading-none transition-colors focus-visible:ring-2 focus-visible:outline-none"
      >
        <Plus className="size-3.5" />
        <span className="leading-none">행 추가</span>
      </button>

      <span className="flex-1" aria-hidden />

      {/* 인원 수는 버튼이 아니라 여기서 알린다 — 버튼이 커지지 않게 */}
      <p className="text-muted-foreground/70 hidden text-[11px] leading-4 sm:block">
        {sendableCount > 0
          ? `${sendableCount}명에게 보내요`
          : "초대받은 사람이 링크로 계정을 만들 수 있어요"}
      </p>

      {/* ⚠️ 실제 메일 발송은 서버가 한다. 지금은 목록만 담아두고 [완료]에서 커밋한다. */}
      <button
        type="button"
        disabled={sendableCount === 0}
        onClick={onSend}
        className="bg-foreground text-background hover:bg-foreground/90 focus-visible:ring-ring flex h-7 shrink-0 items-center gap-1.5 rounded-md px-2.5 text-xs leading-none transition-colors focus-visible:ring-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-40"
      >
        <Mail className="size-3.5" />
        <span className="leading-none">초대 발송</span>
      </button>
    </div>
  );
}
