import { PROJECT_DESCRIPTION_MAX_LENGTH, PROJECT_TAG_MAX_LENGTH } from "@/constants/project";

import type { ProjectDraft, ProjectFormErrors } from "./types";

const TAG_PATTERN = /^[A-Z]+$/;

/**
 * 프로젝트 생성 검증 — 화면(폼)과 서버(Server Action)가 **이 함수 하나**로 본다.
 * ⚠️ 태그는 화면에서 이미 대문자로 강제 변환하지만, 서버 액션은 그 변환을 신뢰하지 않고 다시 본다
 *    (CLAUDE.md §권한: 화면 처리는 UX일 뿐 검증이 아니다).
 */
export function validateProjectDraft(draft: ProjectDraft): ProjectFormErrors {
  const errors: ProjectFormErrors = {};

  if (!draft.name.trim()) errors.name = "프로젝트명을 입력해 주세요";

  const tag = draft.tag.trim();
  if (!tag) errors.tag = "ProjectTag를 입력해 주세요";
  else if (tag.length > PROJECT_TAG_MAX_LENGTH)
    errors.tag = `ProjectTag는 영문 대문자 ${PROJECT_TAG_MAX_LENGTH}자 이내로 입력해 주세요`;
  else if (!TAG_PATTERN.test(tag)) errors.tag = "ProjectTag는 영문 대문자만 입력할 수 있어요";

  if (!draft.description.trim()) errors.description = "세부 설명을 입력해 주세요";
  else if (draft.description.length > PROJECT_DESCRIPTION_MAX_LENGTH) {
    errors.description = `세부 설명은 ${PROJECT_DESCRIPTION_MAX_LENGTH}자를 넘을 수 없어요`;
  }

  if (!draft.dueDate.trim()) errors.dueDate = "마감 기한을 선택해 주세요";

  if (draft.teamNames.filter((team) => team.trim()).length === 0) {
    errors.teamNames = "참여 팀을 1개 이상 지정해 주세요";
  }

  return errors;
}
