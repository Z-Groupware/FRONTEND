"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { FLASH_TOAST_PARAM } from "@/constants/flash-toast";
import { requireAccessToken } from "@/features/auth/session";
import { getViewer } from "@/features/shell/viewer";
import { ApiError, serverApi } from "@/lib/api";
import { ep } from "@/lib/endpoints";
import { canCreateProject } from "@/lib/permission";
import { isMock } from "@/mocks/config";

import { toCreateProjectRequestBody } from "./mapper";
import { addMockProject } from "./mock/projects";
import { resolveTeamIds } from "./server";
import type { ProjectDraft, ProjectFormErrors } from "./types";
import { validateProjectDraft } from "./validate";

const LIST_PATH = "/app/projects";
/*
  ⚠️ **만들었다는 말을 주소에 실어 보낸다.** `redirect`가 걸린 액션은 성공을 화면에 돌려주지
     못해 토스트를 띄울 자리가 없다 — 목록에 도착한 화면이 `FlashToast`로 대신 말한다.
*/
const CREATED_PATH = `${LIST_PATH}?${FLASH_TOAST_PARAM}=PROJECT_CREATED`;

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
    // ⚠️ 첨부파일은 아직 안 보낸다 — 생성 폼에 실제 파일 선택 UI가 없다(`attachmentName`은
    //    지금도 목 단계 자리표시자다). 업로드 3단계(발급→업로드→확정)는 화면이 생기면 잇는다.
    const accessToken = await requireAccessToken();
    const teamIds = await resolveTeamIds(accessToken, draft.teamNames);
    const body = toCreateProjectRequestBody(draft, teamIds);

    try {
      await serverApi(ep.projects(), { method: "POST", json: body, accessToken });
    } catch (error) {
      if (error instanceof ApiError) return { errors: { name: error.message } };
      throw error;
    }

    revalidatePath(LIST_PATH);
    redirect(CREATED_PATH);
  }

  addMockProject(draft);

  revalidatePath(LIST_PATH);
  // ⚠️ `redirect`는 내부적으로 예외를 던진다 — try/catch 밖에 둔다(§렌더링·데이터)
  redirect(CREATED_PATH);
}

/**
 * 첨부파일 다운로드 URL 발급 — 클릭 시점에 부른다(5분 만료라 미리 받아두면 안 된다).
 * ⚠️ mock 단계는 파일이 실제로 없어 발급할 게 없다 — 호출부가 `null`을 보고 "연동 전" 토스트를 띄운다.
 */
export async function getProjectAttachmentDownloadUrlAction(
  projectId: number,
  attachmentId: number,
): Promise<string | null> {
  if (isMock) return null;

  const accessToken = await requireAccessToken();
  const { downloadUrl } = await serverApi<{ downloadUrl: string; expiresInSeconds: number }>(
    ep.projectAttachmentDownloadUrl(projectId, attachmentId),
    { accessToken },
  );
  return downloadUrl;
}

/** 팀 액션 상세의 첨부파일 다운로드 URL 발급 — 프로젝트 쪽과 같은 패턴, 경로만 다르다. */
export async function getTeamActionAttachmentDownloadUrlAction(
  teamActionId: number,
  attachmentId: number,
): Promise<string | null> {
  if (isMock) return null;

  const accessToken = await requireAccessToken();
  const { downloadUrl } = await serverApi<{ downloadUrl: string; expiresInSeconds: number }>(
    ep.teamActionAttachmentDownloadUrl(teamActionId, attachmentId),
    { accessToken },
  );
  return downloadUrl;
}
