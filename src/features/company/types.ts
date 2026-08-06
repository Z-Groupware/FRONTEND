import type { DepartmentNode, Position } from "@/features/onboarding/types";

/**
 * 기업 설정 — **UI 계약**.
 *
 * ⚠️ 조직 트리·직급 타입은 **온보딩 것을 그대로 쓴다**(다시 정의하지 않는다).
 *    같은 것을 두 벌로 두면 온보딩에서 되는 조작이 여기서 조용히 안 되게 된다.
 *    편집 조각(`useDepartmentTree`·`usePositionList`·행 컴포넌트)도 같은 이유로 재사용한다.
 * ⚠️ ERD·API 미확정이라 아래는 **가정한 shape**이다(§연동 검증). 확정되면 매퍼만 고친다.
 */
export type { DepartmentNode, Position };

/** 회사 기본 정보 — 대표가 고치는 값들. */
export interface CompanyProfile {
  name: string;
  /** `000-00-00000` 꼴. 숫자 10자리 */
  businessNumber: string;
  ceoName: string;
  address: string;
  phone: string;
  /**
   * 기업 코드 — **읽기 전용**이다.
   * ⚠️ 사원이 로그인할 때 적는 값이라 바뀌면 기존 사원이 전부 못 들어온다.
   *    URL에는 안 붙는다(§라우트 그룹: 기업 식별은 세션 쿠키).
   */
  code: string;
}

/** 화면이 한 번에 받는 값 — 기본 정보 + 조직 체계. */
export interface CompanySetting {
  profile: CompanyProfile;
  departments: DepartmentNode[];
  positions: Position[];
}

/** 기본 정보 칸별 오류 — 칸 밑에 인라인으로 붙는다(§토스트: 폼 검증 오류는 인라인) */
export type CompanyProfileErrors = Partial<Record<keyof CompanyProfileDraft, string>>;

/** 폼이 보내는 값 — 기업 코드는 못 고치므로 빠진다 */
export type CompanyProfileDraft = Omit<CompanyProfile, "code">;

/** 변경 작업의 공통 결과 — 실패를 던지지 않고 값으로 돌려준다(화면이 문구를 고른다) */
export interface CompanyActionResult {
  isSuccess: boolean;
  /** 실패 사유 한 줄. 성공이면 없다 */
  message?: string;
}
