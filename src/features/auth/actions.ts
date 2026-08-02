"use server";

import { redirect } from "next/navigation";

import { isMock } from "@/mocks/config";

import { findMockCompany } from "./mock/companies";
import { type RegisterDraft, type RegisterErrors, validateRegister } from "./register-draft";
import type { Company } from "./types";

/**
 * 로그인 전 화면의 **변경·조회 창구** — 격리막(CLAUDE.md §Mock 격리막).
 *
 * ⚠️ 목/실서버 분기는 **여기서 끝난다.** 컴포넌트는 `Company`·`RegisterErrors`(UI 계약)만 알고
 *    `isMock`이 있는지도 모른다 — 연동할 때 고칠 곳은 이 파일과 매퍼뿐이다.
 * ⚠️ Server Action이라 **토큰이 브라우저로 나가지 않는다**(§핵심 4원칙 ②). 브라우저는 Next
 *    서버에만 말을 걸고, BE와의 대화는 이 서버가 대신한다.
 * ⚠️ 화면에서 이미 검증했더라도 **여기서 다시 본다.** 화면 검증은 편의일 뿐이고 판정은
 *    서버가 한다(§권한: 화면 숨김은 보안이 아니다).
 */

/** 기업 코드 확인 결과 — `useActionState`가 그대로 들고 있는 모양 */
export interface CompanyCodeState {
  company: Company | null;
  error?: string;
}

export async function findCompanyAction(
  _prevState: CompanyCodeState,
  formData: FormData,
): Promise<CompanyCodeState> {
  const code = String(formData.get("companyCode") ?? "");
  if (!code.trim()) return { company: null, error: "기업 코드를 입력해 주세요" };

  const company = isMock ? findMockCompany(code) : await findCompanyFromApi();
  if (!company) {
    return { company: null, error: "기업 코드를 찾을 수 없어요. 관리자에게 다시 확인해 주세요." };
  }
  return { company };
}

/** ⚠️ 미구현 — API 스펙 확정 후 BFF 경로로 fetch하고 매퍼로 UI 계약(`Company`)에 맞춘다. */
async function findCompanyFromApi(): Promise<Company | null> {
  throw new Error("기업 코드 확인 API가 아직 연결되지 않았습니다.");
}

/** 기업 등록 신청 결과 — 오류가 없으면 이 화면은 사라지고 완료 화면으로 넘어간다 */
export interface RegisterState {
  errors: RegisterErrors;
}

export async function submitRegistrationAction(
  _prevState: RegisterState,
  formData: FormData,
): Promise<RegisterState> {
  const address = String(formData.get("placeAddress") ?? "");
  const draft: RegisterDraft = {
    companyName: String(formData.get("companyName") ?? ""),
    businessNumber: String(formData.get("businessNumber") ?? ""),
    managerName: String(formData.get("managerName") ?? ""),
    email: String(formData.get("email") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    place: address
      ? {
          address,
          lat: Number(formData.get("placeLat") ?? 0),
          lng: Number(formData.get("placeLng") ?? 0),
        }
      : null,
  };

  // 화면과 **같은 함수**로 다시 본다 — 검증 규칙이 두 벌이 되면 반드시 어긋난다
  const errors: RegisterErrors = validateRegister(draft);
  if (Object.keys(errors).length > 0) return { errors };

  if (!isMock) await sendRegistrationToApi();

  // ⚠️ `redirect`는 내부적으로 예외를 던진다 — try/catch 밖에 둔다(§렌더링·데이터)
  redirect("/register/done");
}

/** ⚠️ 미구현 — API 스펙 확정 후 BFF 경로로 POST한다. 지금은 목이라 보내지 않는다. */
async function sendRegistrationToApi(): Promise<void> {
  throw new Error("기업 등록 신청 API가 아직 연결되지 않았습니다.");
}
