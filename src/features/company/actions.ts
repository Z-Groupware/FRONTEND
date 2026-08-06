"use server";

import { revalidatePath } from "next/cache";

import { getViewer } from "@/features/shell/viewer";
import { canManageCompany } from "@/lib/permission";
import { isMock } from "@/mocks/config";

import {
  updateMockCompanyProfile,
  updateMockDepartments,
  updateMockPositions,
} from "./mock/company";
import { getCompanySetting } from "./server";
import type {
  CompanyActionResult,
  CompanyProfileDraft,
  CompanyProfileErrors,
  DepartmentNode,
  Position,
} from "./types";
import {
  findBlockedTeamRemoval,
  validateCompanyProfile,
  validateDepartments,
  validatePositions,
} from "./validate";

/**
 * 기업 설정의 **변경 작업**. 전부 서버에서 돈다(핵심 4원칙 ②).
 *
 * ⚠️ **권한을 서버에서 다시 본다.** 화면에서 폼을 감춘 건 UX일 뿐이고, 액션은 주소만 알면
 *    직접 부를 수 있다(§권한). 조직 체계는 **권한이 나오는 곳**이라 특히 그렇다.
 * ⚠️ 화면과 **같은 함수**로 다시 검증한다 — 규칙이 두 벌이면 어긋난다.
 */

const SETTING_PATH = "/owner/setting";

const FORBIDDEN = "기업 설정을 바꿀 권한이 없습니다";

const NOT_CONNECTED = "저장 기능이 아직 연결되지 않았습니다";

/**
 * 세션을 못 읽었을 때.
 * ⚠️ **권한 없음과 다른 말이다.** 쿠키가 만료된 OWNER에게 "권한이 없습니다"라고 하면
 *    할 수 있는 게 없어진다 — 다시 로그인하면 되는 상황이라고 말해 줘야 한다(§정직성).
 */
const NO_SESSION = "세션이 만료되었습니다. 다시 로그인해 주세요";

/**
 * 문지기 — 통과면 `null`, 막히면 이유 한 줄.
 *
 * ⚠️ **던지지 않는다.** 던지면 화면이 결과 대신 아무것도 못 받는다.
 * ⚠️ 신원은 화면과 **같은 출처**(`getViewer`)에서 읽는다. 화면은 `getViewer`, 액션은
 *    `getMockActor`로 갈라 두면 세션이 붙을 때 한쪽만 바뀌어 판정이 어긋난다.
 * ⚠️ 세션 실패와 권한 거부를 **나눠 적는다** — 사용자가 할 수 있는 일이 다르다.
 */
async function denyReason(): Promise<string | null> {
  let viewer;
  try {
    viewer = await getViewer();
  } catch {
    return NO_SESSION;
  }
  return canManageCompany(viewer) ? null : FORBIDDEN;
}

/** 기본 정보 폼 결과 — `useActionState`가 그대로 들고 있는 모양 */
export interface CompanyProfileFormState {
  errors: CompanyProfileErrors;
  /**
   * 칸과 **무관한** 실패 한 줄(권한 없음·미연동 등).
   * ⚠️ 이걸 `errors.name`에 담으면 안 된다. 기업명 칸 밑에 빨간 글씨로 붙어서
   *    "이름을 잘못 적었다"로 읽히고, 고쳐 다시 눌러도 같은 결과가 나온다 —
   *    칸 밑 인라인은 **그 칸의 값이 틀렸을 때만** 쓰는 자리다(§토스트).
   */
  message?: string;
  /** 성공한 저장의 일련번호. 값이 바뀐 걸 보고 화면이 토스트를 띄운다 */
  savedAt?: number;
}

/**
 * ⚠️ 위치는 **숨은 칸 셋**으로 온다(`placeAddress`·`placeLat`·`placeLng`) — 신청 화면과 같은
 *    모양이다. 지도가 고른 값이라 사람이 적는 칸이 없다.
 * ⚠️ 주소가 비면 `null`이다. 좌표만 있고 주소가 없는 값은 위치로 치지 않는다.
 */
