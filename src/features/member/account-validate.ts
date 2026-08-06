import { POSITION_AUTHORITIES } from "@/constants/authority";

import type { AccountDraft, AccountErrors } from "./manage-types";

/**
 * 계정 발급 검증 — **화면과 서버가 같은 함수를 쓴다.**
 * 규칙이 두 벌이면 화면은 통과시키고 서버는 막는 일이 생긴다.
 */
export function validateAccount(draft: AccountDraft): AccountErrors {
  const errors: AccountErrors = {};

  if (!draft.name.trim()) errors.name = "이름을 입력해 주세요";
  if (!draft.teamName.trim()) errors.teamName = "소속 팀을 골라 주세요";
  if (!draft.position.trim()) errors.position = "직급을 입력해 주세요";

  /*
    ⚠️ 이메일은 **`@`가 있는지만** 본다(신청 화면과 같은 규칙). 정규식으로 조이면
       회사 메일 형식이 특이한 곳에서 멀쩡한 주소가 막힌다 — 진짜 검증은 발송이 한다.
  */
  const email = draft.email.trim();
  if (!email) errors.email = "이메일을 입력해 주세요";
  else if (!email.includes("@")) errors.email = "이메일 주소를 다시 확인해 주세요";

  /*
    ⚠️ 권한은 **화이트리스트로 본다.** 화면 셀렉트는 Leader·Member만 주지만 Server Action은
       주소만 알면 직접 부를 수 있다 — 없으면 아무나 OWNER 계정을 발급할 수 있다(§권한).
  */
  const allowed: readonly string[] = POSITION_AUTHORITIES;
  if (!allowed.includes(draft.authority)) errors.authority = "발급할 수 없는 권한입니다";

  return errors;
}

/**
 * 이미 쓰고 있는 메일 주소인지.
 * ⚠️ 대소문자를 가리지 않는다 — `Hong@`과 `hong@`은 같은 사람에게 간다.
 */
export function isEmailTaken(email: string, existing: string[]): boolean {
  const needle = email.trim().toLowerCase();
  return existing.some((taken) => taken.toLowerCase() === needle);
}
