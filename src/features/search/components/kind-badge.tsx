import { Badge } from "@/components/ui/badge";

import type { SearchKind } from "../types";
import { SEARCH_KIND_LABEL } from "../types";

/**
 * 결과 종류 표식 — **무채색뿐이다**(DESIGN §5). 색으로 종류를 가르지 않는다,
 * 이미 정해진 색 자리(상태점·프로젝트 태그·에러)와 겹치면 뜻이 두 개가 된다.
 */
export function KindBadge({ kind }: { kind: SearchKind }) {
  return (
    <Badge variant="outline" className="w-11 shrink-0 justify-center font-normal">
      {SEARCH_KIND_LABEL[kind]}
    </Badge>
  );
}
