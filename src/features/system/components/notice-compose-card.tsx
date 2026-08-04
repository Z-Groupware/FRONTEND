"use client";

import { Check, Send } from "lucide-react";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { NOTICE_TARGET, NOTICE_TARGET_LABEL, type NoticeTarget } from "@/constants/domain";

import { publishNoticeAction } from "../actions";

const TARGET_OPTIONS = Object.values(NOTICE_TARGET);

/**
 * "공지 작성" 카드 — 제목·내용·발행 대상을 받아 공지를 발행한다.
 *
 * ⚠️ 상호작용이 있는 잎사귀라 클라이언트 컴포넌트다(CLAUDE.md §서버우선). 발행은 서버 액션
 *    (`publishNoticeAction`)으로 넘겨 토큰이 브라우저로 새지 않게 한다(§핵심 4원칙 ②).
 * ⚠️ 지금은 목이라 실제로 공지가 나가지 않는다(§정직성) — 성공 안내만 띄운다.
 */
export function NoticeComposeCard() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [target, setTarget] = useState<NoticeTarget>(NOTICE_TARGET.ALL);
  const [isSent, setIsSent] = useState(false);
  const [isPending, startTransition] = useTransition();

  const canPublish = title.trim().length > 0 && content.trim().length > 0;

  const handlePublish = () => {
    startTransition(async () => {
      const response = await publishNoticeAction({ title, content, target });
      if (response.success) setIsSent(true);
    });
  };

  return (
    <section className="border-border bg-card rounded-xl border p-5">
      <h2 className="text-foreground mb-4 text-sm font-semibold">공지 작성</h2>

      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="notice-title">제목</Label>
          <Input
            id="notice-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="공지 제목"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="notice-content">내용</Label>
          <textarea
            id="notice-content"
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder="공지 내용을 입력하세요"
            rows={5}
            className="border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 dark:bg-input/30 min-h-[120px] w-full resize-none rounded-lg border bg-transparent px-2.5 py-2 text-sm transition-colors outline-none focus-visible:ring-3"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="notice-target">발행 대상</Label>
          <Select value={target} onValueChange={(value) => setTarget(value as NoticeTarget)}>
            <SelectTrigger id="notice-target" className="w-full">
              {/* base-ui Value는 팝업이 열리기 전엔 라벨을 못 찾아 값(ALL)을 그대로 보인다 —
                  render prop으로 라벨을 직접 매핑해 첫 화면부터 "전체 기업"이 뜨게 한다. */}
              <SelectValue>{(value) => NOTICE_TARGET_LABEL[value as NoticeTarget]}</SelectValue>
            </SelectTrigger>
            <SelectContent side="bottom" alignItemWithTrigger={false}>
              {TARGET_OPTIONS.map((option) => (
                <SelectItem key={option} value={option}>
                  {NOTICE_TARGET_LABEL[option]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isSent ? (
          <div className="bg-success/12 text-success flex items-center gap-2 rounded-lg px-3 py-2.5 text-xs font-medium">
            <Check className="size-3.5 shrink-0" strokeWidth={2.5} aria-hidden />
            공지를 발행했어요
          </div>
        ) : (
          <Button
            type="button"
            size="lg"
            className="w-full bg-[#EA580C] text-white hover:bg-[#C2410C]"
            disabled={!canPublish || isPending}
            onClick={handlePublish}
          >
            <Send aria-hidden />
            발행
          </Button>
        )}
      </div>
    </section>
  );
}
