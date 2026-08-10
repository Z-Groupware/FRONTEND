"use server";

import { redirect } from "next/navigation";

import { ApiError, serverApi, toUserMessage } from "@/lib/api";
import { ep } from "@/lib/endpoints";
import { isMock } from "@/mocks/config";

import { type CredentialErrors, validateCredentials } from "./credentials";
import { findMockCompany } from "./mock/companies";
import { type RegisterDraft, type RegisterErrors, validateRegister } from "./register-draft";
import { clearSession, getAccessToken, setSession } from "./session";
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

  if (isMock) {
    const company = findMockCompany(code);
    if (!company) {
      return {
        company: null,
        error: "기업 코드를 찾을 수 없습니다. 관리자에게 다시 확인해 주세요.",
      };
    }
    return { company };
  }

  try {
    return { company: await findCompanyFromApi(code) };
  } catch (error) {
    // ⚠️ BE 문장을 그대로 쓴다 — "없는 코드"인지 "형식이 틀렸는지"는 서버가 안다
    return { company: null, error: toUserMessage(error) };
  }
}

/**
 * 기업 코드 조회 — `POST /api/companies/lookup`([확인] CompanyController).
 *
 * ⚠️ 조회인데 POST다. 기업 코드를 URL에 실으면 접속 기록·프록시 로그에 남기 때문이다.
 * ⚠️ BE 응답(`{ code, name }`)이 마침 UI 계약(`Company`)과 같은 모양이라 매퍼가 얇다 —
 *    그래도 **거쳐 간다.** BE가 필드를 더하면 여기서 흡수하고 컴포넌트는 안 고친다.
 */
async function findCompanyFromApi(code: string): Promise<Company> {
  const data = await serverApi<{ code: string; name: string }>(ep.companyLookup(), {
    method: "POST",
    json: { code: code.trim() },
  });
  return { code: data.code, name: data.name };
}

/** 기업 등록 신청 결과 — 오류가 없으면 이 화면은 사라지고 완료 화면으로 넘어간다 */
export interface RegisterState {
  errors: RegisterErrors;
  /**
   * 칸 하나에 매길 수 없는 실패 — 이미 등록된 사업자번호, 동의 누락, 통신 실패.
   * ⚠️ 칸 옆에 못 붙이는 오류를 조용히 버리면 [신청하기]가 아무 반응 없는 버튼이 된다(§정직성).
   */
  error?: string;
  /**
   * 방금 적었던 값 — **실패했을 때 칸을 되살리는 데 쓴다.**
   *
   * ⚠️ React 19의 `<form action={서버액션}>`은 액션이 끝나면 **폼을 리셋한다.** 그래서
   *    동의를 안 눌러 막힌 사람이 여섯 칸을 처음부터 다시 적게 됐다 — 화면이 돌려받은
   *    이 값으로 다시 채운다.
   * ⚠️ 성공했을 때는 안 담는다. 그때는 `redirect`라 화면이 사라진다.
   */
  values?: RegisterFieldValues;
  /**
   * 몇 번째 시도인가 — 화면이 입력칸의 `key`를 바꾸는 데 쓴다.
   * ⚠️ 리셋된 칸은 이미 마운트돼 있어서 `defaultValue`만 바꿔서는 안 채워진다.
   */
  attempt: number;
}

/** 되살릴 칸 — 화면이 상태로 쥐고 있는 칸(사업자번호·위치)은 스스로 살아남으므로 뺀다. */
export interface RegisterFieldValues {
  companyName: string;
  managerName: string;
  email: string;
  phone: string;
  /*
    ⚠️ 동의도 되살린다. 체크박스도 리셋 대상이라, 동의는 눌러 놓고 **다른 칸** 때문에 막힌
       사람이 그 사실을 모른 채 다시 제출하면 이번엔 동의 오류로 막힌다 — 오류가 돌아가며 뜬다.
  */
  agreedTerms: boolean;
  agreedPrivacy: boolean;
  agreedMarketing: boolean;
}

