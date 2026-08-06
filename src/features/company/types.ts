import type { PickedPlace } from "@/features/auth/register-draft";
import type { DepartmentNode, Position } from "@/features/onboarding/types";

/**
 * 기업 설정 — **UI 계약**.
 *
 * ⚠️ 조직 트리·직급 타입은 **온보딩 것을 그대로 쓴다**(다시 정의하지 않는다).
 *    같은 것을 두 벌로 두면 온보딩에서 되는 조작이 여기서 조용히 안 되게 된다.
 *    편집 조각(`useDepartmentTree`·`usePositionList`·행 컴포넌트)도 같은 이유로 재사용한다.
 * ⚠️ ERD·API 미확정이라 아래는 **가정한 shape**이다(§연동 검증). 확정되면 매퍼만 고친다.
 */
export type { DepartmentNode, PickedPlace, Position };

/**
 * 회사 기본 정보.
 *
 * ⚠️ **기업 등록 신청에서 받는 것만 둔다** — 기업명·사업자등록번호·회사 위치 셋이다.
 *    대표자·대표 연락처는 신청에서도 온보딩에서도 받지 않는다. 없는 값을 칸으로 두면
 *    빈 채로 남거나 여기서 처음 적게 되는데, 그러면 이 화면이 **정본이 아닌 값의 유일한
 *    출처**가 된다(세금계산서에 그대로 나가는 값이라 특히 위험하다).
 *    신청 폼의 나머지 셋(담당자 이름·이메일·연락처)은 회사가 아니라 **첫 OWNER 계정**의
 *    정보라 여기가 아니라 마이페이지·사원 관리에 산다.
 */
export interface CompanyProfile {
  /** 사업자등록증에 적힌 이름 — 신청 폼의 `companyName`과 같은 값이다 */
  name: string;
  /** `000-00-00000` 꼴. 숫자 10자리 */
  businessNumber: string;
  /**
   * 회사 위치 — 지도에서 고른 곳.
   * ⚠️ 지도를 못 쓰는 환경에서는 주소만 적히고 좌표가 `0`으로 남는다(신청 화면과 같은 규칙).
   */
  place: PickedPlace | null;
  /**
   * 기업 코드 — **읽기 전용**이다.
   * ⚠️ 승인될 때 발급되고 사원이 로그인할 때 적는 값이라, 바뀌면 기존 사원이 전부 못 들어온다.
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

/** 폼이 보내는 값 — 기업 코드는 못 고치므로 빠진다 */
export type CompanyProfileDraft = Omit<CompanyProfile, "code">;

/** 기본 정보 칸별 오류 — 칸 밑에 인라인으로 붙는다(§토스트: 폼 검증 오류는 인라인) */
export type CompanyProfileErrors = Partial<Record<keyof CompanyProfileDraft, string>>;

/** 변경 작업의 공통 결과 — 실패를 던지지 않고 값으로 돌려준다(화면이 문구를 고른다) */
export interface CompanyActionResult {
  isSuccess: boolean;
  /** 실패 사유 한 줄. 성공이면 없다 */
  message?: string;
}
