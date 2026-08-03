"use client";

import { ArrowUpRight, Mail, MessageCircleQuestion } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef } from "react";

import { ZLogo } from "@/components/icons/z-logo";

import {
  FAQ_CATEGORY,
  FAQ_CATEGORY_ICON,
  FAQ_CATEGORY_LABEL,
  type FaqCategory,
  type FaqEntry,
  SUPPORT_EMAIL,
} from "../faq";

/**
 * 오간 말 한 마디.
 *
 * ⚠️ 네 가지뿐이다 — 사람이 한 말 · 갈래 고르기 · 질문 고르기 · 답.
 *    "되묻기"를 따로 두는 게 이 화면의 핵심이다. 바로 답하면 잘못 짚는다.
 */
export type Turn =
  | { kind: "said"; text: string }
  | { kind: "categories"; text: string }
  | { kind: "choices"; text: string; entries: readonly FaqEntry[] }
  | { kind: "answer"; entry: FaqEntry };

interface SupportThreadProps {
  turns: readonly Turn[];
  onPickCategory: (category: FaqCategory) => void;
  onPickEntry: (entry: FaqEntry) => void;
}

const CHIP =
  "text-popover-foreground border-border focus-visible:ring-ring/40 flex w-full items-center gap-2 rounded-lg border bg-secondary px-3 py-1.5 text-left text-[12px] leading-[18px] transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:outline-hidden";

/**
 * 주고받은 내용.
 *
 * ⚠️ 답은 **문단 단위로 끊어** 보여준다(`whitespace-pre-line`). 한 덩어리로 흘리면
 *    말풍선 안이 글 벽이 돼서 아무도 안 읽는다.
 * ⚠️ `role="log"` — 답이 새로 붙는 걸 스크린 리더가 따라 읽는다.
 * ⚠️ 스크롤 막대는 감춘다(`scrollbar-hidden`) — 창 틀이 이미 경계를 말해 준다.
 *    **스크롤 자체는 살아 있다.** 막대만 지우는 것이라 휠·트랙패드·키보드 모두 그대로다.
 */