export async function submitRegistrationAction(
  prevState: RegisterState,
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

  const agreedTerms = formData.get("agreedTerms") === "on";
  const agreedPrivacy = formData.get("agreedPrivacy") === "on";
  const agreedMarketing = formData.get("agreedMarketing") === "on";

  /** 실패하면 항상 적었던 값을 함께 돌려준다 — 되살리는 건 화면이 한다 */
  const keep = (state: Omit<RegisterState, "values" | "attempt">): RegisterState => ({
    ...state,
    values: {
      companyName: draft.companyName,
      managerName: draft.managerName,
      email: draft.email,
      phone: draft.phone,
      agreedTerms,
      agreedPrivacy,
      agreedMarketing,
    },
    attempt: prevState.attempt + 1,
  });

  // 화면과 **같은 함수**로 다시 본다 — 검증 규칙이 두 벌이 되면 반드시 어긋난다
  const errors: RegisterErrors = validateRegister(draft);
  if (Object.keys(errors).length > 0) return keep({ errors });

  /*
    ⚠️ 필수 동의는 **스키마가 아니라 여기서** 본다. `registerSchema`는 신청서 값의 모양을
       다루고, 동의는 값이 아니라 사용자가 방금 한 행위다 — 오류 자리도 칸 옆이 아니다.
  */
  if (!agreedTerms || !agreedPrivacy) {
    return keep({ errors: {}, error: "이용약관과 개인정보 처리방침에 동의해 주세요." });
  }

  if (!isMock) {
    try {
      await sendRegistrationToApi(draft, {
        agreedTerms,
        agreedPrivacy,
        agreedMarketing,
      });
    } catch (error) {
      return keep({ errors: {}, error: toUserMessage(error) });
    }
  }

  // ⚠️ `redirect`는 내부적으로 예외를 던진다 — try/catch 밖에 둔다(§렌더링·데이터)
  redirect("/register/done");
}

/**
 * 기업 등록 신청 — `POST /api/companies/registrations`([확인] CompanyController).
 *
 * ⚠️ **승인 절차가 없다.** 제출 즉시 기업과 오너 계정이 만들어지고 기업코드·비밀번호가
 *    메일로 나간다(BE 주석). 화면 문구를 "검토 후"라고 두면 거짓말이 된다(§정직성).
 * ⚠️ 응답에 비밀번호가 없다 — 메일이 유일한 경로다. 화면에 띄울 것도 없다.
 * ⚠️ **회사 위치(주소)는 이 요청에 안 실린다.** BE `CompanyRegistrationRequest`에 주소 칸이
 *    없다 — 주소는 온보딩 뒤 `PATCH /api/companies/me`로만 들어간다. 여기서 지어내 보내면
 *    조용히 버려진다. 등록 시점에 받으려면 BE에 칸을 요청해야 한다(팀 확인 필요).
 * ⚠️ 동의 **시각은 보내지 않는다.** 서버가 찍는다 — 클라이언트가 준 시각은 분쟁에서 증거가
 *    되지 못한다(BE 주석).
 */
async function sendRegistrationToApi(
  draft: RegisterDraft,
  consents: { agreedTerms: boolean; agreedPrivacy: boolean; agreedMarketing: boolean },
): Promise<void> {
  await serverApi<{ companyId: number; companyCode: string; ownerEmail: string }>(
    ep.companyRegistrations(),
    {
      method: "POST",
      json: {
        companyName: draft.companyName.trim(),
        registrationNo: draft.businessNumber.trim(),
        // ⚠️ 대표자명이 아니라 **담당자 이름**이 간다 — BE가 이 값으로 오너 계정을 만든다
        representativeName: draft.managerName.trim(),
        managerEmail: draft.email.trim(),
        managerPhone: draft.phone.trim(),
        ...consents,
      },
    },
  );
}

