import "server-only";

import { isMock } from "@/mocks/config";

import { MY_PROFILE_MOCK } from "./mock/profile";
import type { MyProfile } from "./types";

/** 마이페이지 기본 정보 — 격리막(CLAUDE.md). 연동할 때 고칠 곳은 이 파일과 매퍼뿐이다. */
export async function getMyProfile(): Promise<MyProfile> {
  if (isMock) return MY_PROFILE_MOCK;

  // ⚠️ 미구현 — API 스펙 확정 후 `GET /me` 경로로 fetch하고 매퍼로 UI 계약에 맞춘다.
  throw new Error("마이페이지 조회 API가 아직 연결되지 않았습니다.");
}
