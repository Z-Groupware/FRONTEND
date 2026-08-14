import { z } from "zod";

/**
 * 비밀번호 변경 폼의 **모양**과 검증 — 마이페이지 담당자 문서(2026-08-14)로 확인한 정책.
 *
 * ⚠️ **재사용 금지(이전 비밀번호)는 여기서 못 본다.** 서버만 아는 값이라 `AU-042`·`AU-043`으로
 *    돌아오면 그 응답을 그대로 화면에 옮긴다(`actions.ts`) — 여기 스키마는 모양(길이·조합·공백)만 본다.
 */
const PASSWORD_PATTERN = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z0-9])[!-~]{8,16}$/;

/** 입력칸 아래 안내 문구 — 정책이 바뀌면 여기만 고친다(라벨 하드코딩 금지와 같은 이유). */
export const PASSWORD_POLICY_HINTS = [
  "비밀번호는 8자 이상 16자 이하로 입력해 주세요.",
  "영문, 숫자, 특수문자를 모두 포함해 주세요.",
  "공백은 사용할 수 없어요.",
  "이전에 사용한 비밀번호는 다시 사용할 수 없어요.",
] as const;

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "현재 비밀번호를 입력해 주세요"),
    newPassword: z
      .string()
      .regex(PASSWORD_PATTERN, "비밀번호는 8~16자이며 영문, 숫자, 특수문자를 모두 포함해야 합니다"),
    newPasswordConfirm: z.string().min(1, "새 비밀번호 확인을 입력해 주세요"),
  })
  .refine((draft) => draft.newPassword === draft.newPasswordConfirm, {
    message: "새 비밀번호가 일치하지 않습니다",
    path: ["newPasswordConfirm"],
  });

export type ChangePasswordDraft = z.infer<typeof changePasswordSchema>;
export type ChangePasswordErrors = Partial<Record<keyof ChangePasswordDraft, string>>;

/**
 * 화면이 쓰는 모양(칸별 오류 한 줄)으로 옮긴다 — `credentials.ts`(로그인)와 같은 자리.
 * ⚠️ 한 칸에 오류가 여러 개 나와도 **첫 줄만** 쓴다.
 */
export function validateChangePassword(input: ChangePasswordDraft): ChangePasswordErrors {
  const result = changePasswordSchema.safeParse(input);
  if (result.success) return {};

  const errors: ChangePasswordErrors = {};
  for (const issue of result.error.issues) {
    const field = issue.path[0] as keyof ChangePasswordDraft | undefined;
    if (field && errors[field] === undefined) errors[field] = issue.message;
  }
  return errors;
}
