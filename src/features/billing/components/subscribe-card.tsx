"use client";

import { ArrowRight, Check, RefreshCw } from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";

import { ZLogo } from "@/components/icons/z-logo";
import { cn } from "@/lib/utils";

import type { BillingConfig } from "../config";
import { requestSubscriptionPayment } from "../payment";
import { calculatePrice, formatWon } from "../pricing";
import { PaymentFailedDialog } from "./payment-failed-dialog";
import { PlanSummaryCard } from "./plan-summary-card";

interface SubscribeCardProps {
  config: BillingConfig;
  /** **결제에 성공했을 때만** 불린다 — 실패는 이 카드가 창을 띄워 직접 처리한다 */
  onSubscribe: () => void;
  /** 버튼 문구. 기본은 "결제하기" */
  actionLabel?: string;
}

/**
 * 구독 시작 — **고를 게 없는 화면**이다.
 *
 * 좌석 슬라이더도 결제 주기 토글도 없다(2026-08-04 팀 확정) — 과금이 좌석이 아니라
 * **기본료 + 사용량**이고 주기는 월간뿐이라, 여기서 정할 값이 남아 있지 않다.
 * 그래서 "고르는 화면"이 아니라 **"이걸 삽니다"를 확인하는 화면**으로 만든다.
 *
 * ⚠️ **금액·포함량을 화면에 박지 않는다.** 전부 `BillingConfig`에서 읽는다 —
 *    실측 전 가정값이라 바뀔 것이 확정돼 있다(팀 확정: 하드코딩 금지).
 * ⚠️ **실제 청구는 아직 없다.** 목 격리막으로 흐름만 이어 두고, 화면에는 그 사실을 적는다 —
 *    연결도 안 된 PG 이름을 적어 두면 실제로 빠져나가는 줄 안다(§정직성).
 */
