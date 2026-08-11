import { ClipboardList, RotateCcw } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { TASK_GROUP } from "@/constants/profile";
import { ScreenScaleCard } from "@/features/appearance/components/screen-scale-card";
import { ThemeCard } from "@/features/appearance/components/theme-card";
import { listPendingReviewsForViewer } from "@/features/meeting/review/server";
import { listStalledSummariesForViewer } from "@/features/meeting/summary/server";
import { ProfileHeader } from "@/features/profile/components/profile-header";
import { ProfileInfoCard } from "@/features/profile/components/profile-info-card";
import { StalledSummaryList } from "@/features/profile/components/stalled-summary-list";
import { TaskGroupSection } from "@/features/profile/components/task-group-section";
import { UnconfirmedActionList } from "@/features/profile/components/unconfirmed-action-list";
import { parseProfileTab, PROFILE_TABS } from "@/features/profile/lib";
import { getMyProfile } from "@/features/profile/server";
import { getViewer } from "@/features/shell/viewer";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "마이페이지",
};

interface AppMePageProps {
  searchParams: Promise<{ tab?: string }>;
}

/**
 * 마이페이지 — 프로필(읽기 전용)·화면 배율·테마 + 미확정 액션.
 *
 * ⚠️ **편집·연차 등은 명세가 없어 만들지 않는다**(§명세에 없는 화면·기능은 안 만든다).
 *    "기본 정보"는 팀 디자인(피그마)을 그대로 반영했지만, 이 화면에서 값을 고칠 수 있다는
 *    뜻은 아니다 — 편집 API·정책이 확정되면 그때 붙인다.
 * ⚠️ 배율은 **기기 설정**이라 서버에 저장하지 않는다(`ScreenScaleCard` 그대로 유지).
 * ⚠️ "처리할 일" 탭은 **여기 있어야 한다** — "내 액션"(`/app/my/actions`)은 Owner가
 *    접근 못 하는데, 회의 Host는 Owner일 수 있다(2026-08-07 사용자 확정, WORKFLOW.md 미기재
 *    — 이 화면 자체가 새로 나온 정책). "요약이 중단된 회의" 그룹도 같은 이유로 여기 둔다
 *    (BE #177 대응, 2026-08-08 — 실시간 진행 배너를 놓친 사람이 뒤늦게 발견하는 자리).
 */
export default async function AppMePage({ searchParams }: AppMePageProps) {
  const activeTab = parseProfileTab((await searchParams).tab);
  const viewer = await getViewer();
  const isTaskTab = activeTab === "unconfirmed";

  const [profile, pendingReviews, stalledSummaries] = await Promise.all([
    getMyProfile(),
    isTaskTab ? listPendingReviewsForViewer(viewer.id) : Promise.resolve([]),
    isTaskTab ? listStalledSummariesForViewer(viewer.id) : Promise.resolve([]),
  ]);

  return (
    <div className="flex-1 overflow-y-auto px-8 py-7">
      {/*
        ⚠️ **1440이다**(2026-08-11). 폼 한 장이라 안쪽을 720으로 묶어 뒀었는데, 사이드바로
           오갈 때 이 화면만 본문이 좁아져 튀었다 — 폭은 워크벤치 전체를 하나로 맞춘다.
        ⚠️ 입력칸·읽는 글은 카드 안에서 따로 상한을 건다.
      */}
      <div className="mx-auto w-full max-w-[1440px]">
        <div className="flex w-full flex-col gap-5">
          <nav aria-label="마이페이지 탭" className="border-border flex gap-4 border-b">
            {PROFILE_TABS.map((t) => (
              <Link
                key={t.tab}
                href={t.tab === "info" ? "/app/me" : `/app/me?tab=${t.tab}`}
                aria-current={activeTab === t.tab ? "page" : undefined}
                className={cn(
                  "-mb-px border-b-2 px-1 pb-2 text-[13px] leading-5 font-medium transition-colors",
                  activeTab === t.tab
                    ? "border-foreground text-foreground"
                    : "text-muted-foreground hover:text-foreground border-transparent",
                )}
              >
                {t.label}
              </Link>
            ))}
          </nav>

          {isTaskTab ? (
            /*
              ⚠️ **둘을 나란히 둔다**(2026-08-11). 세로로 쌓으니 짧은 카드 둘이 화면을 길게
                 끌어 스크롤이 생기는데 정작 오른쪽은 통째로 비었다 — 둘 다 짧은 목록이라
                 나란히 서는 게 맞다(검색 화면과 같은 판단). 좁아지면 다시 세로로 쌓인다.
            */
            <div className="grid gap-5 lg:grid-cols-2 lg:items-start">
              <TaskGroupSection
                icon={ClipboardList}
                title={TASK_GROUP.UNCONFIRMED_ACTION.title}
                count={pendingReviews.length}
                emptyMessage={TASK_GROUP.UNCONFIRMED_ACTION.emptyMessage}
              >
                <UnconfirmedActionList reviews={pendingReviews} />
              </TaskGroupSection>

              <TaskGroupSection
                icon={RotateCcw}
                title={TASK_GROUP.STALLED_SUMMARY.title}
                count={stalledSummaries.length}
                emptyMessage={TASK_GROUP.STALLED_SUMMARY.emptyMessage}
              >
                <StalledSummaryList summaries={stalledSummaries} />
              </TaskGroupSection>
            </div>
          ) : (
            <div className="flex flex-col gap-7">
              <ProfileHeader profile={profile} />

              {/*
                ⚠️ **두 칸으로 가른다**(2026-08-11). 폭을 넓히면서 카드를 세로로 쌓아 두니
                   1440짜리 띠 세 장이 되어 안이 헐거워졌다 — 왼쪽은 **나에 대한 것**(기본 정보),
                   오른쪽은 **이 기기에 대한 것**(화면 배율·테마)이다. 저장되는 자리가 서로
                   다르다(회사 계정 / 이 브라우저)라, 섞어 쌓으면 같은 종류로 읽힌다.
                ⚠️ 곁 칸은 360px 고정이다 — 인수인계 상세와 같은 값이다(§DESIGN 4).
              */}
              <div className="flex flex-col gap-7 lg:flex-row lg:items-start">
                <div className="min-w-0 flex-1">
                  <ProfileInfoCard profile={profile} />
                </div>
                <div className="flex flex-col gap-5 lg:w-[360px] lg:shrink-0">
                  <ScreenScaleCard />
                  <ThemeCard />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
