import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getCompanySetting } from "@/features/company/server";
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

  /* ⚠️ **판정이 먼저다** — 권한 없는 사람의 조회가 BE까지 나가면 안 된다(§권한) */
  const viewer = await getViewer();
  if (!canManageMembers(viewer)) notFound();

  const detail = await getManagedMember(id);
  if (!detail) notFound();

  /*
    ⚠️ **직급 목록을 같이 받는다.** 손으로 적게 두면 회사에 없는 직급이 생긴다 —
       발급 창과 같은 이유다(직급에는 권한이 매여 있다).
  */
  const company = await getCompanySetting();
  const positionNames = company.positions.map((position) => position.name);

  return (
    <div className="flex-1 overflow-y-auto px-8 py-7">
      <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-7">
        {/*
          ⚠️ 승인 카드가 **맨 위 전폭**이다. 이 화면에 온 이유가 그것이고, 놓치면 사람이
             기다린다 — 오른쪽 아래에 두면 담당 액션을 먼저 읽고 스크롤해야 보인다.
          ⚠️ 신청이 있을 때만 그린다. 빈 카드를 두면 늘 처리할 게 있는 것처럼 보인다.
          ⚠️ Admin 겸직자에게도 **카드는 보이되 버튼만 없다** — 무슨 일이 진행 중인지는
             알아야 계정 발급·직급 변경을 할 때 헷갈리지 않는다(WORKFLOW §11).
        */}
        {detail.pendingHandover && (
          <HandoverApprovalCard
            memberId={detail.member.id}
            memberName={detail.member.name}
            handover={detail.pendingHandover}
            canApprove={canApproveFinal(viewer)}
          />
        )}

        {/*
          ⚠️ 곁 컬럼은 **360px**이다(DESIGN: 곁 컬럼 고정폭). 사람 카드는 폭이 늘어나도
             얻는 게 없다.
          ⚠️ 직급·권한 변경은 **오른쪽 아래**다. 왼쪽에 셋을 쌓으면 그 칸만 길어져 오른쪽
             절반이 통째로 비고, 반대로 폼을 전폭에 두면 입력칸만 넓어진다 —
             담당 액션(짧다) 밑에 두면 두 칸 높이가 얼추 맞는다.
        */}
        <div className="grid grid-cols-1 items-start gap-7 lg:grid-cols-[360px_minmax(0,1fr)]">
          <MemberProfileCard member={detail.member} phone={detail.phone} />

          <div className="flex flex-col gap-7">
            <MemberActionList actions={detail.actions} />
            <MemberGradeCard
              member={detail.member}
              canEdit={canChangeMemberGrade(viewer)}
              positionNames={positionNames}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
