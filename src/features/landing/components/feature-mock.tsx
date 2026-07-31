import { Check } from "lucide-react";

/**
 * 기능 설명 옆에 붙는 화면 축소판.
 *
 * ⚠️ 스크린샷 이미지를 쓰지 않는다 — 화면이 바뀌면 같이 낡고, 다크모드도 따라오지 못한다.
 *    같은 토큰으로 그려서 테마가 바뀌면 함께 바뀐다.
 * ⚠️ 여기 담긴 문장은 **명세에 있는 것만** 쓴다. 자막에 화자 이름을 붙이지 않는다 —
 *    명세상 자막은 화자 구분 없는 청크 단위다.
 */
type FeatureKind = "CAPTURE" | "AI ACTION" | "HANDOVER";

const CAPTION_CHUNKS = [
  "이번 스프린트 블로커부터 정리하죠",
  "API 문서 최신화가 계속 밀리고 있어요",
  "그럼 이번 주 안에 끝내는 걸로 하죠",
] as const;

const ACTIONS = [
  { who: "김", what: "API 문서 최신화", due: "8/2" },
  { who: "이", what: "디자인 기준 문서 작성", due: "8/5" },
  { who: "박", what: "KPI 문서 업데이트", due: "8/7" },
] as const;

const HANDOVER_ROWS = [
  { label: "담당 프로젝트", value: "제품 v2.0 · 캠페인 Q3" },
  { label: "미완료 액션", value: "4건" },
  { label: "참여 결정", value: "이번 분기 12건" },
] as const;

export function FeatureMock({ kind }: { kind: FeatureKind }) {
  return (
    <div className="border-border bg-card min-h-[190px] rounded-xl border p-5 shadow-sm">
      {kind === "CAPTURE" && <CaptureMock />}
      {kind === "AI ACTION" && <ActionMock />}
      {kind === "HANDOVER" && <HandoverMock />}
    </div>
  );
}

function CaptureMock() {
  return (
    <>
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground flex items-center gap-1.5 text-[11px] leading-4">
          {/* 녹음 중 표시는 계속 깜빡인다 — 지금 돌아가는 중이라는 뜻이다 */}
          <span className="bg-foreground size-[6px] animate-pulse rounded-full" aria-hidden />
          녹음 중
        </span>
        <span className="text-muted-foreground/70 text-[11px] leading-4 tabular-nums">
          00:12:47
        </span>
      </div>

      <div className="flex flex-col gap-2 pt-4">
        {CAPTION_CHUNKS.map((chunk) => (
          <p
            key={chunk}
            className="border-border bg-secondary rounded-md border px-2.5 py-1.5 text-[12px] leading-[18px] break-keep"
          >
            {chunk}
          </p>
        ))}
      </div>
    </>
  );
}

function ActionMock() {
  return (
    <>
      <p className="text-muted-foreground text-[11px] leading-4 tracking-[1.1px] uppercase">
        분배된 액션
      </p>

      <div className="flex flex-col gap-2 pt-4">
        {ACTIONS.map((action) => (
          <div key={action.what} className="flex items-center gap-2.5">
            <span className="bg-secondary text-muted-foreground flex size-6 shrink-0 items-center justify-center rounded-full text-[10px] leading-none">
              {action.who}
            </span>
            <span className="min-w-0 flex-1 truncate text-[12px] leading-[18px]">
              {action.what}
            </span>
            <span className="text-muted-foreground/70 shrink-0 text-[11px] leading-4 tabular-nums">
              {action.due}
            </span>
          </div>
        ))}
      </div>
    </>
  );
}

function HandoverMock() {
  return (
    <>
      <p className="flex items-center gap-1.5 text-[12px] leading-[18px]">
        <Check className="text-foreground size-3.5 shrink-0" strokeWidth={2.5} aria-hidden />
        인수인계서 자동 구성
      </p>

      <dl className="pt-3">
        {HANDOVER_ROWS.map((row) => (
          <div
            key={row.label}
            className="border-border flex items-center justify-between border-t py-2.5 first:border-t-0"
          >
            <dt className="text-muted-foreground text-[11px] leading-4">{row.label}</dt>
            <dd className="text-[11px] leading-4">{row.value}</dd>
          </div>
        ))}
      </dl>

      <p className="border-border bg-secondary text-muted-foreground mt-1 rounded-md border px-2.5 py-2 text-[10px] leading-4">
        후임자에게 전달할 준비가 끝났어요
      </p>
    </>
  );
}
