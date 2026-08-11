import { Folder, GitBranch, User, Video } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import {
  type ActionDetailInfoItem,
  ActionDetailInfoRows,
} from "@/components/common/action-detail-info-card";
import { formatMeetingDate } from "@/components/common/dashboard-meeting-item";
import { getPersonalActionDetail } from "@/features/action/server";
import { getProjectDetail } from "@/features/project/server";
import { formatMonthDayWeekday } from "@/lib/date";
import { pickPaletteColor } from "@/lib/palette";

interface PersonalActionDetailPageProps {
  params: Promise<{ actionId: string }>;
}

export async function generateMetadata({
  params,
}: PersonalActionDetailPageProps): Promise<Metadata> {
  const { actionId } = await params;
  const action = await getPersonalActionDetail(actionId);
  return { title: action?.name ?? "액션" };
}

export default async function PersonalActionDetailPage({ params }: PersonalActionDetailPageProps) {
  const { actionId } = await params;
  const action = await getPersonalActionDetail(actionId);
  if (!action) notFound();

  const project = await getProjectDetail(String(action.projectId));
  if (!project) notFound();

  const tagColor = pickPaletteColor(action.projectTag);

  const infoItems: ActionDetailInfoItem[] = [
    {
      key: "assignee",
      icon: User,
      label: "담당자",
      content: `${action.assigneeName}(${action.assigneeRoleLabel})`,
    },
    {
      key: "source-meeting",
      icon: Video,
      label: "출처 회의",
      // ⚠️ 회의 상세(`/app/meeting/:id`) 라우트가 아직 없어 href 없이 텍스트만(§9 화면은 사실만).
      content: (
        <>
          <div className="flex items-center gap-1.5">
            <p className="truncate">{action.sourceMeeting.title}</p>
            <span
              className="shrink-0 rounded px-1.5 py-px text-[11px] leading-4 font-medium"
              style={{ backgroundColor: tagColor.bgColor, color: tagColor.textColor }}
            >
              {action.projectTag}
            </span>
          </div>
          <p className="text-muted-foreground text-[11px] leading-4">
            {formatMeetingDate(action.sourceMeeting.scheduledAt)}
          </p>
        </>
      ),
    },
    {
      key: "parent-team-action",
      icon: GitBranch,
      label: "상위 팀 액션",
      content: (
        <>
          <div className="flex items-center gap-1.5">
            <p className="truncate">{action.parentTeamAction.name}</p>
            <span
              className="shrink-0 rounded px-1.5 py-px text-[11px] leading-4 font-medium"
              style={{ backgroundColor: tagColor.bgColor, color: tagColor.textColor }}
            >
              {action.projectTag}
            </span>
            <span className="bg-muted text-muted-foreground shrink-0 rounded px-1.5 py-0.5 text-[10px] leading-none font-semibold">
              {action.parentTeamAction.team}
            </span>
          </div>
          <p className="text-muted-foreground text-[11px] leading-4">
            {formatMonthDayWeekday(action.parentTeamAction.dueDate) ?? "-"}까지
          </p>
        </>
      ),
      href: `/app/projects/${action.projectId}/team/${action.parentTeamAction.id}`,
    },
    {
      key: "project",
      icon: Folder,
      label: "관련 프로젝트",
      content: (
        <>
          <div className="flex items-center gap-1.5">
            <p className="truncate">{project.name}</p>
            <span
              className="shrink-0 rounded px-1.5 py-px text-[11px] leading-4 font-medium"
              style={{ backgroundColor: tagColor.bgColor, color: tagColor.textColor }}
            >
              {project.tag}
            </span>
          </div>
          <p className="text-muted-foreground text-[11px] leading-4">
            {formatMonthDayWeekday(project.dueDate) ?? "-"}까지
          </p>
        </>
      ),
      href: `/app/projects/${project.id}`,
    },
  ];

  return (
    <main className="scrollbar-hidden min-h-0 flex-1 overflow-y-auto px-8 py-7">
      <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-4">
        {/*
          ⚠️ **제목 위에 경로를 한 줄 더 쓰지 않는다**(§page-header). 뒤로가기가 이제 왔던 길로
             돌아가고(§back-link), 어느 프로젝트·어느 팀 액션에 딸린 것인지는 오른쪽
             `세부 정보`가 이미 말한다 — 같은 값을 두 곳에 두면 하나가 바뀔 때 다른 하나가 남는다.
          ⚠️ 칩 규격은 목록·회의와 같다(11px, `font-mono` 아님).
        */}
        <div className="flex items-center gap-2">
          <h2 className="text-foreground text-xl leading-7 font-semibold tracking-[-0.4px]">
            {action.name}
          </h2>
          <span
            className="shrink-0 rounded px-1.5 py-px text-[11px] leading-4 font-medium"
            style={{ backgroundColor: tagColor.bgColor, color: tagColor.textColor }}
          >
            {action.projectTag}
          </span>
          <span className="bg-muted text-muted-foreground shrink-0 rounded px-1.5 py-px text-[11px] leading-4 font-medium">
            {action.team}
          </span>
        </div>

        {/*
            ⚠️ **한 카드에 쌓는다**(2026-08-10). 전에는 왼쪽 설명 + 오른쪽 sticky 세부 정보로
               2컬럼이었는데, 이 화면이 담는 것은 문단 하나와 값 서너 개뿐이라 왼쪽 글이
               1000px까지 늘어나고(읽는 글은 좁게 둔다 — DESIGN §4) 화면 아래가 통째로 비었다.
               카드 하나로 모으면 **내용만큼만** 차지한다.
            ⚠️ 카드는 **본문 폭을 그대로 쓴다.** 720으로 좁혀 왼쪽에 붙여 뒀더니 오른쪽이
               통째로 비어 화면이 한쪽으로 밀린 것처럼 보였다 — 제목·탭은 왼쪽 끝에 있는데
               카드만 좁으니 축이 둘이 됐다.
            ⚠️ 대신 **글줄만 720에서 끊는다**(§4 읽는 글은 좁게 둔다). 한 줄이 1000px을 넘으면
               눈이 다음 줄을 못 찾는다 — 좁혀야 하는 건 카드가 아니라 글이다.
          */}
        <section className="border-border bg-card w-full overflow-hidden rounded-2xl border">
          <div className="flex items-center gap-2 px-7 pt-6 pb-5">
            <h3 className="text-[17px] leading-7 font-semibold tracking-[-0.3px]">내용</h3>
          </div>
          {/*
            ⚠️ **선과 글줄 폭을 갈라 둔다.** 전에는 `max-w-[720px] border-t`가 같은 요소에
               걸려 있어서 구분선이 카드 왼쪽 720px에서 뚝 끊겼다 — 바로 아래 정보 행들의
               선은 카드 끝까지 이어지는데 이 선만 짧아 카드가 깨져 보였다.
               선·안쪽 여백은 전폭 래퍼가, 720은 **글에만** 건다(§4 읽는 글은 좁게 둔다).
          */}
          <div className="border-border border-t px-7 py-6">
            <p className="text-muted-foreground max-w-[720px] text-[13px] leading-[22px] whitespace-pre-wrap">
              {action.description}
            </p>
          </div>
          <ActionDetailInfoRows items={infoItems} />
        </section>
      </div>
    </main>
  );
}
