import {
  Check,
  ClipboardList,
  FolderKanban,
  LayoutDashboard,
  ListTodo,
  type LucideIcon,
  Minus,
  Settings,
  Video,
  X,
} from "lucide-react";
import { Fragment } from "react";

/** 그룹 제목 옆 아이콘 — 표가 길어 어디가 어느 묶음인지 눈으로 잡히게 한다 */
const GROUP_ICON: Record<string, LucideIcon> = {
  "화면 접근": LayoutDashboard,
  프로젝트: FolderKanban,
  회의: Video,
  액션: ListTodo,
  인수인계: ClipboardList,
  관리: Settings,
};

import { cn } from "@/lib/utils";

import { type Access, PERMISSION_GROUPS, ROLE_COLUMNS } from "../permissions";

/**
 * 역할 × 기능 표.
 *
 * ⚠️ 색으로 구분하지 않는다(§디자인 토큰) — ✓ / − / △ 모양과 명도로 읽힌다.
 * ⚠️ 좁은 화면에서는 표를 줄이지 않고 **가로로 스크롤**한다. 칸이 접히면 비교가 안 된다.
 * ⚠️ 세모(`partial`)에는 조건 각주가 붙는다. 조건 없이 세모만 두면 뭐가 다른지 알 수 없다.
 */
function AccessMark({ value }: { value: Access }) {
  if (value === "yes") {
    return (
      <span className="bg-foreground text-background inline-flex size-6 items-center justify-center rounded-full">
        <Check className="size-3.5" strokeWidth={3} aria-hidden />
        <span className="sr-only">가능</span>
      </span>
    );
  }

  if (value === "partial") {
    return (
      <span className="border-foreground text-foreground inline-flex size-6 items-center justify-center rounded-full border border-dashed">
        <Minus className="size-3.5" strokeWidth={3} aria-hidden />
        <span className="sr-only">조건부 가능</span>
      </span>
    );
  }

  return (
    <span className="bg-secondary text-muted-foreground inline-flex size-6 items-center justify-center rounded-full">
      <X className="size-3.5" strokeWidth={3} aria-hidden />
      <span className="sr-only">불가</span>
    </span>
  );
}

function GroupIcon({ title }: { title: string }) {
  const Icon = GROUP_ICON[title];
  if (!Icon) return null;
  return <Icon className="text-foreground/70 size-3.5 shrink-0" aria-hidden />;
}

export function PermissionTable() {
  const notes = PERMISSION_GROUPS.flatMap((group) =>
    group.rows.filter((row) => row.note).map((row) => ({ feature: row.feature, note: row.note })),
  );

  return (
    <>
      <div className="border-border bg-card overflow-x-auto rounded-xl border">
        <table className="w-full min-w-[560px] border-collapse">
          <thead>
            <tr className="border-border border-b">
              <th className="text-muted-foreground w-[38%] px-5 py-3.5 text-left text-[12px] leading-4 font-medium">
                기능
              </th>
              {ROLE_COLUMNS.map((role) => (
                <th key={role} className="px-3 py-3.5 text-center text-[13px] leading-5">
                  {role}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {PERMISSION_GROUPS.map((group) => (
              <Fragment key={group.title}>
                <tr className="bg-secondary/70">
                  <th
                    colSpan={5}
                    scope="colgroup"
                    className="text-muted-foreground px-5 py-2 text-left text-[11px] leading-4 font-medium tracking-[0.5px]"
                  >
                    <span className="flex items-center gap-1.5">
                      <GroupIcon title={group.title} />
                      {/* 한글 글자가 상자 안에서 위쪽에 앉아 아이콘보다 떠 보인다 — 1px 내려 맞춘다 */}
                      <span className="translate-y-px">{group.title}</span>
                    </span>
                  </th>
                </tr>

                {group.rows.map((row) => (
                  <tr
                    key={`${group.title}-${row.feature}`}
                    className="border-border/60 hover:bg-secondary/40 border-t transition-colors"
                  >
                    <th
                      scope="row"
                      className="px-5 py-3 text-left text-[13px] leading-5 font-normal break-keep"
                    >
                      {row.feature}
                      {row.note && <sup className="text-muted-foreground/70 pl-0.5">*</sup>}
                    </th>
                    {([row.owner, row.leader, row.member, row.admin] as const).map(
                      (value, index) => (
                        <td key={ROLE_COLUMNS[index]} className={cn("px-3 py-3 text-center")}>
                          <AccessMark value={value} />
                        </td>
                      ),
                    )}
                  </tr>
                ))}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* 세모가 무슨 뜻인지 밝힌다 — 표만 보고는 조건을 알 수 없다 */}
      {notes.length > 0 && (
        <ul className="flex flex-col gap-1.5 pt-4">
          {notes.map((item) => (
            <li
              key={item.feature}
              className="text-muted-foreground/80 text-[12px] leading-[19px] break-keep"
            >
              <span className="pr-1">*</span>
              <strong className="text-foreground font-normal">{item.feature}</strong> — {item.note}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
