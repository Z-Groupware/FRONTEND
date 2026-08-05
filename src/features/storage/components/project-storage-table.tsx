"use client";

import { Trash2 } from "lucide-react";
import Link from "next/link";

import { StatusDot } from "@/components/common/status-dot";
import { PROJECT_STATUS_LABEL } from "@/constants/project";
import { formatGb } from "@/features/billing/pricing";
import { pickPaletteColor } from "@/lib/palette";

import { canDeleteRecordings, formatRecordedDate } from "../storage";
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
  /*
    ⚠️ `overflow-hidden`이 있어야 **줄 왼쪽 세로 띠가 둥근 모서리 안에서 잘린다.**
       없으면 마지막 줄의 띠가 카드 밖으로 삐져나와 각진 꼬리가 남는다.
  */
  return (
    <section className="border-border bg-card overflow-hidden rounded-2xl border">
      <div className="flex items-baseline justify-between gap-3 px-7 pt-6 pb-3">
        <h2 className="flex items-center gap-2 text-[17px] leading-7 font-semibold tracking-[-0.3px]">
          <span className="bg-foreground size-2 rounded-full" aria-hidden />
          프로젝트별 사용량
        </h2>
        {/*
          ⚠️ 전체 건수를 적는다 — 끝이 안 보이는 목록은 얼마나 남았는지 알 수 없다.
          ⚠️ `/70`을 쓰지 않는다 — 12px 글자가 라이트에서 2.73:1로 4.5:1에 못 미친다(§a11y).
          ⚠️ **아래 지우기 아이콘과 세로축(가운데)을 맞춘다.** 맞출 대상은 아이콘 상자의
             가운데이고, 그건 `삭제` 머리글의 가운데와 같은 선이다.
          ⚠️ 전에 여기를 **오른쪽으로 8px 밀어 뒀는데 방향이 반대였다** — 그래서 9px 어긋나
             눈에 확 보였다. 실측하면 이 글자는 밀지 않은 자리에서 이미 1px 차이까지 맞는다.
             남는 1px만 왼쪽으로 당긴다.
          ⚠️ **움직이는 건 이 글자다.** 표 쪽 `pr-*`를 건드리면 다섯 줄의 아이콘이 다 같이
             움직여 열 안에서 한쪽으로 쏠린다.
        */}
        <p className="text-muted-foreground shrink-0 -translate-x-px text-[12px] leading-4 tabular-nums">
          전체 {projects.length}개
        </p>
      </div>

      {/*
        ⚠️ **무엇이 사라지는지 지우는 자리에서 말한다.** 따로 떨어진 안내 상자로 두면 표를 볼 때는
           이미 화면 밖이라, 정작 버튼을 누르는 순간에는 안 읽힌다.
        ⚠️ 자막·요약까지 지우는 게 **되돌릴 수 없고 추적이 끊기는 일**이라, 다 남는 줄 알고
           눌렀다가 나중에 회의 기록을 못 찾는 일이 없어야 한다(§정직성).
        ⚠️ **제목과 이 문구 사이에 선을 긋지 않는다.** 둘은 한 덩어리(무엇을 보는 표인지 +
           지우면 어떻게 되는지)라, 선을 그으면 층이 하나 더 생겨 카드가 늘어나 보인다 —
           카드 안에서 선은 **표가 시작하는 자리** 한 곳만 긋는다.
      */}
      <p className="text-muted-foreground px-7 pb-5 text-[12px] leading-[18px] break-keep">
        삭제 시 <span className="text-foreground font-medium">음성과 자막·요약이 함께</span>{" "}
        제거되고 목록에서 빠집니다. 그 회의의 기록과 액션의 출처 추적이 끊기며 되돌릴 수 없습니다.
      </p>

      {projects.length === 0 ? (
        /* ⚠️ 빈 상태 — 무엇이 없는지 적는다(§3상태) */
        <p className="text-muted-foreground border-border border-t px-6 py-12 text-center text-[13px] leading-5 break-keep">
          저장소를 쓰는 프로젝트가 없습니다
        </p>
      ) : (
        <div className="border-border overflow-x-auto border-t">
          <table className="w-full min-w-[760px] table-fixed text-[13px]">
            {/*
              ⚠️ 열 폭을 **비율(%)로** 준다. px로 고정하면 남는 폭을 첫 열(프로젝트)이 통째로
                 먹어서, 넓은 화면에서는 이름 왼쪽만 텅 비고 나머지 값이 오른쪽에 구겨진다 —
                 비율이면 화면이 넓어질 때 모든 열이 같이 늘어난다.
              ⚠️ `table-fixed`가 있어야 이 값이 실제로 먹는다. 없으면 브라우저가 내용을 보고
                 다시 계산한다. 좁아지면 `min-w`까지 줄었다가 가로로 스크롤한다.
            */}
            <colgroup>
              <col className="w-[26%]" />
              <col className="w-[11%]" />
              <col className="w-[10%]" />
              <col className="w-[19%]" />
              <col className="w-[11%]" />
              <col className="w-[15%]" />
              <col className="w-[8%]" />
            </colgroup>
            <thead>
              {/*
                ⚠️ **이름만 왼쪽이고 나머지는 가운데**다. 열 폭이 고정이라 머리와 칸에 같은
                   정렬을 주면 두 글자의 **가운데가 한 세로선**에 놓인다 — 한쪽만 끝에 붙이면
                   글자 길이가 달라 축이 어긋나 보인다.
                ⚠️ 이름은 예외다. 길이가 제각각이라 가운데로 모으면 왼쪽 끝이 들쭉날쭉해져
                   세로로 훑을 수가 없다 — 목록에서 사람이 가장 먼저 찾는 열이다.
              */}
              {/*
                ⚠️ 머리에 **섹션 띠**(`--secondary`)를 깐다. 보더 한 줄만으로는 머리와 본문이
                   같은 면으로 읽혀서, 표가 카드 안에서 어디부터 시작하는지 흐리다 —
                   색을 늘리는 게 아니라 §디자인 토큰이 정해 둔 표면을 쓰는 것이다.
              */}
              <tr className="text-muted-foreground bg-secondary/50 border-border border-b text-[12px] leading-4">
                <th className="px-6 py-3 text-left font-normal">프로젝트</th>
                {/*
                  ⚠️ 상태는 **자기 열**이다. 이름 옆에 붙여 두면 이름 길이에 따라 좌우로 밀려서
                     세로로 훑을 수가 없다 — 지울 수 있는 줄을 고르는 게 이 표의 일이라
                     상태가 한 줄로 서 있어야 한다.
                */}
                <th className="px-4 py-3 text-center font-normal">상태</th>
                {/*
                  ⚠️ **`회의`가 아니라 `녹음 회의`** 다. 지우고 나면 이 값이 0이 되는데,
                     `회의`라고만 적으면 회의 자체가 사라진 것으로 읽힌다 — 사라진 건 녹음뿐이다.
                */}
                <th className="px-4 py-3 text-center font-normal">녹음 회의</th>
                {/*
                  ⚠️ 음성 열에만 **비중 막대**를 붙인다. 어느 프로젝트가 자리를 많이 먹는지가
                     이 표를 보는 이유인데, 숫자만 늘어놓으면 다섯 줄을 다 읽고 비교해야 한다.
                     자막·요약은 지울 수 없어 비교할 이유가 없으므로 숫자만 둔다.
                */}
                <th className="px-4 py-3 text-center font-normal">음성</th>
                <th className="px-4 py-3 text-center font-normal">자막·요약</th>
                <th className="px-4 py-3 text-center font-normal">가장 오래된 녹음</th>
                {/*
                  ⚠️ **이 열에도 이름을 준다.** 다른 여섯 열은 다 머리글이 있는데 여기만 비어
                     있으면 표가 한 칸 덜 끝난 것처럼 보이고, 아이콘이 무엇을 하는 것인지도
                     머리에서 안 읽힌다. 전에는 `sr-only`라 스크린 리더에만 있었다.
                */}
                <th className="py-3 pr-5 pl-0 text-center font-normal">삭제</th>
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
  const tagColor = pickPaletteColor(project.tag);
  // ⚠️ 0으로 나누면 `NaN%`가 되어 막대가 아예 안 그려진다
  const share = totalVoiceGb > 0 ? (project.voiceGb / totalVoiceGb) * 100 : 0;

  /*
    ⚠️ 줄 강조는 `--secondary`가 아니라 **먹색 옅게**(`foreground/[0.04]`)다. 라이트에서
       `--secondary`(#fafaf9)는 흰 카드와 2%밖에 차이가 없어서 손이 어느 줄에 있는지
       전혀 안 보인다 — 사이드바 항목이 같은 방식을 쓴다.
  */
  return (
    <tr className="group border-border hover:bg-foreground/[0.04] transition-colors not-first:border-t">
      {/*
        ⚠️ **줄 왼쪽 세로 띠가 그 프로젝트의 색**이다(`lib/palette`). 표에서 프로젝트를
           구분하는 건 태그 글자인데, 다섯 줄을 훑을 때 글자를 읽기 전에 색이 먼저 잡힌다 —
           대시보드 회의 목록이 같은 방식을 쓴다.
        ⚠️ `relative`로 띠를 칸 안에 절대배치한다. `border-left`로 그리면 hover 배경이
           띠까지 덮고, 줄 사이 가로 구분선(`border-t`)과 모서리에서 겹친다.
        ⚠️ 띠는 `aria-hidden`이다 — 색이 말하는 건 태그 글자가 이미 말한다(§a11y).
      */}
      <td className="relative px-6 py-3.5">
        <span
          aria-hidden
          className="absolute inset-y-0 left-0 w-[3px]"
          style={{ backgroundColor: tagColor.solidColor }}
        />
        {/*
          ⚠️ 이름은 **프로젝트로 가는 링크**다. 지울지 판단하려면 무슨 프로젝트였는지 봐야 하는데,
             이름만 있으면 검색으로 다시 찾아 들어가야 한다.
          ⚠️ `inline-block`이라야 밑줄과 포커스 링이 **글자 폭에만** 걸린다. `block`이면 칸
             전체가 링크로 보여서, 빈 자리를 눌러도 눌리는 것처럼 읽힌다.
        */}
        {/*
          ⚠️ **영문 태그 칩(`#product-v2`)을 붙이지 않는다.** 한글 이름 옆에 영문 슬러그가
             나란히 서면 같은 것을 두 번 말하는 데다, 표에서 눈이 먼저 닿는 열이 영어로 시작한다.
             태그는 **줄 왼쪽 색 띠**가 대신 말하고, 이동은 이름 링크가 같은 곳으로 데려간다.
        */}
        <span className="flex min-w-0 items-center gap-2">
          <Link
            href={`/app/projects/${project.tag}`}
            title={project.name}
            className="focus-visible:ring-ring min-w-0 truncate rounded hover:underline focus-visible:ring-2 focus-visible:outline-hidden"
          >
            {project.name}
          </Link>
        </span>
      </td>
      <td className="px-6 py-3.5">
        {/*
          ⚠️ 라벨을 손으로 적지 않는다 — `PROJECT_STATUS_LABEL`이 정본이다(§도메인 상수).
             `진행중`이라고 박아 두면 라벨이 바뀔 때 이 화면만 옛말을 한다.
          ⚠️ 점 색은 공용 `StatusDot`이 정한다. 화면마다 색을 고르면 같은 색이 두 뜻을 갖는다.
        */}
        {/*
          ⚠️ **묶음을 가운데 두지 않는다**(`justify-center` 금지). `진행중`(3자)과 `완료`(2자)는
             폭이 달라서, 묶음 전체를 가운데 놓으면 **점이 줄마다 좌우로 어긋난다.**
             **점은 점끼리, 글자는 글자끼리 각각 한 세로선에 선다.**
             라벨을 고정폭 상자에 넣고(`w-[42px]`) 그 안에서 **가운데 정렬**한다 —
             그러면 `완료`(2자)와 `진행중`(3자)의 **가운데가 같은 세로선**에 놓이고,
             상자 폭이 일정하니 앞에 붙는 점도 저절로 한 줄로 선다.
             `text-left`로 두면 글자 시작점은 맞아도 짧은 `완료`의 가운데가 왼쪽으로 밀린다.
        */}
        <StatusDot
          tone={project.status}
          label={PROJECT_STATUS_LABEL[project.status]}
          labelClassName="w-[42px] text-center"
          className="mx-auto w-fit text-[12px] leading-4"
        />
      </td>
      <td className="text-muted-foreground px-4 py-3.5 text-center tabular-nums">
        {project.meetingCount}개
      </td>
      <td className="px-6 py-3.5">
        {/*
          ⚠️ 막대는 **전체 음성 대비 비중**이다. 포함량(50GB) 기준으로 그리면 한 프로젝트가
             차지하는 조각이 너무 작아 다섯 줄이 전부 비슷해 보인다.
          ⚠️ **막대는 막대끼리, 숫자는 숫자끼리 선다.** 묶음만 가운데 두면 `10.9GB`(4자리)가
             `9.1GB`(3자리)보다 넓어서 그 줄만 막대가 왼쪽으로 밀린다 — 상태 칸의 점과 같은
             문제다. 숫자 상자의 **폭을 고정**해야 덩어리 폭이 일정해지고 둘 다 한 줄로 선다.
          ⚠️ 숫자는 상자 안에서 **오른쪽 정렬**이다. 자릿수가 다른 값은 오른쪽 끝을 맞춰야
             크기를 견줄 수 있다(`tabular-nums`와 같은 이유).
        */}
        <span className="flex items-center justify-center gap-2.5">
          <span
            className="bg-secondary h-1.5 w-[68px] shrink-0 overflow-hidden rounded-full"
            aria-hidden
          >
            {/*
              ⚠️ 막대 색이 **그 프로젝트의 색**이다(`lib/palette`). 표에서 가장 큰 색 덩어리라
                 여기에 두면 어느 줄이 어느 프로젝트인지 훑어서 잡힌다 — 태그 칩에 두면
                 글자 뒤에 깔려 잘 안 보인다.
              ⚠️ 원색(`--tag-*-solid`)을 쓴다. 칩 글자색은 4.5:1을 맞추려 진해서 막대에 쓰면
                 다섯 줄이 전부 시커멓다.
            */}
            <span
              className="block h-full rounded-full"
              style={{ width: `${share}%`, backgroundColor: tagColor.solidColor }}
            />
          </span>
          <span className="w-[58px] shrink-0 text-right tabular-nums">
            {formatGb(project.voiceGb)}
          </span>
        </span>
      </td>
      <td className="text-muted-foreground px-4 py-3.5 text-center tabular-nums">
        {formatGb(project.sttGb)}
      </td>
      {/*
        ⚠️ 녹음이 없으면 날짜 대신 `—`다. 지운 뒤 이 줄은 `녹음 0개 · 0GB`가 되는데,
           "가장 오래된 녹음" 칸에 옛 날짜가 남아 있으면 없는 녹음의 날짜를 말하는 셈이다.
      */}
      <td className="text-muted-foreground px-4 py-3.5 text-center tabular-nums">
        {project.voiceGb > 0 ? formatRecordedDate(project.oldestRecordedAt) : "—"}
      </td>
      {/*
        ⚠️ **줄마다 버튼이 있다 없다 하지 않는다.** 전에는 지울 수 있는 줄에만 그려서, 다섯
           줄 중 둘에만 아이콘이 떠 있어 왜 어떤 줄엔 없는지 알 수 없었다 — 열이 비면
           기능이 없는 건지 이 줄만 안 되는 건지 구분이 안 된다.
           **자리는 늘 두고, 못 지우는 줄은 잠근다.** 이유는 `title`이 말한다(§정직성).
        ⚠️ 오른쪽에 여백(`pr-5`)을 줘 **안쪽으로 당긴다.** 표 맨 끝에 붙이면 카드 모서리에
           닿아 혼자 밀려난 것처럼 보인다.
        ⚠️ 머리의 `전체 N개`가 **이 아이콘에 세로축을 맞춘다** — 움직이는 쪽은 그쪽이다.
        ⚠️ 뜻은 `aria-label`이 말한다 — 휴지통 그림만으로는 **무엇을** 지우는지 알 수 없다.
      */}
      <td className="py-3.5 pr-5 pl-0 text-center">
        {canManage && (
          <button
            type="button"
            disabled={!isDeletable}
            onClick={() => onDelete(project)}
            aria-label={
              isDeletable
                ? `${project.name} 기록 삭제`
                : `${project.name} — 진행 중이라 삭제할 수 없습니다`
            }
            title={isDeletable ? "기록 삭제" : "진행 중인 프로젝트는 삭제할 수 없습니다"}
            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 focus-visible:ring-ring inline-flex size-8 items-center justify-center rounded-md transition-colors focus-visible:ring-2 focus-visible:outline-hidden disabled:pointer-events-none disabled:opacity-25"
          >
            <Trash2 className="size-4" aria-hidden />
          </button>
        )}
      </td>
    </tr>
  );
}
