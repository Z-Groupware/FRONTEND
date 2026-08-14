import "server-only";

import { getMe } from "@/features/auth/me";
import { isMock } from "@/mocks/config";

import { MY_PROFILE_MOCK } from "./mock/profile";
import type { MyProfile } from "./types";

/**
 * "발급받은 비밀번호를 아직 쓰는가" — 로그인 뒤 배너(`PasswordChangeBanner`)를 띄울지 판정.
 *
 * ⚠️ 목에는 이 값을 낼 세션이 없다(`getMe()`가 늘 `null`) — **꺼진 채로 데모한다**(정직한
 *    목업: 되는 척 안 한다). 배너 자체를 보려면 실연동 모드에서 `passwordChanged: false`인
 *    계정으로 확인한다.
 */
export async function shouldShowPasswordChangeBanner(): Promise<boolean> {
  if (isMock) return false;

  const me = await getMe();
  return me !== null && !me.passwordChanged;
}

/**
 * 마이페이지 기본 정보 — 격리막(CLAUDE.md).
 *
 * ⚠️ **부트스트랩(`GET /api/auth/me`)을 다시 쓴다.** 같은 값을 주는 경로가 하나뿐이라
 *    따로 부르면 한 화면에서 같은 요청이 두 번 나간다 — `getMe`가 요청 단위로 묶어 준다.
 * ⚠️ **팀·직급이 비어 있을 수 있다**(온보딩 전 오너). 화면은 문자열을 기대하므로 여기서
 *    `-`로 메운다 — 빈 칸으로 두면 값을 못 불러온 것처럼 읽힌다.
 */
export async function getMyProfile(): Promise<MyProfile> {
  if (isMock) return MY_PROFILE_MOCK;

  const me = await getMe();
  if (!me) throw new Error("로그인이 필요합니다.");

  return {
    id: me.id,
    name: me.name,
    email: me.email,
    role: me.authority,
    companyName: me.companyName,
    teamName: me.teamName ?? "-",
    roleLabel: me.roleLabel,
    position: me.positionName ?? "-",
    joinedAt: me.joinedOn ?? "-",
  };
}
