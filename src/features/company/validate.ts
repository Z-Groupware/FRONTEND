import { AUTHORITY } from "@/constants/domain";
import { MAX_DEPARTMENT_DEPTH, MAX_ORG_NAME_LENGTH } from "@/features/onboarding/types";

import type { CompanyProfileDraft, CompanyProfileErrors, DepartmentNode, Position } from "./types";

/**
 * 기업 설정 검증 — **화면과 서버가 같은 함수를 쓴다.**
 * 규칙이 두 벌이면 화면은 통과시키고 서버는 막는 일이 생긴다.
 */

/** `000-00-00000` — 국세청 사업자등록번호 꼴. 하이픈은 넣어 적게 한다(눈으로 세기 어렵다) */
const BUSINESS_NUMBER = /^\d{3}-\d{2}-\d{5}$/;

/** 숫자와 하이픈만. 대표번호(`1588-0000`)도 지역번호도 들어오므로 자릿수는 안 본다 */
const PHONE = /^[\d-]{7,20}$/;

export function validateCompanyProfile(draft: CompanyProfileDraft): CompanyProfileErrors {
  const errors: CompanyProfileErrors = {};

  if (!draft.name.trim()) errors.name = "회사명을 입력해 주세요";
  if (!draft.ceoName.trim()) errors.ceoName = "대표자 이름을 입력해 주세요";
  if (!draft.address.trim()) errors.address = "주소를 입력해 주세요";

  if (!BUSINESS_NUMBER.test(draft.businessNumber.trim())) {
    errors.businessNumber = "000-00-00000 꼴로 입력해 주세요";
  }
  if (!PHONE.test(draft.phone.trim())) {
    errors.phone = "숫자와 하이픈(-)만 입력해 주세요";
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
      error = `팀 아래 단계는 ${MAX_DEPARTMENT_DEPTH}단까지입니다`;
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
