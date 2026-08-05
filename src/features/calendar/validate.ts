import { isValid, parse } from "date-fns";

import type { PersonalTodoDraft, PersonalTodoFormErrors } from "./types";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** "YYYY-MM-DD" 형식이면서 실제로 있는 날짜인지(2월 30일 같은 값은 걸러낸다). */
function isValidCalendarDate(value: string): boolean {
  if (!DATE_PATTERN.test(value)) return false;
  return isValid(parse(value, "yyyy-MM-dd", new Date()));
}

/**
 * 개인 Todo 작성 검증 — 제목·날짜 필수.
 * ⚠️ 화면(폼)과 서버(Server Action)가 **이 함수 하나**로 본다 — 규칙이 두 벌이면 반드시 어긋난다.
 */
export function validatePersonalTodoDraft(draft: PersonalTodoDraft): PersonalTodoFormErrors {
  const errors: PersonalTodoFormErrors = {};
  if (!draft.title.trim()) errors.title = "제목을 입력해 주세요";
  if (!draft.date.trim()) errors.date = "날짜를 선택해 주세요";
  else if (!isValidCalendarDate(draft.date)) errors.date = "올바른 날짜가 아니에요";
  return errors;
}
