"use client";

import { type FormEvent, useActionState, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { changePasswordAction, type ChangePasswordState } from "../actions";
import { PASSWORD_POLICY_HINTS } from "../password";

const INITIAL_STATE: ChangePasswordState = { errors: {}, attempt: 0 };

interface PasswordDraft {
  currentPassword: string;
  newPassword: string;
  newPasswordConfirm: string;
}

const EMPTY_DRAFT: PasswordDraft = { currentPassword: "", newPassword: "", newPasswordConfirm: "" };

/**
 * 마이페이지 비밀번호 변경 — `PATCH /api/auth/me/password`(2026-08-14 담당자 문서).
 *
 * ⚠️ **꼭 3칸이다.** "새 비밀번호 + 확인" 두 칸만 두면 토큰만 훔친 사람이 계정을 가져갈 수
 *    있어 서버가 애초에 거절한다 — 현재 비밀번호 칸을 빼지 않는다.
 * ⚠️ 성공하면 액션이 스스로 `/login`으로 보낸다(모든 기기 로그아웃) — 여기서는 닫을 필요가
 *    없다. 실패만 이 다이얼로그에 남는다.
 * ⚠️ **`<form action={...}>`을 안 쓴다.** 그 방식은 액션이 끝나면 폼을 통째로 리셋하는데,
 *    실패해도 세 칸이 전부 비워져 처음부터 다시 적어야 했다 — 이 폼은 값을 직접 들고 있다가
 *    (`draft`) 실패하면 그대로 두고, `formAction`은 버튼 클릭에서 손으로 부른다.
 * ⚠️ **값을 들고 있어야 실시간 일치 판정도 된다.** 새 비밀번호·확인 두 칸을 다 아는 채로
 *    타이핑마다 비교해야 제출 전에 알려줄 수 있다 — 서버 왕복 없이 그 자리에서 본다.
 */
export function ChangePasswordDialog() {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(changePasswordAction, INITIAL_STATE);
  const [draft, setDraft] = useState<PasswordDraft>(EMPTY_DRAFT);
  const shownAttempt = useRef(0);

  useEffect(() => {
    // 칸에 못 매는 오류만 토스트로 알린다 — 필드 오류는 칸 밑에 이미 보인다(§토스트).
    if (state.attempt !== shownAttempt.current && state.error) {
      shownAttempt.current = state.attempt;
      toast.error(state.error);
    }
  }, [state.attempt, state.error]);

  /*
    ⚠️ **확인칸이 비었으면 아무 말도 안 한다** — 아직 아무것도 안 적은 사람에게 "일치하지
       않습니다"부터 보이면 오류로 시작하는 폼이 된다. 뭐라도 적은 뒤부터 그때그때 비교한다.
  */
  const confirmMatch =
    draft.newPasswordConfirm.length === 0 ? null : draft.newPassword === draft.newPasswordConfirm;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData();
    formData.set("currentPassword", draft.currentPassword);
    formData.set("newPassword", draft.newPassword);
    formData.set("newPasswordConfirm", draft.newPasswordConfirm);
    formAction(formData);
  };

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
          // 창을 닫으면(취소 포함) 다음에 열 때는 빈 칸에서 시작한다.
          if (!next) setDraft(EMPTY_DRAFT);
        }}
      >
        <DialogContent className="gap-0 p-0 sm:max-w-[420px]">
          <DialogHeader className="border-border border-b px-6 py-4">
            <DialogTitle>비밀번호 변경</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            <div className="flex flex-col gap-4 px-6 py-5">
              <div className="flex flex-col gap-2">
                <Label htmlFor="current-password">현재 비밀번호</Label>
                <Input
                  id="current-password"
                  name="currentPassword"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={draft.currentPassword}
                  onChange={(event) =>
                    setDraft((prev) => ({ ...prev, currentPassword: event.target.value }))
                  }
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
                  value={draft.newPassword}
                  onChange={(event) =>
                    setDraft((prev) => ({ ...prev, newPassword: event.target.value }))
                  }
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
                  value={draft.newPasswordConfirm}
                  onChange={(event) =>
                    setDraft((prev) => ({ ...prev, newPasswordConfirm: event.target.value }))
                  }
                  aria-describedby="new-password-confirm-hint"
                  aria-invalid={
                    state.errors.newPasswordConfirm || confirmMatch === false ? true : undefined
                  }
                />
                {/*
                  ⚠️ **서버 오류가 우선이다.** 방금 제출해서 돌아온 문구가 있으면 그걸 보여주고,
                     없으면 타이핑 중 실시간 판정을 보여준다 — 같은 뜻의 줄이 두 개 뜨지 않는다.
                     (제출 전 클라이언트 검증이 같은 조건을 이미 막아서, 둘이 실제로 어긋날 일은 없다.)
                */}
                {state.errors.newPasswordConfirm ? (
                  <p
                    id="new-password-confirm-hint"
                    className="text-destructive text-[12px] leading-4"
                  >
                    {state.errors.newPasswordConfirm}
                  </p>
                ) : (
                  confirmMatch !== null && (
                    <p
                      id="new-password-confirm-hint"
                      className={
                        confirmMatch
                          ? "text-muted-foreground text-[12px] leading-4"
                          : "text-destructive text-[12px] leading-4"
                      }
                    >
                      {confirmMatch ? "비밀번호가 일치합니다" : "비밀번호가 일치하지 않습니다"}
                    </p>
                  )
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