export function SubscribeCard({
  config,
  onSubscribe,
  actionLabel = "결제하기",
}: SubscribeCardProps) {
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [agreedRecurring, setAgreedRecurring] = useState(false);
  const [isPending, setIsPending] = useState(false);
  /** 실패했을 때 띄울 창 — `null`이면 안 뜬다 */
  const [failure, setFailure] = useState<string | null>(null);

  const price = calculatePrice(config);
  const canSubmit = agreedTerms && agreedRecurring && !isPending;

  /*
    ⚠️ **결제 요청을 이 안에서 한다.** 세 화면(온보딩 4단계 · 구독 재개 · 그다음에 붙을 것)이
       이 카드를 함께 쓰는데, 부르는 쪽에 맡기면 실패 처리를 하나만 빠뜨려도 그 화면에서는
       결제가 조용히 실패한다 — 성공만 밖으로 알린다.
    ⚠️ 누르는 동안 잠근다. 두 번 눌러 두 번 청구되는 건 되돌리기 어렵다.
  */
  const handleSubmit = async () => {
    setIsPending(true);
    try {
      const result = await requestSubscriptionPayment();
      if (result.isSuccess) {
        onSubscribe();
        return;
      }
      // ⚠️ 사유를 모르면 `undefined`로 넘긴다 — 창이 일반 문구를 쓴다. 지어내지 않는다.
      setFailure(result.message ?? "");
    } catch {
      /*
        ⚠️ **던지는 경우도 실패다.** 결제사 창을 닫거나 네트워크가 끊기면 예외로 온다 —
           잡지 않으면 아무 일도 안 일어난 것처럼 보인다.
      */
      setFailure("");
    } finally {
      /*
        ⚠️ `finally`다. 전에는 `await` 뒤에서 풀었는데, 요청이 거절되면 그 줄에 닿지 못해
           **버튼이 영영 잠긴 채로** 남았다 — 새로고침 말고는 빠져나갈 길이 없었다.
      */
      setIsPending(false);
    }
  };

  return (
    /*
      ⚠️ 두 카드는 **같은 높이**로 선다(`items-stretch`). 다만 늘어난 자리를 한 곳에 몰지 않는다 —
         오른쪽 카드는 덩어리 넷(표식 · 금액 · 내역 · 동의)을 `justify-between`으로 벌려서
         남는 높이를 **간격으로 나눠 먹는다.** 한 곳에 몰면 카드에 구멍이 뚫린 것처럼 보인다.
    */
    <div className="flex flex-col gap-7 lg:flex-row lg:items-stretch">
      <PlanSummaryCard config={config} />

      {/* 오른쪽 — 얼마를 내나 */}
      <div className="flex w-full shrink-0 lg:w-[400px]">
        <aside className="border-border bg-card flex flex-1 flex-col justify-between rounded-2xl border p-8 shadow-sm">
          {/*
            ⚠️ 결제 카드에 **Z 표식**을 둔다. 금액과 버튼만 있으면 어느 서비스의 결제창이어도
               말이 되는 화면이 된다 — 무엇을 사는지가 카드 안에서 드러나야 한다.
            ⚠️ 표식 옆에 아무 말도 적지 않는다. `Z 구독`은 제목·왼쪽 카드와 겹쳤고,
               `월 1회 청구`는 아래 `매월 자동 갱신됩니다`와 같은 말이었다.
          */}
          {/*
            ⚠️ 구분선이 왼쪽 카드와 **같은 높이**에 서야 한다. 왼쪽은 머리(48px) + 아래 여백(24px)
               = 72px 지점에 선이 있으므로, 여기도 72px 상자에 아래 여백 24px를 준다.
               `h-12`로 두면 상자 안에 여백이 포함돼(border-box) 선이 24px 위로 올라간다.
               그래야 두 카드의 구분선이 같은 높이에 선다 — 나란히 둔 카드에서 선이 어긋나면
               가장 먼저 눈에 걸린다.
            ⚠️ 표식은 24px이다. 16px일 땐 상단바 로고보다 작아서, 카드가 Z의 것이라는 게
               한눈에 안 읽혔다.
          */}
          <div className="border-border flex h-[72px] items-center border-b pb-6">
            <ZLogo className="size-6" />
          </div>

          <div>
            {/*
              ⚠️ `오늘`·`첫 달` 같은 말을 붙이지 않는다. 이 카드는 온보딩과 구독 관리
                 두 곳에서 쓰여서, 한쪽에서만 맞는 말이 다른 쪽에서는 거짓이 된다.
            */}
            <p className="text-muted-foreground text-[12px] leading-4">결제 금액</p>
            {/*
            ⚠️ `₩`를 숫자와 **같은 크기로 두지 않는다.** 38px 굵은 글씨에서 원화 기호는
               가로 두 줄이 굵게 뭉쳐 숫자보다 먼저 눈에 들어온다 — 한 치수 줄이고 흐리게 둔다.
          */}
            <p className="flex items-baseline gap-0.5 pt-4">
              <span className="text-muted-foreground text-[24px] leading-none font-semibold">
                ₩
              </span>
              <span className="text-[38px] leading-none font-bold tracking-[-1.2px] tabular-nums">
                {price.total.toLocaleString("ko-KR")}
              </span>
            </p>
          </div>

          {/*
            내역 — 금액과 한 얘기지만 따로 세워야 남는 자리를 나눠 가질 틈이 생긴다.
            ⚠️ 총액과 내역은 **한 얘기**라 가깝게 둔다. 멀어질수록 둘의 관계가 끊긴다.
          */}
          <div>
            <dl className="flex flex-col gap-2.5">
              <Row label="기본료" value={formatWon(price.baseFee)} />
              {price.vat > 0 && <Row label="VAT (10%)" value={formatWon(price.vat)} isMuted />}
            </dl>

            {/*
              ⚠️ 가운데로 둔다. 위 두 줄은 왼쪽 이름 · 오른쪽 금액으로 양 끝에 붙는데, 그 아래
                 한 줄만 왼쪽에 붙으면 어느 열에도 속하지 않은 채 매달린 것처럼 보인다.
            */}
            <p className="text-muted-foreground/70 flex items-center justify-center gap-1.5 pt-7 text-[11px] leading-4">
              <RefreshCw className="size-3.5 shrink-0" aria-hidden />
              {/* 한글 글자가 상자 안에서 위쪽에 앉아 아이콘보다 떠 보인다 — 1px 내려 맞춘다 */}
              <span className="translate-y-px">매월 자동 갱신됩니다. 해지는 언제든 가능합니다</span>
            </p>
            {/*
              ⚠️ 총액 **바로 아래**에 두지 않는다. 거기 있으면 오늘 낼 금액이 달라질 수 있다는
                 말로 읽힌다 — 실제로는 **다음 결제일** 얘기라, 갱신 안내와 한 자리에 둔다(§정직성).
                 ⚠️ `다음 달`이라고 쓰지 않는다. 결제일이 매월 1일이라는 보장이 없어서,
                    사용량 화면(`usage-panel`)이 쓰는 `다음 결제일`과 말을 맞춘다.
            */}
            <p className="text-muted-foreground/70 pt-1.5 text-center text-[11px] leading-4 break-keep">
              포함량을 넘긴 만큼은 다음 결제일에 더해집니다
            </p>
          </div>

          {/*
            ⚠️ 상자에 담지 않는다. 색 면이 하나 더 생길 때마다 화면이 조각난다 — 선으로 가른다.
          */}
          <div className="border-border border-t pt-6">
            <div className="flex flex-col gap-3.5">
              <Agreement checked={agreedTerms} onChange={setAgreedTerms}>
                이용약관과 개인정보처리방침에 동의합니다
              </Agreement>
              <Agreement checked={agreedRecurring} onChange={setAgreedRecurring}>
                매월 자동 청구에 동의합니다
              </Agreement>
            </div>

            <button
              type="button"
              disabled={!canSubmit}
              onClick={handleSubmit}
              className="bg-foreground text-background hover:bg-foreground/90 focus-visible:ring-ring disabled:bg-secondary disabled:text-muted-foreground/60 mt-5 flex h-[52px] w-full items-center justify-center gap-2.5 rounded-xl text-[15px] leading-none font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-hidden disabled:pointer-events-none"
            >
              {isPending ? (
                "결제 중입니다"
              ) : (
                <>
                  <span className="tabular-nums">{formatWon(price.total)}</span>
                  {actionLabel}
                  <ArrowRight className="size-4" aria-hidden />
                </>
              )}
            </button>

            <PaymentFailedDialog
              isOpen={failure !== null}
              onOpenChange={(open) => !open && setFailure(null)}
              message={failure || undefined}
            />
          </div>

          {/*
            ⚠️ 버튼 아래에 제품 소개 문구를 두지 않는다. `결제하면 워크스페이스가 열립니다`는
               화면 부제가 이미 말했고, 그 뒤에 붙던 한 줄 소개는 **돈을 내는 자리에서 할 말이
               아니다** — 결정을 돕지 않는 문장은 버튼 옆에서 결정을 흐린다.
          */}
        </aside>
      </div>
    </div>
  );
}

