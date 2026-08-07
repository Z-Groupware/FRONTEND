import { cn } from "@/lib/utils";

import type { OrgChart, OrgTeam } from "../org-types";
import { MatchText } from "./match-text";
import { OrgMemberNode } from "./org-member-node";
import { PeopleSearch } from "./people-search";

/**
 * 구성원 조직도(`/app/people`).
 *
 * **왜 카드 목록이 아니라 조직도인가** — 회사의 사람을 보는 화면에서 먼저 알아야 하는 건
 * "누가 어느 팀이고, 그 팀을 누가 맡는가"다. 아바타 카드를 2열로 늘어놓으면 그 둘이 안 보인다.
 *
 * **왜 팀을 가로로 늘어놓지 않는가** — 처음엔 대표 아래에 팀을 한 줄로 세웠는데, 팀 한 칸에
 * 이름·직급·역할이 다 들어가야 해서 300px는 필요했다. 네 팀이면 1200px인데 **1440 화면에서도
 * 본문에 남는 폭은 1100뿐**이라 그대로 잘렸다 — 팀이 늘면 더 심해진다.
 * 세로 척추에 팀을 가지로 다니 폭을 가로로 다 쓰고, 팀이 몇이든 아래로만 길어진다.
 *
 * ⚠️ 계층은 **두 단이 전부**다 — 대표 한 단, 팀 한 단. 팀은 계층이 없는 플랫 목록이고
 *    팀 안의 "역할"은 또 다른 단이 아니라 라벨이다(CLAUDE.md §권한 ③, WORKFLOW §9).
 * ⚠️ 연결선은 **장식이라 `aria-hidden`**이다. 구조는 `ul`/`li` 중첩과 팀 이름 제목이
 *    말한다 — 선을 못 보는 사람에게도 조직이 읽혀야 한다(§a11y).
 */

/**
 * 사람 상자를 놓는 격자.
 *
 * ⚠️ **칸 수를 박지 않는다**(`auto-fill`). `lg:grid-cols-4` 같은 값으로 두면 사이드바가
 *    있는 폭·배율마다 칸이 찌그러진다 — 최소 폭만 정하고 몇 칸이 들어갈지는 브라우저가 센다.
 * ⚠️ 대표도 **같은 격자**에 넣는다. 따로 폭을 주면 대표 상자만 팀원 상자와 어긋난다.
 */
const NODE_GRID_CLASS = "grid grid-cols-[repeat(auto-fill,minmax(248px,1fr))] gap-2";

/**
 * 척추에서 가지가 갈라지는 높이 — 팀 이름 줄의 한가운데다.
 *
 * ⚠️ 가지 선(`top`)과 마지막 팀의 척추 길이(`h`)가 **같은 값**이라야 선이 딱 맞아떨어진다.
 *    따로 적으면 한쪽만 고쳤을 때 마지막 가지 아래로 선이 조금 삐져나온다.
 */
const BRANCH_OFFSET = "1.75rem";

/** 척추가 서는 자리 — 대표 상자 아바타의 한가운데(`px-3.5` 14 + 지름 32의 절반 16)다 */
const SPINE_OFFSET = "30px";

