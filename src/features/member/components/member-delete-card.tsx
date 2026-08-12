"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { Button } from "@/components/ui/button";

import { deleteMemberAccountAction } from "../manage-actions";
import type { ManagedMember } from "../manage-types";

/**
 * 계정 탈퇴 — **오프보딩 최종 승인을 마친 사람에게만** 보인다(WORKFLOW §7).
 *
 * ⚠️ 승인이 종점이 아니다. 승인은 사람을 퇴사 상태로 옮길 뿐이고, 계정을 닫는 건 여기다 —
 *    그 문이 없으면 퇴사자가 목록에 영영 남는다.
 * ⚠️ **되돌릴 수 없다.** 지우면 그 사람이 목록에서 빠져, 남긴 회의·액션이 누구 것이었는지
 *    찾을 길이 없어진다 — 무엇을 잃는지 적고 한 번 더 받는다(§토스트: 파괴적 작업은 Dialog).
 * ⚠️ 카드를 **눈에 띄게 두지 않는다.** 자주 하는 일이 아니고 잘못 누르면 되돌릴 수 없어서,
 *    다른 카드처럼 생기면 실수로 닿는다 — 조용한 줄 하나로 둔다.
 */
export function MemberDeleteCard({ member }: { member: ManagedMember }) {
  const router = useRouter();
  const [isConfirming, setIsConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleDelete = () =>
    startTransition(async () => {
      /*
        ⚠️ **거절도 받아 낸다.** 액션은 BE 실패를 값으로 돌려주지만, 브라우저에서 Next 서버까지
           가는 길이 끊기면(네트워크·서버 재시작·배포) `await` 자체가 던진다 — 안 잡으면 화면이
           통째로 `error.tsx`로 넘어가거나 잠긴 채로 남는다(2026-08-12 전 화면 정리).
      */
      let result;
      try {
        result = await deleteMemberAccountAction(member.id);
      } catch {
        toast.error("서버에 연결하지 못했습니다. 잠시 후 다시 시도해 주세요.");
        return;
      }

      if (!result.isSuccess) {
        toast.error(result.message ?? "탈퇴 처리하지 못했습니다");
        return;
      }
      setIsConfirming(false);
      toast.success("계정을 탈퇴 처리했습니다");
      /*
        ⚠️ 목록으로 **돌려보낸다.** 지운 사람의 상세에 그대로 있으면 다음 새로고침에
           "없는 사원"이 되어 오류 화면이 뜬다.
      */
      router.push("/manage/members");
    });

  return (
    <>
      <section className="border-border flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl border border-dashed px-7 py-5">
        <div className="flex min-w-0 flex-col gap-1">
          <h2 className="text-[13px] leading-5 font-medium">계정 탈퇴</h2>
          <p className="text-muted-foreground text-[12px] leading-4 break-keep">
            목록에서 빠지고, 남긴 회의·액션의 출처를 찾을 수 없게 됩니다.
          </p>
        </div>

        <Button
          type="button"
          size="sm"
          variant="outline"
          className="text-destructive border-destructive/30 hover:bg-destructive/5 ml-auto"
          disabled={isPending}
          onClick={() => setIsConfirming(true)}
        >
          탈퇴 처리
        </Button>
      </section>

      <ConfirmDialog
        isOpen={isConfirming}
        onOpenChange={() => setIsConfirming(false)}
        title={`${member.name} 님의 계정을 탈퇴 처리할까요?`}
        description={
          <>
            사원 목록에서 빠지고 되돌릴 수 없습니다.
            <br />
            남긴 회의·액션은 남지만, 누가 남겼는지 찾을 수 없게 됩니다.
          </>
        }
        confirmLabel="탈퇴 처리"
        isDestructive
        mark="alert"
        isPending={isPending}
        pendingLabel="처리 중…"
        onConfirm={handleDelete}
      />
    </>
  );
}
