import { Building2 } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ApprovalDetailActions } from "@/features/system/components/approval-detail-actions";
import { SystemCardHeading } from "@/features/system/components/system-card-heading";
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
      <div className="mx-auto max-w-[720px]">
        {/*
          제목 줄은 다른 시스템 카드와 **같은 컴포넌트**를 쓴다(`SystemCardHeading`).
          여기만 먹색 점을 직접 그리고 있어서, 나머지가 아이콘으로 바뀐 뒤 이 화면만 튀었다.
          그래서 카드에 `p-7`을 한 번에 주지 않고 제목·본문이 각자 여백을 갖게 나눈다.
        */}
        <div className="border-border bg-card rounded-2xl border">
          <SystemCardHeading icon={Building2}>{company.companyName}</SystemCardHeading>

          <div className="px-7 pt-3 pb-7">
            <dl className="grid grid-cols-2 gap-x-6 gap-y-5">
              <Field label="사업자등록번호" value={company.businessRegistrationNumber} />
              <Field label="신청일" value={formatDate(company.appliedAt)} />
              <Field label="대표자" value={company.representativeName} />
              <Field label="구성원" value={`${company.memberCount}명`} />
              <Field label="담당자 이메일" value={company.contactEmail} className="col-span-2" />
            </dl>

            {/* ⚠️ "기업 코드 자동 발급·이메일 발송"이라 적지 않는다 — 지금은 목이라 대기 목록에서
              지우기만 한다(`../actions.ts`의 `approveCompanyAction` 주석 참고). 실제로 안 하는
              일을 약속하지 않는다(§정직성). */}
            <p className="text-muted-foreground bg-secondary mt-6 rounded-lg p-3.5 text-xs leading-[18px]">
              승인하면 이 신청은 대기 목록에서 사라집니다.
            </p>

            <div className="mt-6">
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
  className?: string;
}

function Field({ label, value, className }: FieldProps) {
  return (
    <div className={className}>
      <dt className="text-muted-foreground text-xs leading-4">{label}</dt>
      <dd className="text-foreground mt-0.5 text-sm leading-5">{value}</dd>
    </div>
  );
}