function readDraft(formData: FormData): CompanyProfileDraft {
  const address = String(formData.get("placeAddress") ?? "");

  return {
    name: String(formData.get("name") ?? ""),
    businessNumber: String(formData.get("businessNumber") ?? ""),
    place: address
      ? {
          address,
          lat: Number(formData.get("placeLat") ?? 0),
          lng: Number(formData.get("placeLng") ?? 0),
        }
      : null,
  };
}

export async function saveCompanyProfileAction(
  _prev: CompanyProfileFormState,
  formData: FormData,
): Promise<CompanyProfileFormState> {
  const denied = await denyReason();
  if (denied) return { errors: {}, message: denied };

  const draft = readDraft(formData);
  const errors = validateCompanyProfile(draft);
  if (Object.keys(errors).length > 0) return { errors };

  /*
    ⚠️ **던지지 않는다.** 저장 실패는 화면 전체 실패가 아니다 — 던지면 error boundary가
       카드를 통째로 갈아치워 방금 적은 값이 다 날아간다(§토스트: error.tsx는 페이지 전체 실패용).
  */
  if (!isMock) {
    // TODO(BE 협의): `PATCH /companies/me`
    return { errors: {}, message: NOT_CONNECTED };
  }

  updateMockCompanyProfile(draft);
  revalidatePath(SETTING_PATH);
  // 같은 값을 두 번 저장해도 화면이 알아채게 매번 다른 값을 준다
  return { errors: {}, savedAt: Date.now() };
}

/**
 * 팀 체계 저장.
 * ⚠️ 트리를 **통째로** 보낸다 — 순서와 계층이 값이라 한 줄씩 보내면 중간 상태가 저장된다.
 */
export async function saveDepartmentsAction(
  departments: DepartmentNode[],
): Promise<CompanyActionResult> {
  const denied = await denyReason();
  if (denied) return { isSuccess: false, message: denied };

  const error = validateDepartments(departments);
  if (error) return { isSuccess: false, message: error };

  /*
    ⚠️ **사람이 딸린 팀은 못 지운다.** 화면에서 미리 막지만 액션은 직접 부를 수 있다
       (§권한: 화면 숨김은 보안이 아니다). 지금 저장된 트리와 견줘 사라진 팀을 찾는다 —
       클라이언트가 보낸 값만 보면 "무엇이 사라졌는지"를 알 수 없다.
  */
  const current = await getCompanySetting();
  const blocked = findBlockedTeamRemoval(
    current.departments,
    departments,
    current.teamMemberCounts,
  );
  if (blocked) {
    return {
      isSuccess: false,
      message: `'${blocked}'에 사원이 남아 있습니다. 사원 관리에서 옮긴 뒤 지워 주세요`,
    };
  }

  // ⚠️ 던지지 않는다 — 저장 실패는 화면 전체 실패가 아니다(§기업 정보 저장과 같은 이유)
  if (!isMock) {
    // TODO(BE 협의): `PUT /companies/me/teams`
    return { isSuccess: false, message: NOT_CONNECTED };
  }

  updateMockDepartments(departments);
  revalidatePath(SETTING_PATH);
  return { isSuccess: true };
}

/** 직급·권한 저장 — 팀 체계와 같은 이유로 목록을 통째로 보낸다. */
export async function savePositionsAction(positions: Position[]): Promise<CompanyActionResult> {
  const denied = await denyReason();
  if (denied) return { isSuccess: false, message: denied };

  const error = validatePositions(positions);
  if (error) return { isSuccess: false, message: error };

  // ⚠️ 던지지 않는다 — 저장 실패는 화면 전체 실패가 아니다
  if (!isMock) {
    // TODO(BE 협의): `PUT /companies/me/positions`
    return { isSuccess: false, message: NOT_CONNECTED };
  }

  updateMockPositions(positions);
  revalidatePath(SETTING_PATH);
  return { isSuccess: true };
}
