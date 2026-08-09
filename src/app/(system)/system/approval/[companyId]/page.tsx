import { Info } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { DialogMark } from "@/components/common/dialog-mark";
import { ApprovalDetailActions } from "@/features/system/components/approval-detail-actions";
import { getPendingApprovalById } from "@/features/system/server";
import { formatDate } from "@/lib/date";

interface ApprovalDetailPageProps {
  params: Promise<{ companyId: string }>;
}

export async function generateMetadata({ params }: ApprovalDetailPageProps): Promise<Metadata> {
  const { companyId } = await params;
  const company = await getPendingApprovalById(companyId);
  return { title: company ? `${company.companyName} — 기업 가입 승인` : "기업 가입 승인" };
}

/** 승인 대기 신청서 상세 — 목록 행을 눌러 들어온다. 승인·반려는 여기서 끝낸다(2026-08-06 팀 확정). */
export default async function ApprovalDetailPage({ params }: ApprovalDetailPageProps) {
  const { companyId } = await params;
  const company = await getPendingApprovalById(companyId);

  // 없는 id로 들어오면 404 — 링크로 닿는 화면이라 조용히 빈 화면을 보이지 않는다(§정직성).
  if (!company) notFound();

  return (
    <main className="min-h-0 flex-1 overflow-y-auto px-8 py-7">
      {/*
        ⚠️ **공용 창(`ConfirmDialog`·`ResultDialog`)과 같은 옷을 입는다** — 원 표식 →
           가운데 제목 → 내용 → 버튼, 폭 420, 안쪽 여백 32. 이 화면은 모달이 아니라
           페이지지만(승인·반려는 상세 페이지에서 끝낸다, 2026-08-06 팀 확정), 같은 일을
           하는 창과 다르게 생기면 옮겨 다닐 때마다 새 화면처럼 읽힌다.
        ⚠️ 표식 배지는 `none`이다 — 아직 승인도 반려도 안 했다. 체크를 달면 "이미 끝났다"로
           읽힌다.
      */}
      <div className="mx-auto max-w-[420px]">
        <div className="border-border bg-card rounded-2xl border p-8">
          <div className="flex flex-col items-center gap-5 text-center">
            <DialogMark badge="none" />

            <div className="flex flex-col items-center gap-2">
              <h2 className="text-xl leading-[26px] font-semibold tracking-[-0.4px]">
                {company.companyName}
              </h2>
              <p className="text-muted-foreground text-[13px] leading-[21px] break-keep">
                가입을 신청한 기업입니다.
              </p>
            </div>
          </div>

          {/*
            ⚠️ **한 줄에 한 항목**이다. 2열 격자로 두면 값 길이가 제각각이라 오른쪽 칸이
               통째로 비고(담당자 이메일 줄이 그랬다) 어느 라벨의 값인지 눈이 한 번 더 찾는다.
          */}
          <div>
            <dl className="mt-5 flex flex-col">
              <Field label="사업자등록번호" value={company.businessRegistrationNumber} isMono />
              <Field label="신청일" value={formatDate(company.appliedAt)} />
              <Field label="대표자" value={company.representativeName} />
              <Field label="구성원" value={`${company.memberCount}명`} />
              <Field label="담당자 이메일" value={company.contactEmail} />
            </dl>

            {/* ⚠️ "기업 코드 자동 발급·이메일 발송"이라 적지 않는다 — 지금은 목이라 대기 목록에서
              지우기만 한다(`../actions.ts`의 `approveCompanyAction` 주석 참고). 실제로 안 하는
              일을 약속하지 않는다(§정직성). */}
            {/*
              ⚠️ 채운 상자를 걷어내고 한 줄로 둔다. 짧은 주의 문구인데 상자를 씌우니 값보다
                 무거워 보였다 — 지금은 확인창이 같은 말을 한 번 더 하므로 여기선 가볍게 알린다.
              ⚠️ **오른쪽에 붙인다.** 이 문구는 값이 아니라 **버튼에 딸린 설명**이라, 왼쪽 라벨
                 줄에 서 있으면 항목 하나가 더 있는 것처럼 읽혔다 — 누를 자리 위에 둬야
                 무엇에 대한 경고인지가 자리로 드러난다.
            */}
            {/* 버튼 바로 위 — 다시 누르려는 손이 지나가는 자리에 있어야 읽힌다(§confirm-dialog) */}
            <p className="text-muted-foreground mt-5 flex items-start justify-center gap-1.5 text-[13px] leading-5 break-keep">
              <span className="flex h-5 shrink-0 items-center">
                <Info className="size-3.5" aria-hidden />
              </span>
              <span>승인하면 이 신청은 대기 목록에서 사라집니다.</span>
            </p>

            <div className="mt-5">
              <ApprovalDetailActions companyId={company.id} companyName={company.companyName} />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

interface FieldProps {
  label: string;
  value: string;
  /** 자릿수가 있는 값(사업자번호)은 고정폭으로 — 숫자가 흔들리지 않는다 */
  isMono?: boolean;
}

function Field({ label, value, isMono }: FieldProps) {
  return (
    <div className="border-border flex items-baseline justify-between gap-6 border-b py-3 last:border-b-0">
      <dt className="text-muted-foreground shrink-0 text-[13px] leading-5">{label}</dt>
      <dd
        className={`text-foreground min-w-0 truncate text-right text-[13px] leading-5 ${
          isMono ? "font-mono tabular-nums" : ""
        }`}
      >
        {value}
      </dd>
    </div>
  );
}