function TeamBranch({
  team,
  isLast,
  hasOwner,
  keyword,
}: {
  team: OrgTeam;
  isLast: boolean;
  hasOwner: boolean;
  keyword: string;
}) {
  return (
    /*
      ⚠️ 이을 곳이 없으면 **들여쓰지도 않는다.** 대표가 검색에 안 걸리면 조직도에 대표가
         없는데, 그때도 들여쓰면 왼쪽이 빈 채로 팀만 밀려 있다.
    */
    <li className={cn("relative pt-4", hasOwner && "pl-7")}>
      {/*
        ⚠️ **대표가 있을 때만 선을 그린다.** 없는데 그리면 아무 데도 안 닿는 선이 남아,
           위에 뭔가 잘려 나간 것처럼 보인다(검색 결과에서 실제로 그랬다).
      */}
      {hasOwner && (
        <>
          {/* 세로 척추 — 마지막 팀은 제 가지까지만 내려온다 */}
          <span
            className={cn("bg-border absolute top-0 left-0 w-px", !isLast && "h-full")}
            style={isLast ? { height: BRANCH_OFFSET } : undefined}
            aria-hidden
          />
          {/* 가로 가지 */}
          <span
            className="bg-border absolute left-0 h-px w-5"
            style={{ top: BRANCH_OFFSET }}
            aria-hidden
          />
        </>
      )}

      <h3 className="flex items-baseline gap-2 pb-2">
        {/*
          ⚠️ 팀 이름에도 표시한다. 검색이 팀도 보기 때문에 `자`로 찾으면 이름에 `자`가 없는
             사람이 뜨는데(`디자인팀`이 걸린 것이다), 여기가 표시돼야 그 이유가 보인다.
        */}
        <span className="text-[13px] leading-5 font-semibold">
          <MatchText text={team.name} keyword={keyword} />
        </span>
        <span className="text-muted-foreground text-[11px] leading-4 tabular-nums">
          {team.members.length}명
        </span>
      </h3>

      <ul className={NODE_GRID_CLASS}>
        {team.members.map((member) => (
          <li key={member.id}>
            <OrgMemberNode member={member} keyword={keyword} />
          </li>
        ))}
      </ul>
    </li>
  );
}

export function OrgChartView({ chart, keyword }: { chart: OrgChart; keyword: string }) {
  const { owner, teams, totalCount } = chart;
  const isSearching = keyword.trim().length > 0;

  return (
    <section className="border-border bg-card rounded-2xl border">
      <div className="flex items-baseline justify-between gap-3 px-7 pt-6 pb-3">
        <h2 className="flex items-center gap-2 text-[17px] leading-7 font-semibold tracking-[-0.3px]">
          <span className="bg-foreground size-2 rounded-full" aria-hidden />
          조직도
        </h2>
        {/*
          ⚠️ 찾는 중이면 **찾은 수**를 적는다. 검색을 걸어 놓고 `전체 3명`이라고 하면
             회사가 세 명인 줄 읽힌다 — 회사 전체 인원은 위 요약 카드가 말한다.
        */}
        <p className="text-muted-foreground text-[12px] leading-4 tabular-nums">
          {isSearching ? `찾은 ${totalCount}명` : `전체 ${totalCount}명`}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3 px-7 pb-5">
        <PeopleSearch keyword={keyword} />
      </div>

      {totalCount === 0 ? (
        /*
          ⚠️ 없다는 말만 두지 않는다 — **다음에 무엇을 하면 되는지**를 같이 적는다
             (§상태 세 장). 못 찾은 것과 아직 아무도 없는 것은 다음 할 일이 다르다.
        */
        <div className="px-7 pt-2 pb-10 text-center">
          {isSearching ? (
            <>
              <p className="text-[13px] leading-5">찾는 구성원이 없습니다.</p>
              <p className="text-muted-foreground pt-1 text-[12px] leading-4">
                이름·팀·역할·직급으로 찾습니다. 검색어를 지우면 조직도 전체가 보입니다.
              </p>
            </>
          ) : (
            <>
              <p className="text-[13px] leading-5">아직 등록된 구성원이 없습니다.</p>
              <p className="text-muted-foreground pt-1 text-[12px] leading-4">
                계정이 발급되면 이 자리에 조직도가 그려집니다.
              </p>
            </>
          )}
        </div>
      ) : (
        <div className="px-7 pt-2 pb-7">
          {owner && (
            <div className={NODE_GRID_CLASS}>
              <OrgMemberNode member={owner} keyword={keyword} />
            </div>
          )}

          <ul style={owner ? { marginLeft: SPINE_OFFSET } : undefined}>
            {teams.map((team, index) => (
              <TeamBranch
                key={team.name}
                team={team}
                isLast={index === teams.length - 1}
                hasOwner={owner !== null}
                keyword={keyword}
              />
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
