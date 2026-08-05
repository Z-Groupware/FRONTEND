"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { markDraftCommitted } from "./draft";
import type { Invite } from "./types";

interface UseInviteCommitArgs {
  invites: Invite[];
  /** 이번에 실제로 나갈 줄 */
  sendable: Invite[];
  markSent: () => void;
}

/**
 * 3단계 [완료] — **확인 창을 거친 뒤에야** 확정된다(2026-08-04 변경).
 *
 * ⚠️ 확인 없이 넘기지 않는다. 이 한 번으로 앞 세 단계가 굳고 초대장이 나가는데,
 *    나간 메일은 취소되지 않고 이 단계로 돌아올 수도 없다.
 * ⚠️ 실제 메일 발송은 서버가 한다 — 지금은 목이라 목록만 확정된다.
 *    BE 연동 후 이 자리에서 `POST /companies/me/onboarding`으로 함께 커밋한다.
 */
export function useInviteCommit({ invites, sendable, markSent }: UseInviteCommitArgs) {
  const router = useRouter();
  const [isConfirmOpen, setConfirmOpen] = useState(false);

  /** 주소는 적었는데 부서·직급을 안 골라 발송에서 빠지는 줄 — 확인 창에서 알린다 */
  const skippedCount = invites.filter(
    (invite) =>
      invite.email.trim().length > 0 &&
      (!invite.departmentId || !invite.roleId || !invite.positionId),
  ).length;

  /*
    ⚠️ **`isSent`는 서버가 보냈다고 답한 줄에만 붙여야 한다.** 완료 화면의 초대 수가 이 값을
       세므로, 지금처럼 요청 없이 전부 찍으면 부분 실패 때 실제보다 많은 수를 말한다.
       TODO(BE 연동): 커밋 응답의 성공 목록으로 `markSent(ids)`를 부른다.
  */
  const commit = () => {
    const count = sendable.length;
    if (count > 0) {
      markSent();
      toast.success(`${count}명에게 초대장을 보냈습니다`);
    }

    // ⚠️ 서버 커밋이 붙으면 **응답 성공 뒤에** 찍는다 — 지금은 목이라 바로 찍는다
    markDraftCommitted();
    setConfirmOpen(false);
    /*
      ⚠️ `push`가 아니라 `replace`다. 넘어간 뒤 뒤로가기를 누르면 3단계가 잠깐 보였다가
         가드에 걸려 다시 튕겨 나온다 — 되돌아갈 수 없는 자리는 히스토리에 남기지 않는다.
    */
    router.replace("/onboarding/payment");
  };

  return { isConfirmOpen, setConfirmOpen, skippedCount, commit };
}
