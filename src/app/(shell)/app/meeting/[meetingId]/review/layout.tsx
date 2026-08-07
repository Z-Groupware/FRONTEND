import { Sparkles } from "lucide-react";
import type { ReactNode } from "react";

import { PageHeader } from "@/features/shell/components/page-header";

/**
 * ⚠️ `backTo`를 아직 안 둔다 — `/app/meeting`(목록·상세)는 다른 이슈(#216/PR #218)가
 *    만드는 중이라 이 브랜치엔 없다. 그 라우트가 develop에 들어오면 회의 상세로 잇는다.
 */
export default function MeetingReviewLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <PageHeader title="AI 액션 분배 결과" icon={Sparkles} />
      {children}
    </>
  );
}
