"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { changePasswordAction, type ChangePasswordState } from "../actions";
import { PASSWORD_POLICY_HINTS } from "../password";

const INITIAL_STATE: ChangePasswordState = { errors: {}, attempt: 0 };

/**
 * 마이페이지 비밀번호 변경 — `PATCH /api/auth/me/password`(2026-08-14 담당자 문서).
 *
 * ⚠️ **꼭 3칸이다.** "새 비밀번호 + 확인" 두 칸만 두면 토큰만 훔친 사람이 계정을 가져갈 수
 *    있어 서버가 애초에 거절한다 — 현재 비밀번호 칸을 빼지 않는다.
 * ⚠️ 성공하면 액션이 스스로 `/login`으로 보낸다(모든 기기 로그아웃) — 여기서는 닫을 필요가
 *    없다. 실패만 이 다이얼로그에 남는다.
 */
export function ChangePasswordDialog() {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(changePasswordAction, INITIAL_STATE);
  const shownAttempt = useRef(0);

  useEffect(() => {
    // 칸에 못 매는 오류만 토스트로 알린다 — 필드 오류는 칸 밑에 이미 보인다(§토스트).
    if (state.attempt !== shownAttempt.current && state.error) {
      shownAttempt.current = state.attempt;
      toast.error(state.error);
    }
  }, [state.attempt, state.error]);

  return (
    <>
      <Button type="button" variant="outline" onClick={() => setOpen(true)}>
        비밀번호 변경
      </Button>

      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (!next && isPending) return;
          setOpen(next);
        }}
      >
        <DialogContent className="gap-0 p-0 sm:max-w-[420px]">
          <DialogHeader className="border-border border-b px-6 py-4">
            <DialogTitle>비밀번호 변경</DialogTitle>
          </DialogHeader>

          <form action={formAction} key={state.attempt}>
            <div className="flex flex-col gap-4 px-6 py-5">
              <div className="flex flex-col gap-2">
                <Label htmlFor="current-password">현재 비밀번호</Label>
                <Input
                  id="current-password"
                  name="currentPassword"
                  type="password"
                  autoComplete="current-password"
                  required
                  aria-describedby={
                    state.errors.currentPassword ? "current-password-error" : undefined
                  }
                  aria-invalid={state.errors.currentPassword ? true : undefined}
                />
                {state.errors.currentPassword && (
                  <p id="current-password-error" className="text-destructive text-[12px] leading-4">
                    {state.errors.currentPassword}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="new-password">새 비밀번호</Label>
                <Input
                  id="new-password"
                  name="newPassword"
                  type="password"
                  autoComplete="new-password"
                  maxLength={16}
                  required
                  aria-describedby="new-password-hints"
                  aria-invalid={state.errors.newPassword ? true : undefined}
                />
                {state.errors.newPassword && (
                  <p className="text-destructive text-[12px] leading-4">
                    {state.errors.newPassword}
                  </p>
                )}
                <ul id="new-password-hints" className="text-muted-foreground text-[12px] leading-4">
                  {PASSWORD_POLICY_HINTS.map((hint) => (
                    <li key={hint}>{hint}</li>
                  ))}
                </ul>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="new-password-confirm">새 비밀번호 확인</Label>
                <Input
                  id="new-password-confirm"
                  name="newPasswordConfirm"
                  type="password"
                  autoComplete="new-password"
                  maxLength={16}
                  required
                  aria-describedby={
                    state.errors.newPasswordConfirm ? "new-password-confirm-error" : undefined
                  }
                  aria-invalid={state.errors.newPasswordConfirm ? true : undefined}
                />
                {state.errors.newPasswordConfirm && (
                  <p
                    id="new-password-confirm-error"
                    className="text-destructive text-[12px] leading-4"
                  >
                    {state.errors.newPasswordConfirm}
                  </p>
                )}
              </div>
            </div>

            <div className="border-border flex items-center justify-end gap-2 border-t px-6 py-4">
              <Button
                type="button"
                variant="outline"
                disabled={isPending}
                onClick={() => setOpen(false)}
              >
                취소
              </Button>
              <Button type="submit" variant="ink" disabled={isPending}>
                {isPending ? "변경 중" : "변경"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
