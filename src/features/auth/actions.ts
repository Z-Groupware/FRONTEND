"use server";

import { redirect } from "next/navigation";

import { isMock } from "@/mocks/config";

import { type CredentialErrors, validateCredentials } from "./credentials";
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
    return { company: null, error: "기업 코드를 찾을 수 없습니다. 관리자에게 다시 확인해 주세요." };
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

/** 로그인 결과 — 칸별 오류, 또는 지금은 여기까지라는 안내 */
export interface LoginState {
  errors: CredentialErrors;
  /** 검증은 통과했지만 더 갈 수 없을 때 보여 줄 말 */
  notice?: string;
}

export async function loginAction(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  const errors = validateCredentials({
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
  });
  if (Object.keys(errors).length > 0) return { errors };

  /*
    ⚠️ **로그인 API가 아직 없다**(BE 미개발). 여기서 조용히 아무것도 안 하면 사용자는
       비밀번호가 틀린 줄 안다 — 안 되는 건 안 된다고 말한다(§정직성).
    ⚠️ 연동되면 이 자리에서 BE에 붙고, 받은 토큰을 **httpOnly 쿠키로** 굽는다.
       "로그인 상태 유지" 체크값이 그 쿠키의 수명(`maxAge`)이 된다.
    ⚠️ 그다음 갈 곳은 **`loginRedirect()`가 정한다**(`features/shell/entry.ts`).
       여기에 `redirect("/owner")`처럼 적지 않는다 — 첫 로그인이 대표(→온보딩)일 수도,
       초대받은 사원(→자기 역할 대시보드)일 수도 있다.

         const entry = { viewer, isOnboarded, status };   // 로그인 응답에서 온다
         redirect(loginRedirect(entry));                  // ⚠️ try/catch 밖에서

    ⚠️ 그래서 **로그인 응답에 `isOnboarded`와 구독 상태가 같이 와야 한다**(BE 협의 필요).
       없으면 로그인 직후에 한 번 더 물어봐야 해서 첫 화면이 그만큼 늦게 뜬다.
    ⚠️ **첫 비밀번호는 바꾸지 않는다**(팀 결정 2026-08-04, BE 미구현). 메일로 받은 비밀번호를
       그대로 쓴다 — 강제 변경 화면을 만들지 않는다. 나중에 붙이면 그 화면이 여기 분기에 하나 는다.
  */
  if (isMock) {
    return {
      errors: {},
      notice: "로그인 API가 아직 연결되지 않았습니다. 화면만 준비된 상태입니다.",
    };
  }

  throw new Error("로그인 API가 아직 연결되지 않았습니다.");
}
