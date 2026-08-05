"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { formatGb } from "@/features/billing/pricing";

import { canDeleteRecordings } from "../storage";
import type { ProjectStorage } from "../types";

interface ProjectStorageTableProps {
  projects: readonly ProjectStorage[];
  /** 지울 수 있는 사람인지 — 대표이거나 Admin을 겸한 사람 */
  canManage: boolean;
  onDelete: (project: ProjectStorage) => void;
}

/**
 * 프로젝트별 녹음 용량.
 *
 * ⚠️ **표다.** 같은 종류의 값이 줄마다 반복되고 열끼리 비교하며 읽으므로 카드가 아니라 표가 맞다.
 *    좁아지면 가로로 스크롤한다(§레이아웃: 표는 `overflow-x-auto`로 감싼다).
 * ⚠️ 음성과 자막·요약을 **열로 나눈다.** 지울 수 있는 건 음성뿐이라, 합쳐 두면 지우면 얼마가
 *    비는지 알 수 없다.
 * ⚠️ **끝난 프로젝트만** 지울 수 있다. 진행 중인 회의 녹음은 아직 다시 들을 일이 남아 있다 —
 *    판정은 `canDeleteRecordings` 한 곳이 하고, 서버 액션이 같은 함수로 다시 본다.
 * ⚠️ 지금은 **전량을 한 번에** 그린다. BE가 페이지 단위로 주기 시작하면 스크롤로 이어 붙인다
 *    (§목록·페이지네이션) — 그때 이 컴포넌트가 목록을 받는 방식만 바뀐다.
 */
export function ProjectStorageTable({ projects, canManage, onDelete }: ProjectStorageTableProps) {
  return (
    <section className="border-border bg-card rounded-2xl border">
      <div className="flex items-baseline justify-between gap-3 px-7 py-6">
        <h2 className="flex items-center gap-2 text-[15px] leading-6 font-semibold tracking-[-0.2px]">
          <span className="bg-foreground size-2 rounded-full" aria-hidden />
          프로젝트별 녹음 용량
        </h2>
        {/* ⚠️ 전체 건수를 적는다 — 끝이 안 보이는 목록은 얼마나 남았는지 알 수 없다 */}
        <p className="text-muted-foreground/70 shrink-0 text-[12px] leading-4 tabular-nums">
          전체 {projects.length}개
        </p>
      </div>

      {projects.length === 0 ? (
        /* ⚠️ 빈 상태 — 무엇이 없는지 적는다(§3상태) */
        <p className="text-muted-foreground border-border border-t px-6 py-12 text-center text-[13px] leading-5 break-keep">
          아직 녹음이 남은 프로젝트가 없습니다
        </p>
      ) : (
        <div className="border-border overflow-x-auto border-t">
          <table className="w-full min-w-[720px] text-[13px]">
            <thead>
              <tr className="text-muted-foreground border-border border-b text-[12px] leading-4">
                <th className="px-6 py-3 text-left font-normal">프로젝트</th>
                {/*
                  ⚠️ **`회의`가 아니라 `녹음 회의`** 다. 지우고 나면 이 값이 0이 되는데,
                     `회의`라고만 적으면 회의 자체가 사라진 것으로 읽힌다 — 사라진 건 녹음뿐이다.
                */}
                <th className="px-6 py-3 text-right font-normal">녹음 회의</th>
                <th className="px-6 py-3 text-right font-normal">음성</th>
                <th className="px-6 py-3 text-right font-normal">자막·요약</th>
                <th className="px-6 py-3 text-right font-normal">가장 오래된 녹음</th>
                <th className="px-6 py-3 text-right font-normal">
                  <span className="sr-only">녹음 지우기</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {projects.map((project) => (
                <Row
                  key={project.tag}
                  project={project}
                  canManage={canManage}
                  onDelete={onDelete}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function Row({
  project,
  canManage,
  onDelete,
}: {
  project: ProjectStorage;
  canManage: boolean;
  onDelete: (project: ProjectStorage) => void;
}) {
  const isDeletable = canDeleteRecordings(project);

  return (
    <tr className="border-border hover:bg-secondary/40 transition-colors not-first:border-t">
      <td className="px-6 py-4">
        {/*
          ⚠️ 이름은 **프로젝트로 가는 링크**다. 지울지 판단하려면 무슨 프로젝트였는지 봐야 하는데,
             이름만 있으면 검색으로 다시 찾아 들어가야 한다.
        */}
        <Link
          href={`/app/projects/${project.tag}`}
          className="focus-visible:ring-ring rounded hover:underline focus-visible:ring-2 focus-visible:outline-hidden"
        >
          {project.name}
        </Link>
        {/* ⚠️ 상태는 **글자로** 적는다 — 색만으로 알리면 색을 못 보는 사람에게 사라진다 */}
        <span className="text-muted-foreground/70 block pt-0.5 text-[11px] leading-4">
          {project.isDone ? "완료" : "진행중"}
        </span>
      </td>
      <td className="text-muted-foreground px-6 py-4 text-right tabular-nums">
        {project.meetingCount}개
      </td>
      <td className="px-6 py-4 text-right tabular-nums">{formatGb(project.voiceGb)}</td>
      <td className="text-muted-foreground px-6 py-4 text-right tabular-nums">
        {formatGb(project.sttGb)}
      </td>
      <td className="text-muted-foreground px-6 py-4 text-right tabular-nums">
        {project.oldestRecordedAt}
      </td>
      <td className="px-6 py-4 text-right">
        {/*
          ⚠️ 지울 수 없는 줄에는 **버튼을 두지 않는다.** 흐린 버튼을 남기면 왜 못 누르는지
             설명할 자리가 필요해지는데, 그 이유(진행 중이다)는 이미 왼쪽에 적혀 있다.
        */}
        {canManage && isDeletable && (
          <Button
            type="button"
            variant="outline"
            onClick={() => onDelete(project)}
            aria-label={`${project.name} 녹음 지우기`}
            className="h-8 shrink-0 px-3 text-[12px] leading-none"
          >
            <span className="translate-y-px">녹음 지우기</span>
          </Button>
        )}
      </td>
    </tr>
  );
}
