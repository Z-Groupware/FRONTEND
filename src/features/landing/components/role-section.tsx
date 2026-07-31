"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";

import { ROLES } from "../content";

/**
 * 역할마다 무엇이 다른지.
 *
 * ⚠️ 역할 이름은 **영어**로 쓴다(CLAUDE.md §카피: 역할 워딩은 영어).
 *    화면 안에서도 Owner·Admin·Leader·Member로 통일돼 있다.
 */
export function RoleSection() {
  const [selected, setSelected] = useState(0);
  const role = ROLES[selected] ?? ROLES[0];

  return (
    <section className="bg-secondary border-border border-b py-20 lg:py-28">
      <div className="mx-auto w-full max-w-[1144px] px-7">
        <h2 className="text-center text-[32px] leading-[40px] font-semibold tracking-[-0.7px] break-keep lg:text-[36px] lg:leading-[44px]">
          어느 자리에서도 Z는 이어져요
        </h2>

        <div
          role="tablist"
          aria-label="역할"
          className="flex flex-wrap justify-center gap-1.5 pt-10"
        >
          {ROLES.map((item, index) => (
            <button
              key={item.name}
              type="button"
              role="tab"
              aria-selected={index === selected}
              onClick={() => setSelected(index)}
              className={cn(
                "focus-visible:ring-ring h-9 rounded-full px-4 text-[13px] leading-5 transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
                index === selected
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {item.name}
            </button>
          ))}
        </div>

        {/* 문구 길이가 달라도 칸 높이가 흔들리지 않게 자리를 잡아둔다 */}
        <p className="text-muted-foreground mx-auto flex min-h-[52px] max-w-[520px] items-center justify-center pt-6 text-center text-[16px] leading-[26px] break-keep">
          {role.body}
        </p>
      </div>
    </section>
  );
}
