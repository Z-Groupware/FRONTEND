/**
 * "2026-08-03" → "2026년 8월 3일".
 * ⚠️ 로케일 포맷터(`toLocaleDateString`)에 맡기지 않는다 — 서버·클라이언트 로케일이 갈리면
 *    하이드레이션에서 표기가 어긋날 수 있다(CLAUDE.md §렌더링). 직접 조립해 항상 같게 만든다.
 */
export function formatNoticeDate(iso: string): string {
  const [year, month, day] = iso.split("-");
  return `${Number(year)}년 ${Number(month)}월 ${Number(day)}일`;
}