function Row({ label, value, isMuted }: { label: string; value: string; isMuted?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <dt
        className={
          isMuted
            ? "text-muted-foreground/70 text-[11px] leading-4"
            : "text-muted-foreground text-[13px] leading-5"
        }
      >
        {label}
      </dt>
      <dd
        className={
          isMuted
            ? "text-muted-foreground/70 text-[11px] leading-4 tabular-nums"
            : "text-[13px] leading-5 tabular-nums"
        }
      >
        {value}
      </dd>
    </div>
  );
}

function Agreement({
  checked,
  onChange,
  children,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  children: ReactNode;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-2.5">
      {/*
        ⚠️ 브라우저 기본 체크박스는 OS마다 다르게 생겨 이 카드만 마감이 덜 된 것처럼 보인다.
           상자는 우리가 그리고, 진짜 `input`은 숨겨서 키보드·스크린리더는 그대로 쓴다.
      */}
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="peer sr-only"
      />
      <span
        className="border-input bg-background peer-checked:bg-foreground peer-checked:border-foreground peer-focus-visible:ring-ring text-background mt-[1px] flex size-[18px] shrink-0 items-center justify-center rounded-md border transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-offset-2"
        aria-hidden
      >
        <Check className={cn("size-3 transition-opacity", checked ? "opacity-100" : "opacity-0")} />
      </span>
      <span className="text-muted-foreground text-[12px] leading-[18px] break-keep">
        {children}
      </span>
    </label>
  );
}
