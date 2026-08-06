import "server-only";

import { isMock } from "@/mocks/config";

import { INITIAL_DEPARTMENTS } from "./mock/departments";
import { INITIAL_POSITIONS } from "./mock/positions";
import type { DepartmentNode, Position } from "./types";

/**
 * 부서 트리 조회 — **격리막**(CLAUDE.md).
 * 컴포넌트는 `DepartmentNode`(UI 계약)만 알고, 목/실서버 분기는 여기서 끝낸다.
 * 연동할 때 고칠 곳은 이 파일과 매퍼뿐이고 컴포넌트는 건드리지 않는다.
 */
export async function getDepartments(): Promise<DepartmentNode[]> {
  if (isMock) return INITIAL_DEPARTMENTS;

  // ⚠️ 미구현 — API 스펙 확정 후 BFF 경로(`ep.departments()`)로 fetch하고 매퍼로 UI 계약에 맞춘다.
  throw new Error("팀 조회 API가 아직 연결되지 않았습니다.");
}

/** 직급 목록 조회 — 격리막. 연동 시 이 함수와 매퍼만 고친다. */
export async function getPositions(): Promise<Position[]> {
  if (isMock) return INITIAL_POSITIONS;

  // ⚠️ 미구현 — API 스펙 확정 후 BFF 경로로 fetch하고 매퍼로 UI 계약에 맞춘다.
  throw new Error("직급 조회 API가 아직 연결되지 않았습니다.");
}
