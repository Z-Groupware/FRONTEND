"use server";

import { revalidatePath } from "next/cache";

import { ACTION_STATUS } from "@/constants/domain";
import { TOP_LEVEL_PROJECTS } from "@/features/project/mock/projects";
import { TEAM_ACTION_PERSONAL_ITEMS_MOCK } from "@/features/project/mock/team-action-detail";
import { todayIso } from "@/lib/date";
import { isMock } from "@/mocks/config";

import { canMoveCard, getBoardColumn } from "./lib";
import { BOARD_COLUMN, type BoardChange, type BoardColumnId, type BoardType } from "./types";

const BOARD_PATH = "/app/board";

/**
 * 보드 저장 — 드래그로 만든 변경을 한 번에 반영한다.
 * ⚠️ 화면의 드래그 제약은 UX일 뿐이다 — 여기서도 `canMoveCard`로 다시 검증한다
 *    (§권한과 같은 원칙: 화면 숨김은 보안이 아니다).
 */
/**
 * 옮긴 카드를 저장한다 — **실제로 반영한 건수를 돌려준다.**
 *
 * ⚠️ 요청한 수와 반영한 수는 다를 수 있다. 카드가 그 사이 사라졌거나(`!item`) 옮길 수 없는
 *    칸이면(`canMoveCard`) 조용히 건너뛴다 — 부르는 쪽이 요청 수를 그대로 "N건 반영했습니다"
 *    라고 말하면 화면이 거짓말을 한다(§정직성).
 */
export async function commitBoardChangesAction(
  boardType: BoardType,
  changes: BoardChange[],
): Promise<{ appliedCount: number }> {
  if (!isMock) {
    throw new Error("서버 연동 미구현 — ERD·API 스펙 확정 후 매퍼 작성");
  }

  const today = new Date();
  const items = boardType === "project" ? TOP_LEVEL_PROJECTS : findAllPersonalItems();

  let appliedCount = 0;

  for (const change of changes) {
    const item = items.find((candidate) => candidate.id === change.id);
    if (!item) continue;

    const currentColumn = getBoardColumn(
      { isDone: item.status === ACTION_STATUS.DONE, startDate: item.startDate },
      today,
    );
    if (!canMoveCard(currentColumn, change.toColumn)) continue;

    applyColumnChange(item, change.toColumn);
    appliedCount += 1;
  }

  revalidatePath(BOARD_PATH);
  return { appliedCount };
}

function findAllPersonalItems() {
  return Object.values(TEAM_ACTION_PERSONAL_ITEMS_MOCK).flat();
}

/** `status`가 도메인마다 다른 enum이지만 값(TODO/IN_PROGRESS/DONE)은 같아 그대로 대입한다. */
function applyColumnChange(
  item: { status: string; startDate: string },
  toColumn: BoardColumnId,
): void {
  if (toColumn === BOARD_COLUMN.DONE) {
    item.status = ACTION_STATUS.DONE;
    return;
  }
  if (toColumn === BOARD_COLUMN.IN_PROGRESS) {
    // ⚠️ 할 일에서 왔으면 당겨서 시작한 것이므로 시작일을 오늘로 조정한다.
    //    완료에서 돌아온 것이면 날짜는 손대지 않는다(§상태 정책).
    if (item.status === ACTION_STATUS.TODO) item.startDate = todayIso();
    item.status = ACTION_STATUS.IN_PROGRESS;
    return;
  }
  // toColumn === TODO는 드래그로 못 만드는 상태 전이라 여기 안 온다(canMoveCard가 막음).
}
