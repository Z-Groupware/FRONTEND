"use server";

import { revalidatePath } from "next/cache";

import { getViewer } from "@/features/shell/viewer";
import { canManageStorage } from "@/lib/permission";
import { isMock } from "@/mocks/config";

import { getStorageOverview } from "./server";
import { canDeleteRecordings } from "./storage";

/**
 * 녹음 용량의 **변경 작업**. 전부 서버에서 돈다.
 *
 * ⚠️ 브라우저 → Next서버(액션) → BE 순서다(CLAUDE.md 핵심 4원칙 ②).
 * ⚠️ **되돌릴 수 없는 일이다.** 지운 음성은 복구되지 않는다 — 그래서 권한도, 지울 수 있는
 *    줄인지도 **서버에서 다시 본다**. 화면에서 버튼을 감춘 건 UX일 뿐이고, 액션은 주소만
 *    알면 직접 부를 수 있다(§권한: 화면 숨김은 보안이 아니다).
 * ⚠️ 아직 목이다. BE 스펙이 확정되면 본문만 채운다 — 부르는 쪽은 그대로다.
 */

/** 액션의 공통 결과 — 실패를 예외로 던지지 않고 값으로 돌려준다(화면이 문구를 고른다) */
export interface StorageActionResult {
  isSuccess: boolean;
  /** 실패 사유 한 줄. 성공이면 없다 */
  message?: string;
}

const FORBIDDEN: StorageActionResult = {
  isSuccess: false,
  message: "녹음을 지울 권한이 없습니다",
};

/**
 * 권한 문지기.
 *
 * ⚠️ **던지지 않는다.** 세션을 못 읽으면 `getViewer`가 예외를 내는데, 그대로 두면 액션이
 *    거절되어 화면은 결과 대신 아무것도 못 받는다 — 못 읽으면 **권한 없음으로 본다.**
 */
async function assertCanManage(): Promise<boolean> {
  try {
    return canManageStorage(await getViewer());
  } catch {
    return false;
  }
}

/**
 * 한 프로젝트의 **음성 파일만** 지운다.
 *
 * ⚠️ 자막·요약·액션은 그대로 둔다. 회의에서 남은 결과물이라, 같이 지우면 지식이 사라진다
 *    — 이 화면이 "녹음 용량"인 이유다(CLAUDE.md §브라우저 API: 음성=아카이브 자산).
 * ⚠️ **끝난 프로젝트만** 지운다. 화면에서 버튼을 감추는 것만으로는 부족해서 여기서 다시 본다.
 */
export async function deleteRecordingsAction(tag: string): Promise<StorageActionResult> {
  if (!(await assertCanManage())) return FORBIDDEN;

  /*
    ⚠️ **지울 수 있는 줄인지 서버가 판정한다.** 화면이 보낸 태그를 그대로 믿으면
       진행 중인 프로젝트의 녹음도 지워진다 — 되돌릴 수 없는 일이라 여기서 막는다.
  */
  const overview = await getStorageOverview();
  const target = overview.projects.find((project) => project.tag === tag);

  if (!target) return { isSuccess: false, message: "프로젝트를 찾지 못했습니다" };
  if (!canDeleteRecordings(target)) {
    return { isSuccess: false, message: "끝난 프로젝트의 녹음만 지울 수 있습니다" };
  }

  if (isMock) {
    revalidatePath("/manage/storage");
    // ⚠️ 목이라 실제로는 아무것도 안 지운다 — 화면은 지운 것처럼 움직인다(§정직성)
    return { isSuccess: true };
  }

  // TODO(BE 협의): `DELETE /companies/me/storage/projects/{tag}/recordings`
  return { isSuccess: false, message: "녹음을 지우지 못했습니다" };
}
