"use client";

import type { LucideIcon } from "lucide-react";
import { FolderOpen, Mail, Users } from "lucide-react";

import { CheckMark } from "./check-mark";

/** 요약 한 줄 — 무엇을, 얼마나 정했는지. */
export interface SummaryRow {
  icon: LucideIcon;
  label: string;
  /** 오른쪽에 붙는 결과. 숫자가 들어가므로 `tabular-nums`로 자리를 맞춘다. */
  value: string;
  /** 아직 안 끝난 일이면 이유를 적는다(발송 대기 등) */
  note?: string;
}

interface DoneSummaryProps {
  departmentCount: number;
  roleCount: number;
  positionCount: number;
  inviteCount: number;
}

/**
 * 온보딩에서 정한 것 세 줄.
 *
 * ⚠️ 초록 체크를 줄마다 붙이지 않는다 — 색으로 알리는 건 에러뿐이다(CLAUDE.md §디자인 토큰).
 *    다 됐다는 건 이 화면에 왔다는 사실과 위쪽 큰 표시가 이미 말한다.
 */
export function DoneSummary({
  departmentCount,
  roleCount,
  positionCount,
  inviteCount,
}: DoneSummaryProps) {
  const rows: SummaryRow[] = [
    {
      icon: FolderOpen,
      label: "부서 체계",
      value:
        roleCount > 0 ? `부서 ${departmentCount} · 역할 ${roleCount}` : `부서 ${departmentCount}`,
    },
    { icon: Users, label: "직급 체계", value: `직급 ${positionCount}` },
    {
      icon: Mail,
      label: "사원 초대",
      value: inviteCount > 0 ? `${inviteCount}명` : "없음",
      // ⚠️ 실제 발송은 미구현이다 — 보냈다고 적지 않는다(CLAUDE.md §정직성)
      note: inviteCount > 0 ? "발송 대기" : undefined,
    },
  ];

  return (
    <dl className="border-border bg-card w-full overflow-hidden rounded-lg border">
      {rows.map((row, index) => (
        <div
          key={row.label}
          className={
            index > 0
              ? "border-border flex items-center gap-2.5 border-t px-4 py-3"
              : "flex items-center gap-2.5 px-4 py-3"
          }
        >
          {/*
            ⚠️ 상자 기준으로는 이미 정중앙이다(둘 다 20px 줄 안에서 가운데).
               그래도 처져 보여 1px 올린다 — 눈으로 맞춘 값이라 계산 근거는 없다.
          */}
          <row.icon
            className="text-muted-foreground/60 size-4 shrink-0 -translate-y-px"
            aria-hidden
          />
          <dt className="text-[13px] leading-5">{row.label}</dt>

          <span className="flex-1" aria-hidden />

          <dd className="flex items-center gap-2">
            {row.note && (
              <span className="text-muted-foreground/60 border-border rounded border border-dashed px-1.5 py-0.5 text-[11px] leading-4">
                {row.note}
              </span>
            )}
            <span className="text-muted-foreground text-[13px] leading-5 tabular-nums">
              {row.value}
            </span>
            <CheckMark size={16} className="-translate-y-px" />
          </dd>
        </div>
      ))}
    </dl>
  );
}