export function SupportThread({ turns, onPickCategory, onPickEntry }: SupportThreadProps) {
  const boxRef = useRef<HTMLDivElement>(null);

  /*
    말이 하나 늘 때마다 **맨 아래로 붙인다.**
    ⚠️ `ref` 콜백이 아니라 효과다 — 콜백은 붙는 시점이 레이아웃보다 일러 자리를 못 잡는다.
       상태를 바꾸는 게 아니라 **DOM을 굴리는** 일이라 효과가 제자리다.
    ⚠️ `behavior: "smooth"`를 쓰지 않는다. 등장 애니메이션과 겹치면 부드러운 스크롤이
       중간에 취소돼 아예 안 움직인다.
    ⚠️ 말이 아래에서부터 쌓이므로(`mt-auto`) 맨 아래가 곧 방금 온 답이다 —
       위에 가려지는 건 이미 읽은 말이라 괜찮다.
  */
  useEffect(() => {
    const box = boxRef.current;
    if (box) box.scrollTop = box.scrollHeight;
  }, [turns.length]);

  return (
    <div
      role="log"
      /* ⚠️ `role="log"`인 div는 기본적으로 포커스를 못 받는다. 스크롤바까지 숨겨 놨으므로
         `tabIndex`가 없으면 키보드만 쓰는 사람은 위로 올라간 답을 아예 못 읽는다(§a11y) */
      tabIndex={0}
      ref={boxRef}
      className="scrollbar-hidden flex flex-1 flex-col overflow-y-auto p-4"
    >
      {/*
        아직 아무것도 안 물었을 때 — 위가 텅 비어 보이지 않게 **인사 블록**을 남는 자리에 둔다.
        ⚠️ `m-auto`라 자리가 남을 때만 가운데로 밀린다. 대화가 쌓이면 사라지므로
           자리를 차지하지 않는다.
      */}
      {turns.length === 1 && (
        <div className="m-auto flex shrink-0 flex-col items-center gap-2 px-6 py-4 text-center">
          {/* ⚠️ 밝기를 따라간다 — 밝을 땐 흰 원에 먹색 Z, 어두울 땐 검은 원에 흰 Z */}
          <span className="bg-landing-stage text-landing-dark-foreground border-border flex size-11 items-center justify-center rounded-2xl border shadow-sm">
            <ZLogo className="size-4" aria-hidden />
          </span>
          <p className="text-popover-foreground text-[14px] leading-5 font-medium">
            무엇이든 물어보세요
          </p>
          {/* ⚠️ 한 줄로 끝낸다 — 두 줄이 되면 아래 목록이 잘린다 */}
          <p className="text-muted-foreground text-[12px] leading-[18px]">
            자주 묻는 것들을 모아 뒀어요
          </p>
        </div>
      )}

      {/*
        ⚠️ 말은 **아래에 붙인다**(`mt-auto`). 위에서부터 쌓으면 창을 열자마자 아래가 텅 비어
           보인다 — 메신저가 그렇게 하는 이유다.
        ⚠️ `justify-end`가 아니라 `mt-auto`다. 내용이 넘칠 때 `justify-end`는 **위쪽을
           스크롤 시작점 밖으로** 밀어내 첫 줄에 닿을 수 없게 만든다.
      */}
      <div className="mt-auto flex shrink-0 flex-col gap-2.5">
        {turns.map((turn, index) => {
          // 사람이 한 말 — 오른쪽에 붙여 누가 한 말인지 모양으로 구분한다
          if (turn.kind === "said") {
            return (
              <p
                key={index}
                className="bg-foreground text-background ml-auto max-w-[85%] rounded-2xl rounded-br-sm px-3 py-2 text-[12px] leading-[18px] break-keep"
              >
                {turn.text}
              </p>
            );
          }

          return (
            /*
            ⚠️ 말풍선마다 Z 표식을 붙이지 않는다. 한 줄 걸러 같은 그림이 반복되면 시끄럽고,
               누가 말하는지는 **좌우 위치와 모양**으로 이미 구분된다 — 표식은 머리에 하나면 된다.
          */
            <div
              key={index}
              className="border-border bg-secondary max-w-[92%] rounded-2xl rounded-bl-sm border px-3.5 py-3"
            >
              {/* ⚠️ `whitespace-pre-line` — 답에 넣어 둔 빈 줄이 그대로 문단이 된다 */}
              <p className="text-popover-foreground text-[12px] leading-[20px] break-keep whitespace-pre-line">
                {turn.kind === "answer" ? turn.entry.answer : turn.text}
              </p>

              {turn.kind === "categories" && (
                <ul className="flex flex-col gap-1 pt-2.5">
                  {Object.values(FAQ_CATEGORY).map((category) => {
                    const Icon = FAQ_CATEGORY_ICON[category];
                    return (
                      <li key={category}>
                        <button
                          type="button"
                          onClick={() => onPickCategory(category)}
                          className={CHIP}
                        >
                          <Icon className="text-muted-foreground size-3.5 shrink-0" aria-hidden />
                          {/* 한글이 아이콘보다 떠 보인다 — 1px 내려 맞춘다 */}
                          <span className="translate-y-px">{FAQ_CATEGORY_LABEL[category]}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}

              {turn.kind === "choices" && (
                <ul className="flex flex-col gap-1 pt-2.5">
                  {turn.entries.map((entry) => (
                    <li key={entry.id}>
                      <button type="button" onClick={() => onPickEntry(entry)} className={CHIP}>
                        <MessageCircleQuestion
                          className="text-muted-foreground size-3.5 shrink-0"
                          aria-hidden
                        />
                        <span className="translate-y-px">{entry.question}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              {turn.kind === "answer" && turn.entry.links && (
                <div className="flex flex-wrap gap-1.5 pt-3">
                  {turn.entry.links.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="text-popover-foreground border-border focus-visible:ring-ring/40 hover:bg-accent inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] leading-4 transition-colors focus-visible:ring-2 focus-visible:outline-hidden"
                    >
                      {link.label}
                      <ArrowUpRight className="size-3" aria-hidden />
                    </Link>
                  ))}
                </div>
              )}

              {/* 못 찾았을 때만 문의처를 붙인다 — 답을 준 자리에 또 물어보라고 하면 어수선하다 */}
              {turn.kind === "categories" && index > 0 && (
                <a
                  href={`mailto:${SUPPORT_EMAIL}`}
                  className="text-muted-foreground border-border focus-visible:ring-ring/40 hover:text-popover-foreground hover:bg-accent mt-2.5 inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[11px] leading-4 transition-colors focus-visible:ring-2 focus-visible:outline-hidden"
                >
                  <Mail className="size-3" aria-hidden />
                  <span className="translate-y-px">{SUPPORT_EMAIL}</span>
                </a>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
