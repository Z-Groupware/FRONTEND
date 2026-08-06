import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { HandoverApprovalCard } from "@/features/member/components/handover-approval-card";
import { MemberActionList } from "@/features/member/components/member-action-list";
import { MemberGradeCard } from "@/features/member/components/member-grade-card";
import { MemberProfileCard } from "@/features/member/components/member-profile-card";
import { getManagedMember } from "@/features/member/manage-server";
import { getViewer } from "@/features/shell/viewer";
import { canApproveFinal, canChangeMemberGrade, canManageMembers } from "@/lib/permission";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "사원 상세",
};

/**
 * 사원 상세 — 왼쪽에 사람, 오른쪽에 그 사람의 일.
 *
 * ⚠️ **권한이 두 겹으로 갈린다**(WORKFLOW §11). 화면과 직급 변경은 Owner·Admin 둘 다,
 *    **승인·반려는 Owner 전용**이다. 판정을 여기서 한 번에 하고 각 카드에 내려보낸다 —
 *    카드가 스스로 `getViewer`를 부르면 같은 판정이 세 곳에 흩어진다.
 * ⚠️ 화면 가드는 UX일 뿐이고 **각 Server Action이 서버에서 다시 본다**(§권한).
 */
export default async function ManageMemberDetailPage({
  params,
}: {
  params: Promise<{ memberId: string }>;
}) {
  const { memberId } = await params;
  const id = Number(memberId);

  // ⚠️ 숫자가 아니면 조회하지 않는다 — `NaN`으로 부르면 목/BE가 엉뚱한 답을 줄 수 있다
  if (!Number.isInteger(id)) notFound();

  const [detail, viewer] = await Promise.all([getManagedMember(id), getViewer()]);

  if (!canManageMembers(viewer)) notFound();
  if (!detail) notFound();

  return (
    <div className="flex-1 overflow-y-auto px-8 py-7">
      <div className="mx-auto grid w-full max-w-[1440px] grid-cols-1 items-start gap-7 lg:grid-cols-[320px_minmax(0,1fr)]">
        <div className="flex flex-col gap-5">
          <MemberProfileCard member={detail.member} phone={detail.phone} />
          <MemberGradeCard member={detail.member} canEdit={canChangeMemberGrade(viewer)} />
        </div>

        <div className="flex flex-col gap-7">
          <MemberActionList actions={detail.actions} />

          {/*
            ⚠️ 승인 카드는 **신청이 있을 때만** 있다. 빈 카드를 두면 늘 무언가 처리할 게
               있는 것처럼 보인다.
            ⚠️ Admin 겸직자에게도 카드는 보이되 버튼만 없다 — 무슨 일이 진행 중인지는
               알아야 계정 발급·직급 변경을 할 때 헷갈리지 않는다.
          */}
          {detail.pendingHandover && (
            <HandoverApprovalCard
              memberId={detail.member.id}
              memberName={detail.member.name}
              handover={detail.pendingHandover}
              canApprove={canApproveFinal(viewer)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
