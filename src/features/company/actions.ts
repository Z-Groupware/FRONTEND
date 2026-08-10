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
          /*
            ⚠️ **`null`을 보내면 안 지워진다.** BE는 부분 수정이라 `null`을 "이 필드는 건드리지
               말라"로 읽는다 — 주소를 비우려고 지운 사람에게는 옛 주소가 그대로 남는다.
               빈 문자열을 보내야 실제로 비워진다(`@Size`만 걸려 있어 통과한다).
          */
          address: draft.place?.address ?? "",
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
  /*
    ⚠️ **여기서 던지면 카드가 아니라 페이지가 죽는다.** `getCompanySetting()`은 서버를
       세 번 부르므로 얼마든지 실패할 수 있는데, `try` 밖에 두면 그 예외가 그대로 올라가
       error boundary가 화면을 통째로 갈아치운다 — 방금 짠 팀 구조가 다 날아간다.
       이 파일이 세 번 적어 둔 "던지지 않는다"를 스스로 깨는 자리였다.
  */
  let current: Awaited<ReturnType<typeof getCompanySetting>>;
  try {
    current = await getCompanySetting();
  } catch (error) {
    return { isSuccess: false, message: toUserMessage(error) };
  }

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
      ⚠️ **지우기를 먼저 한다.** 처음엔 마지막에 뒀는데, 지운 팀의 이름을 다른 팀에 다시
         쓰거나 두 팀 이름을 맞바꾸면 **같은 이름이 잠깐 둘**이 되어 서버가 막는다 —
         지우고 나서 만들면 그 자리가 비어 있다.
      ⚠️ 대신 **사람이 딸린 팀은 위에서 이미 걸렀다**(`findBlockedTeamChange`). 지우기가
         먼저여도 사람이 붕 뜨지 않는다.
      ⚠️ 새로 만든 팀은 화면에서 붙인 임시 id를 들고 온다. 서버 id가 아니므로
         **숫자로 읽히지 않는 것**을 새 팀으로 본다.
    */
    /*
      ⚠️ **팀 안 '역할' 라벨은 저장할 곳이 없다.** BE에 그걸 다루는 API가 없다(전 레포에
         `roleLabel` 관리 경로 0건) — 팀만 저장하고 성공이라고 말하면 **역할을 고친 사람이
         저장됐다고 믿는다**(§정직성). 바뀐 게 있으면 그 사실을 말하고 멈춘다.
    */
    /*
      ⚠️ **이름 변경 여부와 무관하게 막는다.** 처음엔 "이름도 같이 바뀌었으면 통과"로 뒀는데,
         보내는 본문은 `{ name }`뿐이라 그때도 역할은 안 저장된다 — 이름만 바뀌고 역할은
         사라진 채 **성공**이라고 말하게 된다. 역할은 팀과 따로 세어야 한다.
    */
    const rolesOf = (nodes: DepartmentNode[]) =>
      nodes
        .map((node) => `${node.id}:${node.children.map((child) => child.name).join(",")}`)
        .sort()
        .join("|");
    if (rolesOf(current.departments) !== rolesOf(departments)) {
      return {
        isSuccess: false,
        message: "팀 안 역할은 아직 저장할 수 없습니다. 팀 이름만 바꿔 주세요",
      };
    }

    const before = new Map(current.departments.map((node) => [node.id, node.name]));
    const after = new Map(departments.map((node) => [node.id, node.name]));

    try {
      const accessToken = await requireAccessToken();

      for (const id of before.keys()) {
        if (after.has(id)) continue;
        await serverApi<unknown>(ep.team(Number(id)), { method: "DELETE", accessToken });
      }

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
    } catch (error) {
      /*
        ⚠️ **실패해도 화면을 다시 읽는다.** 한 건씩 부르므로 **중간까지는 이미 반영돼 있다** —
           그대로 두면 화면은 옛 트리를 들고 있고 서버는 반쯤 바뀐 상태라, 사람이 다시 저장을
           누르면 이미 만든 팀을 또 만든다.
      */
      revalidatePath(SETTING_PATH);
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
    /* 팀과 같은 이유로 차이를 계산해 한 건씩 부른다. 지우기가 먼저다 */
    let current: Awaited<ReturnType<typeof getCompanySetting>>;
    try {
      current = await getCompanySetting();
    } catch (error) {
      /* 팀 저장과 같은 이유 — 던지면 카드가 아니라 페이지가 죽는다 */
      return { isSuccess: false, message: toUserMessage(error) };
    }
    const before = new Map(current.positions.map((item) => [item.id, item]));
    const after = new Map(positions.map((item) => [item.id, item]));

    try {
      const accessToken = await requireAccessToken();

      for (const id of before.keys()) {
        if (after.has(id)) continue;
        await serverApi<unknown>(ep.jobPosition(Number(id)), { method: "DELETE", accessToken });
      }

      for (const [id, position] of after) {
        const serverId = Number(id);
        const previous = before.get(id);
        /*
          ⚠️ **`description`은 필수다**(BE `@NotBlank`). `null`을 보내면 **항상 400**이다.
             화면에 그 칸이 없어 사람이 적을 길이 없으므로, 서버에서 읽어 온 값을 그대로
             되돌려 보내고 새 직급이면 이름으로 채운다 — 빈 문자열도 `@NotBlank`에 걸린다.
        */
        const description = position.description?.trim() || position.name;
        const body = { name: position.name, authority: position.role, description };
        if (!Number.isInteger(serverId) || !previous) {
          await serverApi<unknown>(ep.jobPositions(), { method: "POST", accessToken, json: body });
        } else if (
          previous.name !== position.name ||
          previous.role !== position.role ||
          (previous.description ?? "") !== description
        ) {
          await serverApi<unknown>(ep.jobPosition(serverId), {
            method: "PATCH",
            accessToken,
            json: body,
          });
        }
      }
    } catch (error) {
      /* 팀과 같은 이유 — 중간까지 반영됐으므로 실패해도 화면을 다시 읽는다 */
      revalidatePath(SETTING_PATH);
      return { isSuccess: false, message: toUserMessage(error) };
    }

    revalidatePath(SETTING_PATH);
    return { isSuccess: true };
  }

  updateMockPositions(positions);
  revalidatePath(SETTING_PATH);
  return { isSuccess: true };
}
