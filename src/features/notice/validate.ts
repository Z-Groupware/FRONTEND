import type { NoticeDraft, NoticeFormErrors } from "./types";

/**
 * 공지 작성·수정 검증 — 제목·내용 필수.
 * ⚠️ 화면(폼)과 서버(Server Action)가 **이 함수 하나**로 본다 — 규칙이 두 벌이면 반드시 어긋난다.
 */
export function validateNoticeDraft(draft: NoticeDraft): NoticeFormErrors {
  const errors: NoticeFormErrors = {};
  if (!draft.title.trim()) errors.title = "제목을 입력해 주세요";
  if (!draft.body.trim()) errors.body = "내용을 입력해 주세요";
  return errors;
}