/** 로그인 결과 — 칸별 오류, 로그인 실패 한 줄, 또는 지금은 여기까지라는 안내 */
export interface LoginState {
  errors: CredentialErrors;
  /**
   * 로그인 실패 — 아이디·비밀번호 어느 쪽이 틀렸는지 **가르지 않는다.**
   * BE가 전부 `LOGIN_FAILED`로 같게 답한다(주소가 있는 계정인지 알려주지 않으려고).
   */
  error?: string;
  /** 검증은 통과했지만 더 갈 수 없을 때 보여 줄 말 */
  notice?: string;
}

export async function loginAction(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const errors = validateCredentials({ email, password });
  if (Object.keys(errors).length > 0) return { errors };

  const companyCode = String(formData.get("companyCode") ?? "").trim();
  if (!companyCode) {
    // 1단계에서 확인한 코드가 숨은 칸으로 실려 온다 — 없으면 회사부터 다시 고르게 한다
    return {
      errors: {},
      error: "기업 코드를 다시 확인해 주세요. [변경]을 눌러 다시 연결해 주세요.",
    };
  }

  if (!isMock) {
    let landingPath: string;
    try {
      landingPath = await loginToApi({
        companyCode,
        email: email.trim(),
        password,
        keepSignedIn: formData.get("keepSignedIn") === "on",
      });
    } catch (error) {
      return { errors: {}, error: toUserMessage(error) };
    }

    /*
      ⚠️ **갈 곳은 서버가 정한다**(`landingPath`). 프론트가 권한으로 계산하지 않는다 —
         온보딩 전 오너는 `/onboarding/1`, 초대받은 사원은 자기 대시보드다.
      ⚠️ `redirect`는 예외를 던진다 — try/catch **밖**이다(§렌더링·데이터).
    */
    redirect(landingPath);
  }

  /*
    목으로 돌 때는 로그인시킬 서버가 없다. 조용히 아무것도 안 하면 사용자는 비밀번호가
    틀린 줄 안다 — 안 되는 건 안 된다고 말한다(§정직성).
  */
  return {
    errors: {},
    notice: "목 모드입니다. 실제 로그인은 `NEXT_PUBLIC_USE_MOCK=false`로 켜집니다.",
  };
}

/**
 * 로그인 — `POST /api/auth/login`([확인] AuthController).
 *
 * ⚠️ **토큰을 브라우저로 넘기지 않는다.** BE는 본문으로 내리고 쿠키를 굽지 않는다
 *    (`TokenResponse.java` 주석) — 여기서 받아 httpOnly 쿠키로 굽는 게 이 구조의 전부다.
 * ⚠️ **첫 비밀번호 강제 변경은 없다**(BE가 `mustChangePassword`를 아예 안 내린다).
 *    메일로 받은 비밀번호를 그대로 쓴다.
 */
async function loginToApi(input: {
  companyCode: string;
  email: string;
  password: string;
  keepSignedIn: boolean;
}): Promise<string> {
  const data = await serverApi<{
    accessToken: string;
    refreshToken: string;
    landingPath: string;
  }>(ep.login(), { method: "POST", json: input });

  await setSession(
    { accessToken: data.accessToken, refreshToken: data.refreshToken },
    input.keepSignedIn,
  );

  return data.landingPath;
}

/**
 * 로그아웃 — 갱신표를 폐기하고 쿠키를 지운다.
 *
 * ⚠️ BE 호출이 실패해도 **쿠키는 지운다.** 서버 쪽 폐기가 안 됐다고 브라우저에 토큰을 남겨
 *    두면 로그아웃을 눌렀는데 로그인 상태로 남는다 — 남은 액세스 토큰은 30분 뒤 만료된다.
 */
export async function logoutAction(): Promise<void> {
  if (!isMock) {
    try {
      const token = await getAccessToken();
      if (token) await serverApi<void>(ep.logout(), { method: "POST", accessToken: token });
    } catch (error) {
      // 이미 만료된 토큰이면 401이 온다 — 지우려던 참이라 문제가 아니다
      if (!(error instanceof ApiError)) throw error;
    }
  }

  await clearSession();
  redirect("/login");
}
