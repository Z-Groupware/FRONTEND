import { Building2, Info } from "lucide-react";
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

          {/*
            ⚠️ **한 줄에 한 항목**이다. 2열 격자로 두면 값 길이가 제각각이라 오른쪽 칸이
               통째로 비고(담당자 이메일 줄이 그랬다) 어느 라벨의 값인지 눈이 한 번 더 찾는다.
               라벨 왼쪽·값 오른쪽으로 세우고 줄 사이를 선으로 끊으면 대장처럼 읽힌다.
          */}
          <div className="px-7 pb-7">
            <dl className="flex flex-col">
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
            */}
            <p className="text-muted-foreground mt-5 flex items-center gap-1.5 text-xs leading-[18px]">
              <Info className="size-3.5 shrink-0" aria-hidden />
              승인하면 이 신청은 대기 목록에서 사라집니다.
            </p>

            {/* 실행 줄은 선으로 끊어 붙인다 — 값과 같은 흐름에 두면 어디까지가 내용인지 흐리다 */}
            <div className="border-border mt-5 border-t pt-5">
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
