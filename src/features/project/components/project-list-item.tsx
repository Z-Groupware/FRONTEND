import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { getProgressPercent, splitDepartments } from "@/features/project/lib";
import type { ProjectListItem as ProjectListItemModel } from "@/features/project/types";
import { formatMonthDayWeekday } from "@/lib/date";

/** 프로젝트는 전부 Owner가 개설한다 — 최상위 표시(라벨 통일 규칙). 필드가 아니라 상수. */
const OWNER_LABEL = "Owner";

/**
 * 프로젝트 한 줄 — 회의 아이템과 같은 결.
 * 좌: 태그 · 프로젝트명 + Owner 라벨 / 우: 진척 바 · 마감일 · 참여 팀(2개+`+N`, hover 시 전체).
 */
export function ProjectListItem({ project }: { project: ProjectListItemModel }) {
  const percent = getProgressPercent(project.actionDone, project.actionTotal);
  const { visible, overflow } = splitDepartments(project.departments);
  const due = formatMonthDayWeekday(project.dueDate);

  const visibleTeamBadges = visible.map((team) => (
    <Badge key={team} variant="outline" className="shrink-0">
      {team}
    </Badge>
  ));

  return (
    <li className="relative">
      {/* 태그색 스트립 — 행 왼쪽 끝 */}
      <span
        className="absolute inset-y-0 left-0 w-1"
        style={{ backgroundColor: project.color }}
        aria-hidden
      />

      <Link
        href={`/app/projects/${project.tag}`}
        className="hover:bg-muted flex items-center gap-3 py-3.5 pr-4 pl-5 transition-colors"
      >
        {/* 좌: (상단) 태그 / (하단) 프로젝트명 + Owner 라벨 */}
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <span
            className="w-fit rounded px-1.5 py-0.5 font-mono text-[10px] font-semibold"
            style={{ backgroundColor: `${project.color}1a`, color: project.color }}
          >
            {project.tag}
          </span>
          <div className="flex min-w-0 items-center gap-2">
            <span className="truncate text-[15px]">{project.name}</span>
            <Badge variant="secondary" className="shrink-0">
              {OWNER_LABEL}
            </Badge>
          </div>
          {/* 세부 설명은 본문이 길 수 있어 첫 줄만 자른다(뒤는 …) */}
          <p className="text-muted-foreground line-clamp-1 text-xs">{project.description}</p>
        </div>

        {/* 우: 진척 바 · 마감일 · 참여 팀 */}
        <div className="flex shrink-0 items-center gap-4">
          <div className="flex items-center gap-2">
            <Progress value={percent} className="w-32" />
            <span className="text-muted-foreground text-xs tabular-nums">
              <span className="text-foreground font-medium">{percent}%</span> ({project.actionDone}/
              {project.actionTotal})
            </span>
          </div>

          <span className="text-muted-foreground text-sm tabular-nums">{due}</span>

          {/* 참여 팀 — 2개까지 + 나머지 +N. 초과가 있으면 영역 전체 hover 시 전체 팀 목록 */}
          {overflow > 0 ? (
            <Tooltip>
              <TooltipTrigger render={<span className="flex items-center gap-1" />}>
                {visibleTeamBadges}
                <Badge variant="secondary" className="shrink-0">
                  +{overflow}
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <ul className="space-y-0.5">
                  {project.departments.map((team) => (
                    <li key={team}>{team}</li>
                  ))}
                </ul>
              </TooltipContent>
            </Tooltip>
          ) : (
            <span className="flex items-center gap-1">{visibleTeamBadges}</span>
          )}
        </div>
      </Link>
    </li>
  );
}
