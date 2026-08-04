"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getMockActor } from "@/lib/mock-actor";
import { canManageNotice } from "@/lib/permission";
import { isMock } from "@/mocks/config";

import { addMockNotice, markMockNoticeRead, updateMockNotice } from "./mock/notices";
import type { NoticeDraft, NoticeFormErrors } from "./types";
import { validateNoticeDraft } from "./validate";

const LIST_PATH = "/app/notice";

/**
 * 공지 읽음 처리 — 격리막(CLAUDE.md §Mock 격리막).
 * ⚠️ 상세를 열면 그 화면의 잎사귀가 이 액션을 부른다(부수효과 없는 조회와 분리). 끝나면
 *    `revalidatePath`로 목록 미읽음 점·사이드바 표시를 갱신한다.
 * ⚠️ 지금은 목이라 **전역** 읽음이다 — 세션이 붙으면 "이 사용자" 기준으로 바뀐다(§정직성).
 */
export async function markNoticeReadAction(formData: FormData): Promise<void> {
  if (!isMock) {
    // ⚠️ 미구현 — API 스펙 확정 후 BFF 경로로 읽음 처리 요청을 보낸다.
    throw new Error("공지 읽음 처리 API가 아직 연결되지 않았습니다.");
  }

  const id = String(formData.get("id") ?? "");
  markMockNoticeRead(id);
  // 목록 경로만 무효화한다 — 상세(현재 경로)는 건드리지 않아 재검증→재제출 루프가 안 생긴다.
  revalidatePath(LIST_PATH);
}

/** 작성·수정 폼 결과 — `useActionState`가 그대로 들고 있는 모양. */
export interface NoticeFormState {
  errors: NoticeFormErrors;
}

function readDraft(formData: FormData): NoticeDraft {
  return {
    title: String(formData.get("title") ?? ""),
    body: String(formData.get("body") ?? ""),
  };
}

/**
 * 공지 작성 — 격리막(CLAUDE.md §Mock 격리막).
 * ⚠️ **권한을 서버에서 다시 본다** — 화면 숨김은 UX일 뿐 보안이 아니다(§권한). 지금은 목 actor다.
 * ⚠️ 화면과 **같은 함수**(`validateNoticeDraft`)로 다시 검증한다 — 규칙이 두 벌이면 어긋난다.
 */
export async function createNoticeAction(
  _prev: NoticeFormState,
  formData: FormData,
): Promise<NoticeFormState> {
  if (!canManageNotice(getMockActor())) return { errors: { title: "공지를 작성할 권한이 없어요" } };

  const draft = readDraft(formData);
  const errors = validateNoticeDraft(draft);
  if (Object.keys(errors).length > 0) return { errors };

  if (!isMock) {
    // ⚠️ 미구현 — API 스펙 확정 후 BFF 경로로 작성 요청을 보낸다.
    throw new Error("공지 작성 API가 아직 연결되지 않았습니다.");
  }

  // "YYYY-MM-DD" — 발행일은 서버 기준으로 찍는다(목 데이터는 날짜를 만들지 않는다).
  const publishedAt = new Date().toISOString().slice(0, 10);
  addMockNotice(draft, publishedAt);

  revalidatePath(LIST_PATH);
  // ⚠️ `redirect`는 내부적으로 예외를 던진다 — try/catch 밖에 둔다(§렌더링·데이터)
  redirect(LIST_PATH);
}

/** 공지 수정 — 작성과 같은 규칙. 끝나면 그 공지 상세로 돌아간다. */
export async function updateNoticeAction(
  _prev: NoticeFormState,
  formData: FormData,
): Promise<NoticeFormState> {
  if (!canManageNotice(getMockActor())) return { errors: { title: "공지를 수정할 권한이 없어요" } };

  const id = String(formData.get("id") ?? "");
  const draft = readDraft(formData);
  const errors = validateNoticeDraft(draft);
  if (Object.keys(errors).length > 0) return { errors };

  if (!isMock) {
    // ⚠️ 미구현 — API 스펙 확정 후 BFF 경로로 수정 요청을 보낸다.
    throw new Error("공지 수정 API가 아직 연결되지 않았습니다.");
  }

  const updated = updateMockNotice(id, draft);
  if (!updated) return { errors: { title: "수정할 공지를 찾을 수 없어요" } };

  revalidatePath(LIST_PATH);
  revalidatePath(`${LIST_PATH}/${id}`);
  redirect(`${LIST_PATH}/${id}`);
}
