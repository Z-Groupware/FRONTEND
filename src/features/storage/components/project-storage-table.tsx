"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { formatGb } from "@/features/billing/pricing";

import { canDeleteRecordings } from "../storage";
import type { ProjectStorage } from "../types";

interface ProjectStorageTableProps {
  projects: readonly ProjectStorage[];
  /** 전체 음성(GB) — 각 줄의 비중 막대를 그리는 기준 */
  totalVoiceGb: number;
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
export function ProjectStorageTable({
  projects,
  totalVoiceGb,
  canManage,
  onDelete,
}: ProjectStorageTableProps) {
  return (
    <section className="border-border bg-card rounded-2xl border">
      <div className="flex items-baseline justify-between gap-3 px-7 py-6">
        <h2 className="flex items-center gap-2 text-[17px] leading-7 font-semibold tracking-[-0.3px]">
          <span className="bg-foreground size-2 rounded-full" aria-hidden />
          프로젝트별 녹음 용량
        </h2>
        {/* ⚠️ 전체 건수를 적는다 — 끝이 안 보이는 목록은 얼마나 남았는지 알 수 없다 */}
        <p className="text-muted-foreground/70 shrink-0 text-[12px] leading-4 tabular-nums">
          전체 {projects.length}개
        </p>
      </div>

      {/*
        ⚠️ **무엇이 사라지는지 지우는 자리에서 말한다.** 따로 떨어진 안내 상자로 두면 표를 볼 때는
           이미 화면 밖이라, 정작 버튼을 누르는 순간에는 안 읽힌다.
        ⚠️ 이 한 줄이 없으면 요약·액션까지 사라지는 줄 알고 아무도 손을 못 댄다 — 반대로 다 남는
           줄 알고 지웠다가 다시듣기가 안 되는 것도 마찬가지로 나쁘다(§정직성).
      */}
      <p className="text-muted-foreground border-border border-t px-7 py-3.5 text-[12px] leading-[18px] break-keep">
        녹음을 지우면 <span className="text-foreground font-medium">음성 파일만</span> 사라집니다.
        자막·요약과 액션은 그대로 남고, 다시 들을 수 없게 될 뿐입니다.
      </p>

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
                  ⚠️ 상태는 **자기 열**이다. 이름 옆에 붙여 두면 이름 길이에 따라 좌우로 밀려서
                     세로로 훑을 수가 없다 — 지울 수 있는 줄을 고르는 게 이 표의 일이라
                     상태가 한 줄로 서 있어야 한다.
                */}
                <th className="px-6 py-3 text-left font-normal">상태</th>
                {/*
                  ⚠️ **`회의`가 아니라 `녹음 회의`** 다. 지우고 나면 이 값이 0이 되는데,
                     `회의`라고만 적으면 회의 자체가 사라진 것으로 읽힌다 — 사라진 건 녹음뿐이다.
                */}
                <th className="px-6 py-3 text-right font-normal">녹음 회의</th>
                {/*
                  ⚠️ 음성 열에만 **비중 막대**를 붙인다. 어느 프로젝트가 자리를 많이 먹는지가
                     이 표를 보는 이유인데, 숫자만 늘어놓으면 다섯 줄을 다 읽고 비교해야 한다.
                     자막·요약은 지울 수 없어 비교할 이유가 없으므로 숫자만 둔다.
                */}
                <th className="px-6 py-3 text-left font-normal">음성</th>
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
                  totalVoiceGb={totalVoiceGb}
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
  totalVoiceGb,
  canManage,
  onDelete,
}: {
  project: ProjectStorage;
  totalVoiceGb: number;
  canManage: boolean;
  onDelete: (project: ProjectStorage) => void;
}) {
  const isDeletable = canDeleteRecordings(project);
  // ⚠️ 0으로 나누면 `NaN%`가 되어 막대가 아예 안 그려진다
  const share = totalVoiceGb > 0 ? (project.voiceGb / totalVoiceGb) * 100 : 0;

  return (
    <tr className="border-border hover:bg-secondary/40 transition-colors not-first:border-t">
      <td className="px-6 py-3.5">
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
      </td>
      <td className="px-6 py-3.5">
        {/*
          ⚠️ 상태점은 **정해진 색**을 쓴다 — 진행중=초록, 완료=보라(§디자인 토큰 상태점).
             이 화면에서 유일하게 색이 들어가는 자리라, 다른 뜻으로 쓰면 규칙이 무너진다.
          ⚠️ **글자를 같이 적는다.** 색만으로 알리면 색을 못 보는 사람에게 통째로 사라진다.
        */}
        <span className="flex items-center gap-1.5">
          <span
            className={
              project.isDone
                ? "bg-status-done size-1.5 shrink-0 rounded-full"
                : "bg-status-progress size-1.5 shrink-0 rounded-full"
            }
            aria-hidden
          />
          <span className="translate-y-px text-[12px] leading-4">
            {project.isDone ? "완료" : "진행중"}
          </span>
        </span>
      </td>
      <td className="text-muted-foreground px-6 py-3.5 text-right tabular-nums">
        {project.meetingCount}개
      </td>
      <td className="px-6 py-3.5">
        {/*
          ⚠️ 막대는 **전체 음성 대비 비중**이다. 포함량(50GB) 기준으로 그리면 한 프로젝트가
             차지하는 조각이 너무 작아 다섯 줄이 전부 비슷해 보인다.
          ⚠️ 숫자를 막대 오른쪽에 **붙여** 둔다. 열을 따로 나누면 눈이 두 번 움직인다.
        */}
        <span className="flex items-center gap-2.5">
          <span
            className="bg-secondary h-1.5 w-20 shrink-0 overflow-hidden rounded-full"
            aria-hidden
          >
            <span
              className="bg-foreground/70 block h-full rounded-full"
              style={{ width: `${share}%` }}
            />
          </span>
          <span className="tabular-nums">{formatGb(project.voiceGb)}</span>
        </span>
      </td>
      <td className="text-muted-foreground px-6 py-3.5 text-right tabular-nums">
        {formatGb(project.sttGb)}
      </td>
      <td className="text-muted-foreground px-6 py-3.5 text-right tabular-nums">
        {project.oldestRecordedAt}
      </td>
      <td className="px-6 py-3.5 text-right">
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
