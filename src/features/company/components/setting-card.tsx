import type { ReactNode } from "react";

/**
 * 기업 설정의 카드 한 장.
 *
 * ⚠️ 세 덩이가 **같은 껍데기**를 쓴다 — 카드마다 머리 높이·여백이 다르면 한 화면에
 *    쌓았을 때 줄이 안 맞아 서로 다른 화면을 붙여 놓은 것처럼 읽힌다.
 * ⚠️ 머리 모양은 온보딩 카드와 맞춰 뒀다(h-12 · `bg-muted` · 앞의 점) —
 *    같은 것을 고치는 자리라 생김새가 이어져야 한다.
 */
export function SettingCard({
  title,
  aside,
  children,
  footer,
}: {
  title: string;
  /** 머리 오른쪽에 붙는 작은 값(`팀 5개` 등) */
  aside?: ReactNode;
  children: ReactNode;
  /** 카드 밑단 — 저장 버튼이 온다. 없으면 줄도 안 그린다 */
  footer?: ReactNode;
}) {
  return (
    <section className="border-border bg-card flex flex-col overflow-hidden rounded-xl border shadow-sm">
      <header className="border-border bg-muted flex h-12 shrink-0 items-center justify-between border-b px-4">
        <h2 className="flex items-center gap-2 text-[13px] leading-5">
          <span className="bg-foreground size-2 rounded-full" aria-hidden />
          {title}
        </h2>
        {aside && (
          <span className="text-muted-foreground/70 text-xs leading-4 tabular-nums">{aside}</span>
        )}
      </header>

      {children}

      {footer && (
        <div className="border-border flex items-center justify-end gap-2 border-t px-4 py-3">
          {footer}
        </div>
      )}
    </section>
  );
}
