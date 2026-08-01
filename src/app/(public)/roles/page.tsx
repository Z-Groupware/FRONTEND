import { Check, X } from "lucide-react";
import type { Metadata } from "next";

import { DocPage } from "@/features/landing/components/doc-page";
import { ROLE_ACCESS } from "@/features/landing/roles";

export const metadata: Metadata = {
  title: "역할별 권한 — Z",
  description: "Owner · Admin · Leader · Member가 각각 무엇에 닿을 수 있는지 정리했어요.",
};

/**
 * 역할별로 무엇에 닿는지 한 장으로 정리한 화면.
 *
 * ⚠️ 처음 보는 사람이 "나는 뭘 할 수 있나"를 바로 알 수 있어야 한다 —
 *    할 수 있는 것만 나열하면 오해가 생기므로 **못 하는 것도 같이** 적는다.
 */
export default function RolesPage() {
  return (
    <DocPage
      title="역할별 권한"
      description="Z는 역할에 따라 보이는 화면이 다릅니다. 계정을 받으면 어떤 일을 할 수 있는지 미리 확인하세요."
    >
      <div className="flex flex-col gap-4">
        {ROLE_ACCESS.map((role) => (
          <section key={role.name} className="border-border bg-card rounded-xl border p-6">
            <div className="flex flex-wrap items-baseline gap-2">
              <h2 className="text-[18px] leading-7 font-semibold">{role.name}</h2>
              <span className="text-muted-foreground text-[13px] leading-5">{role.korean}</span>
            </div>
            <p className="text-muted-foreground pt-1 text-[14px] leading-[22px] break-keep">
              {role.summary}
            </p>

            <ul className="flex flex-col gap-2 pt-5">
              {role.can.map((item) => (
                <li key={item} className="flex items-start gap-2 text-[13px] leading-5">
                  <Check
                    className="text-foreground mt-0.5 size-3.5 shrink-0"
                    strokeWidth={2.5}
                    aria-hidden
                  />
                  <span className="break-keep">{item}</span>
                </li>
              ))}
            </ul>

            {/* 못 하는 것도 적는다 — 할 수 있는 것만 나열하면 나머지도 되는 줄 안다 */}
            {role.cannot && (
              <ul className="border-border mt-5 flex flex-col gap-2 border-t pt-5">
                {role.cannot.map((item) => (
                  <li
                    key={item}
                    className="text-muted-foreground/70 flex items-start gap-2 text-[13px] leading-5"
                  >
                    <X className="mt-0.5 size-3.5 shrink-0" strokeWidth={2.5} aria-hidden />
                    <span className="break-keep">{item}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>

      {/* ⚠️ 화면 접근과 실제 권한은 다르다 — 숨김은 보안이 아니다(§권한) */}
      <p className="text-muted-foreground/70 pt-8 text-[12px] leading-[20px] break-keep">
        위 내용은 화면 접근 기준입니다. 실제 권한은 요청할 때마다 서버가 다시 확인합니다.
      </p>
    </DocPage>
  );
}
