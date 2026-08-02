import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

import type { RoleName } from "./role-views";

/**
 * 역할마다 다른 홈 화면 축소판.
 *
 * ⚠️ 네 역할이 같은 틀을 공유하지 않는다 — Admin에게는 대시보드가 없다.
 *    Owner=현황·승인 / Admin=사원 관리 / Leader=팀 보드 / Member=내 업무.
 * ⚠️ 숫자·이름은 전부 목이다. 상태 점 색은 상태 토큰과 같은 회색·초록·보라다.
 */

export function RoleScreen({ name }: { name: RoleName }) {
  if (name === "Owner") return <OwnerScreen />;
  if (name === "Admin") return <AdminScreen />;
  if (name === "Leader") return <LeaderScreen />;
  return <MemberScreen />;
}

/** Owner — 조직 현황 수치와 승인 대기가 먼저 보인다 */
const OWNER_STATS = [
  { label: "이번 달 회의", value: "24건", color: "#3b82f6" },
  { label: "대기 승인", value: "2건", color: "#f59e0b" },
  { label: "팀 수", value: "6개", color: "#22c55e" },
] as const;

function OwnerScreen() {
  return (
    <>
      <div className="grid grid-cols-3 gap-2">
        {OWNER_STATS.map((stat, index) => (
          <div
            key={stat.label}
            style={{ animationDelay: `${index * 90}ms` }}
            className="border-border animate-in fade-in-0 slide-in-from-bottom-1 fill-mode-both rounded-lg border p-2.5 duration-500"
          >
            <p className="text-muted-foreground/70 text-[9px] leading-[13px]">{stat.label}</p>
            <p
              className="pt-0.5 text-[15px] leading-[22px] font-semibold tabular-nums"
              style={{ color: stat.color }}
            >
              {stat.value}
            </p>
          </div>
        ))}
      </div>
      <div className="bg-role-owner-surface text-role-owner animate-in fade-in-0 slide-in-from-bottom-1 fill-mode-both mt-2.5 rounded-lg p-3 duration-500 [animation-delay:280ms]">
        <p className="text-[10px] leading-[14px] font-semibold">승인 대기 인수인계</p>
        <p className="text-foreground/80 pt-0.5 text-[11px] leading-4">전임 → 후임 · 제품팀</p>
      </div>
    </>
  );
}

/** Admin — 대시보드가 아니라 **사원 계정 목록**이 홈이다 */
const EMPLOYEES = [
  { name: "제품팀 팀장", dept: "계정 발급 완료", state: "발급됨", isDone: true },
  { name: "제품팀 사원", dept: "계정 발급 완료", state: "발급됨", isDone: true },
  { name: "디자인팀 사원", dept: "초대 메일 발송됨", state: "대기", isDone: false },
] as const;

function AdminScreen() {
  return (
    <div className="border-border overflow-hidden rounded-lg border">
      {EMPLOYEES.map((employee, index) => (
        <div
          key={employee.name}
          style={{ animationDelay: `${index * 90}ms` }}
          className={cn(
            "animate-in fade-in-0 slide-in-from-bottom-1 fill-mode-both flex items-center gap-2 px-2.5 py-2 duration-500",
            index > 0 && "border-border/60 border-t",
          )}
        >
          <span className="bg-role-admin-surface text-role-admin flex size-5 shrink-0 items-center justify-center rounded-full text-[9px] leading-none">
            {employee.name.slice(0, 1)}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[11px] leading-4">{employee.name}</span>
            <span className="text-muted-foreground/70 block text-[9px] leading-[13px]">
              {employee.dept}
            </span>
          </span>
          <span
            className={cn(
              "shrink-0 rounded-full px-2 py-0.5 text-[9px] leading-[14px]",
              employee.isDone
                ? "bg-secondary text-muted-foreground"
                : "bg-role-admin-surface text-role-admin",
            )}
          >
            {employee.state}
          </span>
        </div>
      ))}
    </div>
  );
}

/** Leader — 팀 액션이 상태별로 나뉜 보드. 점 색은 상태 토큰(대기=회색·진행중=초록·완료=보라) */
const BOARD = [
  { label: "대기", count: "3", color: "#a8a29e" },
  { label: "진행중", count: "4", color: "#22c55e" },
  { label: "완료", count: "9", color: "#8b5cf6" },
] as const;

function LeaderScreen() {
  return (
    <>
      <div className="grid grid-cols-3 gap-2">
        {BOARD.map((column, index) => (
          <div
            key={column.label}
            style={{ animationDelay: `${index * 90}ms` }}
            className="border-border animate-in fade-in-0 slide-in-from-bottom-1 fill-mode-both rounded-lg border p-2.5 duration-500"
          >
            <p className="text-muted-foreground/70 flex items-center gap-1 text-[9px] leading-[13px]">
              <span
                className="size-[5px] rounded-full"
                style={{ backgroundColor: column.color }}
                aria-hidden
              />
              {column.label}
            </p>
            <p className="pt-0.5 text-[15px] leading-[22px] font-semibold tabular-nums">
              {column.count}
            </p>
          </div>
        ))}
      </div>
      <div className="bg-role-leader-surface text-role-leader animate-in fade-in-0 slide-in-from-bottom-1 fill-mode-both mt-2.5 rounded-lg p-3 duration-500 [animation-delay:280ms]">
        <p className="text-[10px] leading-[14px] font-semibold">재배정 필요</p>
        <p className="text-foreground/80 pt-0.5 text-[11px] leading-4">
          API 문서 최신화 · 담당자 휴직 예정
        </p>
      </div>
    </>
  );
}

/** Member — 오늘 내가 할 일 목록이 곧 홈이다 */
const MY_TASKS = [
  { what: "KPI 문서 업데이트", due: "8월 2일(토)", isDone: false },
  { what: "회의록 확인", due: "오늘", isDone: true },
  { what: "디자인 리뷰 참석", due: "8월 4일(월)", isDone: false },
] as const;

function MemberScreen() {
  return (
    <div className="border-border overflow-hidden rounded-lg border">
      {MY_TASKS.map((task, index) => (
        <div
          key={task.what}
          style={{ animationDelay: `${index * 90}ms` }}
          className={cn(
            "animate-in fade-in-0 slide-in-from-bottom-1 fill-mode-both flex items-center gap-2 px-2.5 py-2 duration-500",
            index > 0 && "border-border/60 border-t",
          )}
        >
          <span
            className={cn(
              "flex size-3.5 shrink-0 items-center justify-center rounded border",
              task.isDone
                ? "bg-foreground border-foreground text-background"
                : "border-border bg-background",
            )}
            aria-hidden
          >
            {task.isDone && <Check className="size-2.5" strokeWidth={3} />}
          </span>
          <span
            className={cn(
              "min-w-0 flex-1 truncate text-[11px] leading-4",
              task.isDone && "text-muted-foreground/80 line-through",
            )}
          >
            {task.what}
          </span>
          <span className="text-muted-foreground/70 shrink-0 text-[9px] leading-[13px]">
            {task.due}
          </span>
        </div>
      ))}
    </div>
  );
}
