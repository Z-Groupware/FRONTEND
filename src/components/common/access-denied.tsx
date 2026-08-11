import { Lock } from "lucide-react";
import Link from "next/link";

import { EmptyState } from "@/components/common/empty-state";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AccessDeniedProps {
  /** 돌아갈 곳 — 권한마다 집이 다르다(`roleHome`). */
  homeHref: string;
  /** 무엇을 못 여는지. 화면 이름을 그대로 넣지 않는다 — "이 화면"으로 충분하다. */
  title?: string;
  description?: string;
}

/**
 * 403 — **권한이 없어 못 여는 화면.**
 *
 * ⚠️ **`notFound()`로 때우지 않는다**(2026-08-11). 권한이 없는 화면에 `찾으시는 화면이 없습니다`를
 *    띄우면 화면이 거짓말을 한다(§정직성) — 주소는 맞는데 자격이 없는 것이라, 그 둘은 다음에
 *    할 일이 다르다. 없는 주소는 고쳐 봐야 소용없고, 권한은 **요청하면 열린다.**
 * ⚠️ **셸 안에 남는다.** 화면 전체를 덮으면 사이드바가 사라져 나갈 길이 뒤로가기뿐이다 —
 *    막다른 길에 갈 곳을 준다(404 화면과 같은 판단).
 * ⚠️ **없는 리소스는 여전히 `notFound()`다.** 남의 회사 문서 id를 찍어 봤을 때까지 "권한이
 *    없습니다"라고 답하면, 그 id가 **있다는 사실**을 알려 주는 셈이다.
 */
export function AccessDenied({ homeHref, title, description }: AccessDeniedProps) {
  return (
    <main className="min-h-0 flex-1 overflow-y-auto px-8 py-7">
      <div className="mx-auto w-full max-w-[1440px]">
        <section className="border-border bg-card rounded-2xl border">
          <EmptyState
            className="py-20"
            icon={Lock}
            title={title ?? "이 화면을 열 권한이 없습니다."}
            description={description ?? "필요한 권한은 대표나 관리자에게 요청해 주세요."}
            action={
              <Link
                href={homeHref}
                className={cn(buttonVariants({ variant: "outline" }), "mt-1 h-9 px-4 text-[13px]")}
              >
                내 대시보드로 가기
              </Link>
            }
          />
        </section>
      </div>
    </main>
  );
}
