import type { PersonalTodoDraft, PersonalTodoFormErrors } from "./types";

/**
 * 개인 Todo 작성 검증 — 제목·날짜 필수.
 * ⚠️ 화면(폼)과 서버(Server Action)가 **이 함수 하나**로 본다 — 규칙이 두 벌이면 반드시 어긋난다.
 */
export function validatePersonalTodoDraft(draft: PersonalTodoDraft): PersonalTodoFormErrors {
  const errors: PersonalTodoFormErrors = {};
  if (!draft.title.trim()) errors.title = "제목을 입력해 주세요";
  if (!draft.date.trim()) errors.date = "날짜를 선택해 주세요";
  return errors;
}
