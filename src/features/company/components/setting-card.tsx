import type { ReactNode } from "react";

/**
 * 기업 설정의 카드 한 장.
 *
 * ⚠️ **로그인 이후 화면의 카드 규격을 따른다** — `rounded-2xl` · 머리띠 없이 `px-7 py-6`
 *    제목(15px semibold) · 구획은 `border-t`. 구독·저장소 카드와 같은 모양이다.
 *    온보딩 카드는 머리에 `bg-muted` 띠를 두르는데, 그건 **한 번 지나가는 화면**의 모양이라
 *    워크스페이스 안에 그대로 가져오면 이 화면만 다른 서비스처럼 읽힌다.
 * ⚠️ 카드 **안쪽**(팀 트리·직급 행)은 온보딩 조각을 그대로 쓴다 — 같은 것을 고치는 자리라
 *    조작이 이어져야 한다. 맞춘 건 껍데기뿐이다.
 * ⚠️ 세 덩이가 **같은 껍데기**를 쓴다. 카드마다 머리 높이·여백이 다르면 한 화면에 쌓았을 때
 *    줄이 안 맞아 서로 다른 화면을 붙여 놓은 것처럼 읽힌다.
 */
export function SettingCard({
  title,
  aside,
  children,
  footer,
}: {
  title: string;
  /** 제목 오른쪽에 붙는 작은 값(`팀 3개 · 역할 2개` 등) */
  aside?: ReactNode;
  children: ReactNode;
  /** 카드 밑단 — 저장 버튼이 온다. 없으면 줄도 안 그린다 */
  footer?: ReactNode;
}) {
  return (
    <section className="border-border bg-card rounded-2xl border">
      <div className="flex items-center justify-between gap-4 px-7 py-6">
        <h2 className="flex items-center gap-2 text-[15px] leading-6 font-semibold tracking-[-0.2px]">
          {/* 다른 카드 머리와 같은 표식 — 화면이 달라도 같은 서비스로 읽힌다 */}
          <span className="bg-foreground size-2 rounded-full" aria-hidden />
          {title}
        </h2>
        {aside && (
          <span className="text-muted-foreground shrink-0 text-[13px] leading-5 tabular-nums">
            {aside}
          </span>
        )}
      </div>

      <div className="border-border border-t">{children}</div>

      {footer && (
        <div className="border-border flex items-center justify-end gap-2 border-t px-6 py-4">
          {footer}
        </div>
      )}
    </section>
  );
}
