"use server";

import { revalidatePath } from "next/cache";

import { requireAccessToken } from "@/features/auth/session";
import { getViewer } from "@/features/shell/viewer";
import { serverApi, toUserMessage } from "@/lib/api";
import { ep } from "@/lib/endpoints";
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
  findBlockedTeamChange,
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
  /** 저장이 끝났는지 — 화면이 이걸 보고 토스트를 띄운다 */
  isSaved?: boolean;
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
    /*
      [확인] BE `CompanyController.updateProfile` — `PATCH /api/companies/me`.
      ⚠️ **보낸 필드만 바뀐다**(부분 수정). `code`는 대상이 아니다 — 사원 로그인 키라 바뀌면
         기존 사원이 전부 못 들어온다.
      ⚠️ **좌표는 못 보낸다.** BE가 `address` 문자열만 받는다 — 지도에서 고른 자리는
         주소 글자만 남고 핀은 저장되지 않는다(§mapper).
    */
    try {
      const accessToken = await requireAccessToken();
      await serverApi<unknown>(ep.companyMe(), {
        method: "PATCH",
        accessToken,
        json: {
          name: draft.name,
          businessNumber: draft.businessNumber,
          address: draft.place?.address ?? null,
        },
      });
    } catch (error) {
      return { errors: {}, message: toUserMessage(error) };
    }

    revalidatePath(SETTING_PATH);
    return { errors: {}, isSaved: true };
  }

  updateMockCompanyProfile(draft);
  revalidatePath(SETTING_PATH);
  /*
    ⚠️ **시각을 담지 않는다.** 전에는 `Date.now()`를 넣고 화면이 "값이 바뀌었나"로 판정했는데,
       같은 밀리초에 두 번 저장하면 값이 같아 두 번째 토스트가 안 떴다 — 이 카드는 저장해도
       화면 값이 그대로라 토스트가 유일한 신호다.
       화면은 `useActionState`가 제출마다 주는 **새 객체**를 보고 판정한다(§company-profile-card).
  */
  return { errors: {}, isSaved: true };
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
    ⚠️ **미연결 검사가 먼저다.** 아래 재검사가 `getCompanySetting()`을 부르는데, 연동 전에는
       그게 던진다 — 순서가 뒤집히면 액션 자체가 거절되어 화면이 결과 대신 아무것도 못 받는다
       (이 파일이 세 번 적어 둔 "던지지 않는다"를 스스로 깨는 자리였다).
  */
  /*
    ⚠️ **사람이 딸린 팀은 못 지운다.** 화면에서 미리 막지만 액션은 주소만 알면 직접 부를 수
       있다(§권한: 화면 숨김은 보안이 아니다). 지금 저장된 것과 견줘야 무엇이 사라졌는지 안다.
  */
  /*
    ⚠️ **사람이 딸린 팀은 못 지우고, 남의 팀 아래로도 못 넣는다.** 화면에서 미리 막지만
       액션은 직접 부를 수 있다(§권한). 지금 저장된 트리와 견줘야 무엇이 바뀌었는지 알 수 있다 —
       클라이언트가 보낸 값만 보면 "무엇이 사라졌는지"를 모른다.
  */
  const current = await getCompanySetting();
  const blocked = findBlockedTeamChange(current.departments, departments, current.teamMemberCounts);
  if (blocked) {
    return {
      isSuccess: false,
      message:
        blocked.kind === "removed"
          ? `'${blocked.team}'에 사원이 남아 있습니다. 사원 관리에서 옮긴 뒤 지워 주세요`
          : `'${blocked.team}'에는 사원이 있어 다른 팀의 역할로 옮길 수 없습니다`,
    };
  }

  if (!isMock) {
    /*
      ⚠️ **통째로 넣는 API가 없다.** BE는 팀을 한 건씩 다룬다(`POST` · `PATCH /{id}` ·
         `DELETE /{id}`) — 화면은 트리를 통째로 저장하므로 여기서 **차이를 계산해** 나눠 부른다.
      ⚠️ **지우기를 마지막에 한다.** 이름 바꾸기·새로 만들기가 먼저 끝나야, 중간에 실패해도
         남는 쪽이 더 안전하다 — 먼저 지우면 실패했을 때 팀만 사라진 상태가 된다.
      ⚠️ 새로 만든 팀은 화면에서 붙인 임시 id를 들고 온다. 서버 id가 아니므로
         **숫자로 읽히지 않는 것**을 새 팀으로 본다.
    */
    const before = new Map(current.departments.map((node) => [node.id, node.name]));
    const after = new Map(departments.map((node) => [node.id, node.name]));

    try {
      const accessToken = await requireAccessToken();

      for (const [id, name] of after) {
        const serverId = Number(id);
        if (!Number.isInteger(serverId) || !before.has(id)) {
          await serverApi<unknown>(ep.teams(), { method: "POST", accessToken, json: { name } });
        } else if (before.get(id) !== name) {
          await serverApi<unknown>(ep.team(serverId), {
            method: "PATCH",
            accessToken,
            json: { name },
          });
        }
      }

      for (const id of before.keys()) {
        if (after.has(id)) continue;
        await serverApi<unknown>(ep.team(Number(id)), { method: "DELETE", accessToken });
      }
    } catch (error) {
      return { isSuccess: false, message: toUserMessage(error) };
    }

    revalidatePath(SETTING_PATH);
    return { isSuccess: true };
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
    /* 팀과 같은 이유로 차이를 계산해 한 건씩 부른다 — 지우기는 마지막이다 */
    const current = await getCompanySetting();
    const before = new Map(current.positions.map((item) => [item.id, item]));
    const after = new Map(positions.map((item) => [item.id, item]));

    try {
      const accessToken = await requireAccessToken();

      for (const [id, position] of after) {
        const serverId = Number(id);
        const previous = before.get(id);
        const body = { name: position.name, authority: position.role, description: null };
        if (!Number.isInteger(serverId) || !previous) {
          await serverApi<unknown>(ep.jobPositions(), { method: "POST", accessToken, json: body });
        } else if (previous.name !== position.name || previous.role !== position.role) {
          await serverApi<unknown>(ep.jobPosition(serverId), {
            method: "PATCH",
            accessToken,
            json: body,
          });
        }
      }

      for (const id of before.keys()) {
        if (after.has(id)) continue;
        await serverApi<unknown>(ep.jobPosition(Number(id)), { method: "DELETE", accessToken });
      }
    } catch (error) {
      return { isSuccess: false, message: toUserMessage(error) };
    }

    revalidatePath(SETTING_PATH);
    return { isSuccess: true };
  }

  updateMockPositions(positions);
  revalidatePath(SETTING_PATH);
  return { isSuccess: true };
}
