"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { ZLogo } from "@/components/icons/z-logo";
import { cn } from "@/lib/utils";

import { RoleScreen } from "./role-screens";
import { ROLE_VIEWS } from "./role-views";

/**
 * 역할마다 무엇이 다른지 — 왼쪽에서 역할을 고르면 오른쪽 **화면 자체가** 바뀐다.
 *
 * ⚠️ 네 역할이 같은 대시보드 틀을 공유하지 않는다. Admin에게는 대시보드가 없다 —
 *    역할마다 **가장 중요한 화면 하나**를 실제 셸(사이드바 + 본문) 축소판으로 보여준다.
 *    Owner=현황·승인 / Admin=사원 관리 / Leader=팀 액션 보드 / Member=내 업무.
 * ⚠️ 숫자·이름은 전부 목이다. 역할 색은 역할 배지 토큰(`--role-*`)을 그대로 쓴다 —
 *    랜딩은 `.landing-night`가 그 토큰을 검정 무대용으로 뒤집어 둔다.
 * ⚠️ 고른 탭의 글자는 `text-background`다 — 검정 무대에선 먹색, 밝은 바탕에선 흰색으로 뒤집힌다.
 *    역할색도 밝기에 따라 값이 바뀌므로 한쪽에 맞춰 생 hex를 박으면 반대쪽에서 안 읽힌다.
 * ⚠️ 역할 이름은 영어(CLAUDE.md §카피). 상태 점 색은 상태 토큰과 같은 회색·초록·보라다.
 */

export function RoleSection() {
  const [selected, setSelected] = useState(0);
  const role = ROLE_VIEWS[selected] ?? ROLE_VIEWS[0];

  return (
    <section className="py-20 lg:py-28">
      <div className="mx-auto w-full max-w-[1144px] px-7">
        {/* 다른 섹션과 같은 헤더 문법 — eyebrow + 중앙 제목 */}
        <div className="flex flex-col items-center gap-2.5 text-center">
          <p className="text-landing-accent text-[11px] leading-4 font-semibold tracking-[1.1px] uppercase">
            Roles
          </p>
          <h2 className="text-[32px] leading-[40px] font-semibold tracking-[-0.7px] break-keep lg:text-[36px] lg:leading-[44px]">
            어느 자리에서도 Z는 이어져요
          </h2>
        </div>

        <div className="grid items-center gap-12 pt-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-16">
          <div className="reveal-on-scroll">
            <div role="tablist" aria-label="역할" className="flex flex-wrap gap-1.5">
              {ROLE_VIEWS.map((item, index) => (
                <button
                  key={item.name}
                  type="button"
                  role="tab"
                  aria-selected={index === selected}
                  id={`role-tab-${item.name}`}
                  aria-controls="role-preview-panel"
                  onClick={() => setSelected(index)}
                  className={cn(
                    "focus-visible:ring-ring h-9 rounded-full px-4 text-[13px] leading-5 transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-hidden",
                    index === selected
                      ? item.activeTab
                      : "border-border text-muted-foreground hover:text-foreground bg-card border",
                  )}
                >
                  {item.name}
                </button>
              ))}
            </div>

            {/* 문구 길이가 달라도 아래가 흔들리지 않게 자리를 잡아둔다 */}
            <p className="text-muted-foreground flex min-h-[52px] max-w-[400px] items-center pt-5 text-[16px] leading-[26px] break-keep">
              {role.body}
            </p>

            <Link
              href="/roles"
              className="text-landing-accent flex w-fit items-center gap-1 pt-1 text-[14px] leading-5 hover:underline"
            >
              권한 매트릭스 전체 보기
              <ArrowRight className="size-3.5" aria-hidden />
            </Link>
          </div>

          {/* 역할을 바꾸면 화면 통째로 갈아끼워진다 — 실제 셸(사이드바+본문) 축소판 */}
          {/* 탭과 패널을 id로 잇는다 — 없으면 스크린 리더가 탭 선택과 화면 변경을 연결하지 못한다 */}
          <div
            className="tilt-scene reveal-on-scroll"
            role="tabpanel"
            id="role-preview-panel"
            aria-labelledby={`role-tab-${role.name}`}
          >
            <div
              key={role.name}
              className="border-border bg-popover animate-in fade-in-0 slide-in-from-bottom-2 tilt-left overflow-hidden rounded-2xl border shadow-lg duration-300"
            >
              <div className="flex min-h-[280px]">
                {/* 미니 사이드바 — 역할마다 메뉴가 다르다(실제 셸과 같은 문법) */}
                <div className="border-border bg-secondary/60 hidden w-[104px] shrink-0 flex-col gap-1 border-r p-2.5 sm:flex">
                  <span className="flex items-center px-1.5 pb-2">
                    <ZLogo className="text-foreground size-3" />
                  </span>
                  {role.nav.map((item, index) => (
                    <span
                      key={item}
                      className={cn(
                        "rounded px-2 py-1 text-[10px] leading-4 whitespace-nowrap",
                        index === 0 ? "bg-foreground text-background" : "text-muted-foreground",
                      )}
                    >
                      {item}
                    </span>
                  ))}
                  <span
                    className={cn(
                      "mt-auto self-start rounded-full px-2 py-0.5 text-[9px] leading-[14px]",
                      role.chip,
                    )}
                  >
                    {role.name}
                  </span>
                </div>

                <div className="min-w-0 flex-1 p-4">
                  <p className="pb-3 text-[13px] leading-5 font-semibold">{role.screen}</p>
                  <RoleScreen name={role.name} />
                  <p className="text-muted-foreground pt-3 text-[10px] leading-4">
                    화면 구성 예시 — 숫자는 실제 데이터가 아니에요
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
