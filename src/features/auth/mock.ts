/**
 * 로그인 전 화면이 쓰는 목.
 *
 * ⚠️ **목이다.** 기업 코드 확인·로그인·등록 신청 API가 아직 없다(BE 협의 전).
 *    실제로는 서버가 판정한다 — 화면이 통과시켜도 서버가 다시 본다(§권한).
 *    연동되면 이 파일을 지우고 `server.ts`/`actions.ts`의 `isMock` 분기만 고친다(§격리막).
 */
export interface Company {
  code: string;
  name: string;
}

/*
 * ⚠️ 코드 모양은 **발급받는 값**처럼 보여야 한다. 회사 이름+연도(`TECHSTART-2025`)로 두면
 *    사람이 직접 지어 넣는 값으로 오해한다 — 실제로는 등록 승인 후 메일로 받는다.
 */
const COMPANIES: readonly Company[] = [
  { code: "NOVA-7K3D", name: "노바랩스" },
  { code: "Z-DEMO", name: "Z 데모" },
];

/** 코드로 회사를 찾는다. 대소문자·앞뒤 공백은 무시한다 — 메일에서 복사하면 공백이 붙는다 */
export function findCompany(code: string): Company | null {
  const normalized = code.trim().toUpperCase();
  return COMPANIES.find((company) => company.code === normalized) ?? null;
}
