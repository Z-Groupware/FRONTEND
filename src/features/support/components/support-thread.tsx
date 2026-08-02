"use client";

import { ArrowUpRight, Mail } from "lucide-react";
import Link from "next/link";

import { FAQ_FALLBACK, type FaqEntry, SUPPORT_EMAIL } from "../faq";

/** 한 번의 문답 — 답을 못 찾았으면 `entry`가 `null`이다 */
export interface Turn {
  question: string;
  entry: FaqEntry | null;
}

interface SupportThreadProps {
  turns: readonly Turn[];
  /** 처음 열었을 때 보여줄 질문 목록 */
  entries: readonly FaqEntry[];
  onPick: (entry: FaqEntry) => void;
}

/**
 * 주고받은 내용.
 *
 * ⚠️ 아직 아무것도 안 물었으면 **질문 목록**을 보여준다. 빈 채팅창은 뭘 물어야 할지 모르게 한다.
 * ⚠️ 답을 못 찾으면 아무 답이나 내놓지 않고 **모른다고 말하고** 문의처를 준다(§정직성).
 * ⚠️ `role="log"` — 답이 새로 붙는 걸 스크린 리더가 따라 읽는다.
 */
export function SupportThread({ turns, entries, onPick }: SupportThreadProps) {
  return (
    <div role="log" className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
      {turns.length === 0 && (
        <>
          <p className="text-guide-muted text-[12px] leading-[18px]">이런 것들을 물어보셨어요</p>
          <ul className="flex flex-col gap-1.5">
            {entries.map((entry) => (
              <li key={entry.id}>
                <button
                  type="button"
                  onClick={() => onPick(entry)}
                  className="text-guide-foreground border-guide-border focus-visible:ring-guide-muted/40 w-full rounded-lg border bg-white/[0.04] px-3 py-2 text-left text-[12px] leading-[18px] transition-colors hover:bg-white/[0.08] focus-visible:ring-2 focus-visible:outline-hidden"
                >
                  {entry.question}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}

      {turns.map((turn, index) => (
        <div key={`${turn.question}-${index}`} className="flex flex-col gap-2">
          {/* 물어본 말 — 오른쪽에 붙여 누가 한 말인지 모양으로 구분한다 */}
          <p className="bg-guide-foreground text-guide-surface ml-auto max-w-[85%] rounded-2xl rounded-br-sm px-3 py-2 text-[12px] leading-[18px] break-keep">
            {turn.question}
          </p>

          <div className="border-guide-border max-w-[92%] rounded-2xl rounded-bl-sm border bg-white/[0.04] px-3 py-2.5">
            <p className="text-guide-foreground text-[12px] leading-[19px] break-keep">
              {turn.entry?.answer ?? FAQ_FALLBACK}
            </p>

            {turn.entry?.links && (
              <div className="flex flex-wrap gap-1.5 pt-2">
                {turn.entry.links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="text-guide-foreground border-guide-border focus-visible:ring-guide-muted/40 inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] leading-4 transition-colors hover:bg-white/[0.08] focus-visible:ring-2 focus-visible:outline-hidden"
                  >
                    {link.label}
                    <ArrowUpRight className="size-3" aria-hidden />
                  </Link>
                ))}
              </div>
            )}

            {/* 못 찾았을 때만 문의처를 붙인다 — 답을 준 자리에 또 물어보라고 하면 어수선하다 */}
            {!turn.entry && (
              <a
                href={`mailto:${SUPPORT_EMAIL}`}
                className="text-guide-foreground border-guide-border focus-visible:ring-guide-muted/40 mt-2 inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[11px] leading-4 transition-colors hover:bg-white/[0.08] focus-visible:ring-2 focus-visible:outline-hidden"
              >
                <Mail className="size-3" aria-hidden />
                <span className="translate-y-px">{SUPPORT_EMAIL}</span>
              </a>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
