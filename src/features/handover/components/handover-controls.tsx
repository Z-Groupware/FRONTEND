import Link from "next/link";

import type { HandoverType } from "@/constants/domain";
import { cn } from "@/lib/utils";

import {
  DEFAULT_HANDOVER_PREVIEW,
  DEFAULT_HANDOVER_TYPE,
  HANDOVER_PREVIEW_TABS,
  HANDOVER_TYPE_TABS,
  type HandoverPreview,
} from "../lib";

interface HandoverControlsProps {
  activePreview: HandoverPreview;
  activeType: HandoverType;
}

function buildHref(preview: HandoverPreview, type: HandoverType): string {
  const params = new URLSearchParams();
  if (preview !== DEFAULT_HANDOVER_PREVIEW) params.set("as", preview);
  if (type !== DEFAULT_HANDOVER_TYPE) params.set("type", type);
  const query = params.toString();
  return query ? `/app/handover?${query}` : "/app/handover";
}

/**
 * 미리보기 토글 + 휴직/오프보딩 탭 — 둘 다 **서버우선 `<Link>`**(team/members 컨트롤과
 * 같은 결). 한쪽을 바꿀 때 다른 쪽 값은 유지해야 해서 항상 같이 넘긴다.
 */
export function HandoverControls({ activePreview, activeType }: HandoverControlsProps) {
  return (
    <div className="flex flex-col gap-3">
      {/*
        ⚠️ **무채색이다**(2026-08-11). 주황 테두리·바탕이었는데, 이건 연동 전 임시 도구이지
           경고가 아니다 — 색으로 알리는 건 에러(빨강)뿐이다(DESIGN §5).
      */}
      <div className="border-border bg-secondary/50 flex items-center gap-3 rounded-lg border px-3 py-2">
        <span className="text-muted-foreground shrink-0 text-[12px] leading-4 font-medium">
          임시 미리보기
        </span>
        <div role="group" aria-label="미리보기 인물" className="flex items-center gap-1">
          {HANDOVER_PREVIEW_TABS.map((tab) => (
            <Link
              key={tab.preview}
              href={buildHref(tab.preview, activeType)}
              aria-pressed={activePreview === tab.preview}
              className={cn(
                "rounded-md px-2 py-1 text-[12px] leading-4 transition-colors",
                activePreview === tab.preview
                  ? "bg-foreground text-background font-medium"
                  : "text-muted-foreground hover:bg-muted",
              )}
            >
              {tab.label}
            </Link>
          ))}
        </div>
        <span className="text-muted-foreground text-[11px] leading-4">
          — 로그인 연동 전까지만 쓰는 화면 확인용입니다.
        </span>
      </div>

      <nav aria-label="인수인계 종류" className="border-border flex gap-4 border-b">
        {HANDOVER_TYPE_TABS.map((tab) => (
          <Link
            key={tab.type}
            href={buildHref(activePreview, tab.type)}
            aria-current={activeType === tab.type ? "page" : undefined}
            className={cn(
              "-mb-px border-b-2 px-1 pb-2 text-[13px] leading-5 font-medium transition-colors",
              activeType === tab.type
                ? "border-foreground text-foreground"
                : "text-muted-foreground hover:text-foreground border-transparent",
            )}
          >
            {tab.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
