import { ChevronRight, type LucideIcon } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

export interface ActionDetailInfoItem {
  key: string;
  icon: LucideIcon;
  label: string;
  content: ReactNode;
  /** 있으면 그 항목의 상세로 이동(클릭 가능). 없으면 텍스트만(예: 아직 없는 라우트). */
  href?: string;
}

interface ActionDetailInfoCardProps {
  items: ActionDetailInfoItem[];
}

/**
 * 액션 상세(팀 액션·개인 액션 공용) 우측 sticky 세부 정보 카드.
 * 항목은 호출부가 조합한다 — 담당자·출처 회의·상위 팀 액션·관련 프로젝트 등
 * 화면마다 있고 없는 항목이 달라서 이 컴포넌트는 순서·구성을 모른다.
 */
export function ActionDetailInfoCard({ items }: ActionDetailInfoCardProps) {
  return (
    <aside className="border-border bg-card sticky top-7 flex flex-col overflow-hidden rounded-2xl border">
      <div className="flex items-center gap-2 px-7 pt-6 pb-3">
        <span className="bg-foreground size-2 rounded-full" aria-hidden />
        <h3 className="text-[17px] leading-7 font-semibold tracking-[-0.3px]">세부 정보</h3>
      </div>
      <div className="divide-border border-border flex flex-col divide-y border-t">
        {items.map((item) => {
          const Icon = item.icon;
          const row = (
            <div className="flex items-center gap-3 px-7 py-4">
              <span className="bg-muted flex size-8 shrink-0 items-center justify-center rounded-full">
                <Icon className="text-muted-foreground size-4" aria-hidden />
              </span>
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <p className="text-muted-foreground text-[11px] leading-4">{item.label}</p>
                <div className="text-[13px] leading-5 font-medium">{item.content}</div>
              </div>
              {item.href && (
                <ChevronRight className="text-muted-foreground size-4 shrink-0" aria-hidden />
              )}
            </div>
          );

          return item.href ? (
            <Link
              key={item.key}
              href={item.href}
              className="hover:bg-foreground/[0.03] transition-colors"
            >
              {row}
            </Link>
          ) : (
            <div key={item.key}>{row}</div>
          );
        })}
      </div>
    </aside>
  );
}
