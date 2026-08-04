"use client";

import { CreditCard, Plus, X } from "lucide-react";

import type { PaymentMethod } from "../subscription";

interface PaymentMethodsPanelProps {
  methods: readonly PaymentMethod[];
  canManage: boolean;
  onAdd: () => void;
  onSetDefault: (id: string) => void;
  onRemove: (id: string) => void;
}

/**
 * 결제 수단 탭.
 *
 * ⚠️ **카드 입력칸을 직접 만들지 않는다.** 우리 폼으로 원번호를 받으면 PCI-DSS 대상이 된다 —
 *    등록·변경은 결제사(Toss) 창이 통째로 그린다(§checkout과 같은 이유).
 * ⚠️ 그래서 `추가`는 지금 **목**이다. 실제로는 결제사 창이 뜨고 성공 응답을 받은 뒤에
 *    목록이 갱신된다 — 부르는 쪽 토스트에 그렇다고 밝힌다(§정직성).
 */
export function PaymentMethodsPanel({
  methods,
  canManage,
  onAdd,
  onSetDefault,
  onRemove,
}: PaymentMethodsPanelProps) {
  return (
    <section className="border-border bg-card rounded-2xl border">
      <h2 className="flex items-center gap-2 px-7 py-6 text-[15px] leading-6 font-semibold tracking-[-0.2px]">
        {/* 온보딩 카드 머리와 같은 표식 — 화면이 달라도 같은 서비스로 읽힌다 */}
        <span className="bg-foreground size-2 rounded-full" aria-hidden />
        결제 수단
      </h2>

      {methods.length === 0 ? (
        /* ⚠️ 빈 상태 — 무엇이 없는지와 다음에 뭘 하면 되는지를 같이 적는다(§3상태) */
        <p className="text-muted-foreground border-border border-t px-6 py-10 text-center text-[13px] leading-5 break-keep">
          등록된 결제 수단이 없습니다.
        </p>
      ) : (
        <ul className="border-border border-t">
          {methods.map((method) => (
            <li
              key={method.id}
              className="border-border flex items-center gap-3 px-6 py-4 not-first:border-t"
            >
              <span className="border-border bg-secondary flex h-8 w-11 shrink-0 items-center justify-center rounded-md border">
                <CreditCard className="text-muted-foreground size-4" aria-hidden />
              </span>

              <span className="min-w-0 flex-1">
                <span className="block text-[13px] leading-5 tabular-nums">
                  {method.brand} •••• {method.last4}
                </span>
                <span className="text-muted-foreground block text-[12px] leading-4 tabular-nums">
                  만료 {method.expiry}
                </span>
              </span>

              {method.isDefault ? (
                <span className="bg-secondary text-muted-foreground border-border shrink-0 rounded border px-2 py-0.5 text-[11px] leading-4">
                  기본
                </span>
              ) : (
                canManage && (
                  <button
                    type="button"
                    onClick={() => onSetDefault(method.id)}
                    className="text-muted-foreground hover:text-foreground focus-visible:ring-ring shrink-0 rounded text-[12px] leading-4 hover:underline focus-visible:ring-2 focus-visible:outline-hidden"
                  >
                    기본으로
                  </button>
                )
              )}

              {/*
                ⚠️ 기본 수단은 뺄 수 없다. 빼면 다음 결제가 실패하는데, 그 사실을 모른 채
                   지우게 두면 안 된다 — 다른 수단을 먼저 기본으로 올리게 한다.
              */}
              {canManage && !method.isDefault && (
                <button
                  type="button"
                  aria-label={`${method.brand} ${method.last4} 빼기`}
                  onClick={() => onRemove(method.id)}
                  className="text-muted-foreground hover:text-foreground hover:bg-foreground/10 focus-visible:ring-ring flex size-6 shrink-0 items-center justify-center rounded transition-colors focus-visible:ring-2 focus-visible:outline-hidden"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {canManage && (
        <div className="border-border border-t">
          <button
            type="button"
            onClick={onAdd}
            className="text-muted-foreground hover:text-foreground hover:bg-secondary/60 focus-visible:ring-ring flex w-full items-center justify-center gap-1.5 rounded-b-xl py-3.5 text-[13px] leading-5 transition-colors focus-visible:ring-2 focus-visible:outline-hidden"
          >
            <Plus className="size-3.5" aria-hidden />
            {/* 한글 글자가 상자 안에서 위쪽에 앉아 아이콘보다 떠 보인다 — 1px 내려 맞춘다 */}
            <span className="translate-y-px">결제 수단 추가</span>
          </button>
        </div>
      )}
    </section>
  );
}
