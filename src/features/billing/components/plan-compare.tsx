import { Check, Minus } from "lucide-react";

import { PLAN_COMPARE } from "../plans";

/**
 * 플랜별 기능 비교표.
 *
 * 카드만으로는 "Free의 모든 기능"이 무엇인지 알 수 없다 — 여기서 항목을 펼쳐 보여준다.
 * ⚠️ 되는 것은 체크, 안 되는 것은 빗금이다. 색으로 알리지 않는다(§디자인 토큰).
 */
export function PlanCompare({ isFullWidth = false }: { isFullWidth?: boolean }) {
  return (
    /* 온보딩(/pricing)에선 640px 카드 폭 + 자체 라벨, 랜딩(/plans)에선 페이지가 제목을 단다 */
    <div className={isFullWidth ? "w-full" : "mx-auto w-full max-w-[640px] pt-4 pb-7"}>
      {!isFullWidth && (
        <p className="text-muted-foreground pb-2.5 text-[12px] leading-[18px]">플랜별 기능</p>
      )}

      {/* 표에도 바탕을 준다 — 없으면 뒤 배경(3D Z)이 줄 사이로 비친다 */}
      <div className="border-border bg-card overflow-x-auto rounded-xl border">
        <table className="w-full min-w-[380px] border-collapse text-left">
          <caption className="sr-only">Free 플랜과 Team 플랜의 기능 비교</caption>
          <thead>
            <tr className="border-border bg-secondary border-b">
              <th scope="col" className="px-4 py-2.5 text-[12px] leading-[18px] font-medium">
                기능
              </th>
              <th
                scope="col"
                className="w-[76px] px-2 py-2.5 text-center text-[12px] leading-[18px] font-medium"
              >
                Free
              </th>
              <th
                scope="col"
                className="w-[76px] px-2 py-2.5 text-center text-[12px] leading-[18px] font-medium"
              >
                Team
              </th>
            </tr>
          </thead>
          <tbody>
            {PLAN_COMPARE.map((row) => (
              <tr key={row.feature} className="border-border border-t first:border-t-0">
                <th
                  scope="row"
                  className="px-4 py-2 text-[12px] leading-[18px] font-normal break-keep"
                >
                  {row.feature}
                </th>
                <td className="px-2 py-2">
                  <Mark isIncluded={row.free} />
                </td>
                <td className="px-2 py-2">
                  <Mark isIncluded={row.team} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Mark({ isIncluded }: { isIncluded: boolean }) {
  return (
    <span className="flex justify-center">
      {isIncluded ? (
        <Check className="text-foreground size-[15px]" strokeWidth={2.5} aria-hidden />
      ) : (
        <Minus className="text-muted-foreground/50 size-[15px]" aria-hidden />
      )}
      <span className="sr-only">{isIncluded ? "포함" : "미포함"}</span>
    </span>
  );
}
