"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getViewer } from "@/features/shell/viewer";
import { canCreateProject } from "@/lib/permission";
import { isMock } from "@/mocks/config";

import { addMockProject } from "./mock/projects";
import type { ProjectDraft, ProjectFormErrors } from "./types";
import { validateProjectDraft } from "./validate";

const LIST_PATH = "/app/projects";

/** 생성 폼 결과 — `useActionState`가 그대로 들고 있는 모양. */
export interface ProjectFormState {
  errors: ProjectFormErrors;
}

function readDraft(formData: FormData): ProjectDraft {
  return {
    name: String(formData.get("name") ?? ""),
    // ⚠️ 화면이 이미 대문자로 바꿔 보내지만, 서버는 그 처리를 신뢰하지 않고 다시 올린다.
    tag: String(formData.get("tag") ?? "").toUpperCase(),
    description: String(formData.get("description") ?? ""),
    tagColor: String(formData.get("tagColor") ?? "slate") as ProjectDraft["tagColor"],
    startDate: String(formData.get("startDate") ?? ""),
    dueDate: String(formData.get("dueDate") ?? ""),
    teamNames: formData.getAll("teamNames").map(String),
    attachmentName: String(formData.get("attachmentName") ?? "") || undefined,
  };
}

/**
 * 프로젝트 생성 — 격리막(CLAUDE.md §Mock 격리막).
 * ⚠️ **권한을 서버에서 다시 본다** — 화면 숨김은 UX일 뿐 보안이 아니다(§권한).
 * ⚠️ 화면과 **같은 함수**(`validateProjectDraft`)로 다시 검증한다.
 */
export async function createProjectAction(
  _prev: ProjectFormState,
  formData: FormData,
): Promise<ProjectFormState> {
  const viewer = await getViewer();
  if (!canCreateProject(viewer)) return { errors: { name: "프로젝트를 생성할 권한이 없습니다" } };

  const draft = readDraft(formData);
  const errors = validateProjectDraft(draft);
  if (Object.keys(errors).length > 0) return { errors };

  if (!isMock) {
    // ⚠️ 미구현 — API 스펙 확정 후 BFF 경로로 생성 요청을 보낸다(첨부파일 업로드 포함).
    throw new Error("프로젝트 생성 API가 아직 연결되지 않았습니다.");
  }

  addMockProject(draft);

  revalidatePath(LIST_PATH);
  // ⚠️ `redirect`는 내부적으로 예외를 던진다 — try/catch 밖에 둔다(§렌더링·데이터)
  redirect(LIST_PATH);
}
