import type { Metadata } from "next";
import { notFound } from "next/navigation";

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
      <div className="mx-auto max-w-[720px]">
        <div className="border-border bg-card rounded-2xl border p-7">
          <h2 className="flex items-center gap-2 text-[17px] leading-7 font-semibold tracking-[-0.3px]">
            <span className="bg-foreground size-2 rounded-full" aria-hidden />
            {company.companyName}
          </h2>

          <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-5">
            <Field label="사업자등록번호" value={company.businessRegistrationNumber} />
            <Field label="신청일" value={formatDate(company.appliedAt)} />
            <Field label="대표자" value={company.representativeName} />
            <Field label="구성원" value={`${company.memberCount}명`} />
            <Field label="담당자 이메일" value={company.contactEmail} className="col-span-2" />
          </dl>

          <p className="text-muted-foreground bg-secondary mt-6 rounded-lg p-3.5 text-xs leading-[18px]">
            승인 시 기업 코드가 자동 발급되고 담당자 이메일로 발송됩니다.
          </p>

          <div className="mt-6">
            <ApprovalDetailActions companyId={company.id} companyName={company.companyName} />
          </div>
        </div>
      </div>
    </main>
  );
}

function Field({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className={className}>
      <dt className="text-muted-foreground text-xs leading-4">{label}</dt>
      <dd className="text-foreground mt-0.5 text-sm leading-5">{value}</dd>
    </div>
  );
}
