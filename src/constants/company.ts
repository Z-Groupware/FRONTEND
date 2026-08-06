/**
 * 기업 설정 화면의 말.
 *
 * ⚠️ 화면에 적는 말은 **여기 한 곳**에만 둔다(§도메인 상수: 라벨 하드코딩 금지).
 *    카드 제목과 칸 이름이 컴포넌트에 흩어지면 같은 것을 두 이름으로 부르게 된다.
 */

export const COMPANY_SECTION_TITLE = {
  PROFILE: "기본 정보",
  TEAM: "팀 체계",
  POSITION: "직급·권한",
} as const;

export const COMPANY_FIELD_LABEL = {
  NAME: "회사명",
  BUSINESS_NUMBER: "사업자등록번호",
  CEO_NAME: "대표자",
  ADDRESS: "주소",
  PHONE: "대표 연락처",
  CODE: "기업 코드",
} as const;

/**
 * 기업 코드 옆에 붙는 한 줄.
 * ⚠️ **고칠 수 없는 값**이라는 걸 적어 둔다 — 사원이 로그인할 때 적는 값이라
 *    바꿀 수 있는 것처럼 보이면 바꾸려다 못 바꾸고 문의가 온다.
 */
export const COMPANY_CODE_HINT = "사원이 로그인할 때 적는 값입니다. 바꿀 수 없습니다.";
