import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { getProgressPercent, splitDepartments } from "@/features/project/lib";
import type { ProjectListItem as ProjectListItemModel } from "@/features/project/types";
import { formatMonthDayWeekday } from "@/lib/date";
import { pickPaletteColor } from "@/lib/palette";

/**
 * 프로젝트 한 줄 — 회의 아이템과 같은 결.
 * 좌(클릭 시 프로젝트 상세): 태그 · 프로젝트명 · 세부 설명 첫 줄 / 우: 진척 · 마감일.
 * ⚠️ "Owner" 라벨은 두지 않는다 — 프로젝트는 전부 Owner 개설이라 이 전용 목록에선 모든 행이 같아 노이즈다.
 *    (최상위 구분 라벨은 프로젝트·회의·액션이 섞이는 혼합 화면에서만 의미가 있다.)
 * 맨 오른쪽 참여 팀은 **링크 밖**이라 눌러도 이동하지 않는다 — 팀 상세는 없고, 팀 액션은 추후
 * 프로젝트 상세 타임라인에서 보여준다. 2개까지 + `+N`, hover 시 전체 목록.
 */
export function ProjectListItem({ project }: { project: ProjectListItemModel }) {
  const percent = getProgressPercent(project.actionDone, project.actionTotal);
  const { visible, overflow } = splitDepartments(project.departments);
  const due = formatMonthDayWeekday(project.dueDate);
  // 태그 색은 고정 팔레트(globals.css `--tag-*`)에서 태그명으로 뽑는다 — 라이트/다크는 CSS가 대응
  const tagColor = pickPaletteColor(project.tag);

  const visibleTeamBadges = visible.map((team) => (
    <Badge key={team} variant="outline" className="shrink-0">
      {team}
    </Badge>
  ));

  return (
    <li className="hover:bg-muted relative flex items-center gap-3 py-3.5 pr-4 pl-5 transition-colors">
      {/* 태그색 스트립 — 행 왼쪽 끝 */}
      <span
        className="absolute inset-y-0 left-0 w-1"
        style={{ backgroundColor: tagColor.solidColor }}
        aria-hidden
      />

      {/* 클릭 영역 = 프로젝트 상세로 */}
      <Link href={`/app/projects/${project.id}`} className="flex min-w-0 flex-1 items-center gap-3">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <span
            className="w-fit rounded px-1.5 py-0.5 font-mono text-[10px] font-semibold"
            style={{ backgroundColor: tagColor.bgColor, color: tagColor.textColor }}
          >
            {project.tag}
          </span>
          <span className="truncate text-[15px]">{project.name}</span>
          {/* 세부 설명은 본문이 길 수 있어 첫 줄만 자른다(뒤는 …) */}
          <p className="text-muted-foreground line-clamp-1 text-xs">{project.description}</p>
        </div>

        <div className="flex shrink-0 items-center gap-4">
          <div className="flex items-center gap-2">
            <Progress value={percent} className="w-32" />
            <span className="text-foreground text-xs font-medium tabular-nums">{percent}%</span>
          </div>
          {/* 날짜만 두면 마감으로 안 읽혀 '까지'를 붙인다 */}
          <span className="text-muted-foreground text-sm tabular-nums">
            {due ? `${due}까지` : "-"}
          </span>
        </div>
      </Link>

      {/* 참여 팀 — 링크 밖(이동 없음). 초과가 있으면 영역 전체 hover 시 전체 목록 */}
      <div className="shrink-0" aria-label={`참여 팀: ${project.departments.join(", ")}`}>
        {overflow > 0 ? (
          <Tooltip>
            <TooltipTrigger render={<span className="flex items-center gap-1" />}>
              {visibleTeamBadges}
              <Badge variant="secondary" className="shrink-0">
                +{overflow}
              </Badge>
            </TooltipTrigger>
            {/* 아래쪽·가로 나열 — 세로 목록은 선택형 드롭다운처럼 보인다 */}
            <TooltipContent side="bottom" className="max-w-none">
              <span className="whitespace-nowrap">{project.departments.join(" · ")}</span>
            </TooltipContent>
          </Tooltip>
        ) : (
          <span className="flex items-center gap-1">{visibleTeamBadges}</span>
        )}
      </div>
    </li>
  );
}
