import { z } from "zod";

import { AUTHORITY, POSITION_AUTHORITIES } from "@/constants/domain";
import { registerSchema } from "@/features/auth/register-draft";
import { MAX_DEPARTMENT_DEPTH, MAX_ORG_NAME_LENGTH } from "@/features/onboarding/types";

import type { CompanyProfileDraft, CompanyProfileErrors, DepartmentNode, Position } from "./types";

/**
 * 기업 설정 검증 — **화면과 서버가 같은 함수를 쓴다.**
 * 규칙이 두 벌이면 화면은 통과시키고 서버는 막는 일이 생긴다.
 */

/**
 * 기본 정보 규칙은 **기업 등록 신청과 같은 것**을 쓴다.
 *
 * ⚠️ 여기서 규칙을 새로 적으면 신청 때는 통과한 값이 설정에서 막히거나 그 반대가 된다 —
 *    같은 회사의 같은 값이다. 신청 스키마의 칸을 그대로 꺼내 쓴다(칸 이름만 우리 것).
 */
const companyProfileSchema = z.object({
  name: registerSchema.shape.companyName,
  businessNumber: registerSchema.shape.businessNumber,
  place: registerSchema.shape.place,
});

export function validateCompanyProfile(draft: CompanyProfileDraft): CompanyProfileErrors {
  const result = companyProfileSchema.safeParse(draft);
  if (result.success) return {};

  const errors: CompanyProfileErrors = {};
  for (const issue of result.error.issues) {
    const field = issue.path[0];
    // 한 칸에 오류가 여럿이면 **첫 줄만** 쓴다(신청 화면과 같은 규칙)
    if (typeof field === "string" && !(field in errors)) {
      errors[field as keyof CompanyProfileDraft] = issue.message;
    }
  }
  return errors;
}

/**
 * 팀 체계 검증 — **서버가 다시 본다.**
 *
 * ⚠️ 화면의 편집 훅이 이미 막는 것들이지만, 액션은 주소만 알면 직접 부를 수 있다
 *    (§권한: 화면 숨김은 보안이 아니다). 조직 체계는 권한이 나오는 곳이라 특히 그렇다.
 */
export function validateDepartments(departments: DepartmentNode[]): string | null {
  if (departments.length === 0) return "팀을 하나 이상 두어야 합니다";

  let error: string | null = null;

  const walk = (nodes: DepartmentNode[], depth: number) => {
    if (error) return;
    if (depth >= MAX_DEPARTMENT_DEPTH && nodes.length > 0) {
      /*
        ⚠️ 상수를 그대로 문장에 끼우면 틀린 말이 된다. `MAX_DEPARTMENT_DEPTH`는 팀을 **포함한**
           전체 단수(팀 → 역할)라, "팀 아래 2단"이라고 적으면 한 단을 더 만들 수 있다고 읽힌다.
           카드 설명("팀 아래 역할까지 두 단계입니다")과 같은 말을 쓴다.
      */
      error = "팀 아래에는 역할 한 단계만 둘 수 있습니다";
      return;
    }

    const seen = new Set<string>();
    for (const node of nodes) {
      const name = node.name.trim();
      if (!name) {
        error = "이름이 비어 있는 항목이 있습니다";
        return;
      }
      if (name.length > MAX_ORG_NAME_LENGTH) {
        error = `이름은 ${MAX_ORG_NAME_LENGTH}자까지입니다`;
        return;
      }
      // 같은 부모 아래에서만 본다 — 다른 팀에 같은 이름의 역할이 있는 건 정상이다
      if (seen.has(name)) {
        error = `같은 이름이 둘 있습니다 — ${name}`;
        return;
      }
      seen.add(name);
      walk(node.children, depth + 1);
    }
  };

  walk(departments, 0);
  return error;
}

/**
 * 직급 검증 — 이름과 **리더 하나 규칙**.
 * ⚠️ 리더 직급은 회사에 하나뿐이다(CLAUDE.md §권한). 둘이 되면 팀 범위 판정이 무너진다.
 */
export function validatePositions(positions: Position[]): string | null {
  if (positions.length === 0) return "직급을 하나 이상 두어야 합니다";

  /*
    ⚠️ **권한 값을 화이트리스트로 본다.** 화면 셀렉트는 `POSITION_AUTHORITIES`(Leader·Member)만
       주지만, Server Action은 주소만 알면 직접 부를 수 있다(§권한: 화면 숨김은 보안이 아니다).
       여기가 없으면 `role: "OWNER"`인 직급을 심을 수 있고, **권한은 직급에서 오므로**
       그 직급을 받은 사람 전원이 회사 전체 권한을 얻는다 —
       `canManageCompany`·`canApproveFinal`·`canManageBilling`이 전부 열린다.
    ⚠️ 타입으로는 안 막힌다. `AssignableRole`은 `ASSIGNABLE_AUTHORITIES`(OWNER 포함)이고
       Server Action 인자에는 런타임 검사가 없다.
  */
  const allowed: readonly string[] = POSITION_AUTHORITIES;
  if (positions.some((position) => !allowed.includes(position.role))) {
    return "직급에 줄 수 없는 권한입니다";
  }

  const seen = new Set<string>();
  for (const position of positions) {
    const name = position.name.trim();
    if (!name) return "이름이 비어 있는 직급이 있습니다";
    if (name.length > MAX_ORG_NAME_LENGTH) return `이름은 ${MAX_ORG_NAME_LENGTH}자까지입니다`;
    if (seen.has(name)) return `같은 이름이 둘 있습니다 — ${name}`;
    seen.add(name);
  }

  const leaders = positions.filter((position) => position.role === AUTHORITY.LEADER);
  if (leaders.length > 1) return "Leader 권한은 한 직급만 가질 수 있습니다";

  return null;
}
