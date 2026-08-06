"use server";

import { revalidatePath } from "next/cache";

import { getMockActor } from "@/lib/mock-actor";
import { canManageCompany } from "@/lib/permission";
import { isMock } from "@/mocks/config";

import {
  updateMockCompanyProfile,
  updateMockDepartments,
  updateMockPositions,
} from "./mock/company";
import type {
  CompanyActionResult,
  CompanyProfileDraft,
  CompanyProfileErrors,
  DepartmentNode,
  Position,
} from "./types";
import { validateCompanyProfile, validateDepartments, validatePositions } from "./validate";

/**
 * 기업 설정의 **변경 작업**. 전부 서버에서 돈다(핵심 4원칙 ②).
 *
 * ⚠️ **권한을 서버에서 다시 본다.** 화면에서 폼을 감춘 건 UX일 뿐이고, 액션은 주소만 알면
 *    직접 부를 수 있다(§권한). 조직 체계는 **권한이 나오는 곳**이라 특히 그렇다.
 * ⚠️ 화면과 **같은 함수**로 다시 검증한다 — 규칙이 두 벌이면 어긋난다.
 */

const SETTING_PATH = "/owner/setting";

const FORBIDDEN = "기업 설정을 바꿀 권한이 없습니다";

/** 세션을 못 읽으면 **권한 없음으로 본다** — 던지면 화면이 결과 대신 아무것도 못 받는다 */
function canManage(): boolean {
  try {
    return canManageCompany(getMockActor());
  } catch {
    return false;
  }
}

/** 기본 정보 폼 결과 — `useActionState`가 그대로 들고 있는 모양 */
export interface CompanyProfileFormState {
  errors: CompanyProfileErrors;
  /** 성공한 저장의 일련번호. 값이 바뀐 걸 보고 화면이 토스트를 띄운다 */
  savedAt?: number;
}

function readDraft(formData: FormData): CompanyProfileDraft {
  return {
    name: String(formData.get("name") ?? ""),
    businessNumber: String(formData.get("businessNumber") ?? ""),
    ceoName: String(formData.get("ceoName") ?? ""),
    address: String(formData.get("address") ?? ""),
    phone: String(formData.get("phone") ?? ""),
  };
}

export async function saveCompanyProfileAction(
  _prev: CompanyProfileFormState,
  formData: FormData,
): Promise<CompanyProfileFormState> {
  if (!canManage()) return { errors: { name: FORBIDDEN } };

  const draft = readDraft(formData);
  const errors = validateCompanyProfile(draft);
  if (Object.keys(errors).length > 0) return { errors };

  if (!isMock) {
    // TODO(BE 협의): `PATCH /companies/me`
    throw new Error("기업 정보 저장 API가 아직 연결되지 않았습니다.");
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
  if (!canManage()) return { isSuccess: false, message: FORBIDDEN };

  const error = validateDepartments(departments);
  if (error) return { isSuccess: false, message: error };

  if (!isMock) {
    // TODO(BE 협의): `PUT /companies/me/teams`
    throw new Error("팀 체계 저장 API가 아직 연결되지 않았습니다.");
  }

  updateMockDepartments(departments);
  revalidatePath(SETTING_PATH);
  return { isSuccess: true };
}

/** 직급·권한 저장 — 팀 체계와 같은 이유로 목록을 통째로 보낸다. */
export async function savePositionsAction(positions: Position[]): Promise<CompanyActionResult> {
  if (!canManage()) return { isSuccess: false, message: FORBIDDEN };

  const error = validatePositions(positions);
  if (error) return { isSuccess: false, message: error };

  if (!isMock) {
    // TODO(BE 협의): `PUT /companies/me/positions`
    throw new Error("직급 저장 API가 아직 연결되지 않았습니다.");
  }

  updateMockPositions(positions);
  revalidatePath(SETTING_PATH);
  return { isSuccess: true };
}
