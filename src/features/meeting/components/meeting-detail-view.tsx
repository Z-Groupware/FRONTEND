import { CalendarClock, MapPin } from "lucide-react";
import Link from "next/link";

import { ProfileAvatar } from "@/components/common/profile-avatar";
import { ProjectTag } from "@/components/common/project-tag";
import { StatusDot } from "@/components/common/status-dot";
import { ACTION_STATUS_LABEL } from "@/constants/action";
import { formatDate } from "@/lib/date";

import type { MeetingContentPending, MeetingDetail } from "../view-types";
import { ProjectAccent } from "./project-accent";

/**
 * 회의 상세 — **완료 회의만** 여기까지 온다(WORKFLOW §3-2).
 *
 * 라벨 4종(§12): 프로젝트 태그 · (Owner 개설 / 상위 팀 액션) · 회의 안건 · 산출물 목록.
 * ⚠️ 태그·상위 팀 액션은 **실제로 이동하는 링크**다 — 순환 추적의 핵심이라 눌리지 않는
 *    라벨로 두면 안 된다(§12).
 * ⚠️ 산출물은 회의 종류에 따라 다른 것이 담긴다(§2·§5) — 머리말(`outputKindLabel`)과
 *    담당 칸의 뜻(팀명/사람)이 서버에서 이미 갈라져 온다.
 */

/**
 * 곁줄 — **출처 한 줄**이다(목록 카드와 같다).
 *
 * ⚠️ 전에는 태그와 출처를 나란히 **테두리 배지 두 개**로 뒀는데, 목록 카드에서는 태그가
 *    제목 옆 칩이고 출처는 평문이라 같은 회의가 두 화면에서 다른 모양이었다 — 옮겨 다니면
 *    다른 데 온 것처럼 읽힌다.
 * ⚠️ 팀 액션 회의면 **여기서 상위 팀 액션으로 간다**(§12 순환 추적) — 링크임을 밑줄로만
 *    알린다. 상자를 씌우면 다시 배지가 된다.
 */
function OriginLine({ detail }: { detail: MeetingDetail }) {
  if (!detail.parentTeamActionHref) {
    return (
      <p className="text-muted-foreground truncate text-[13px] leading-5">{detail.originLabel}</p>
    );
  }

  return (
    <p className="truncate text-[13px] leading-5">
      <Link
        href={detail.parentTeamActionHref}
        className="text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
      >
        {detail.originLabel}
      </Link>
    </p>
  );
}

/**
 * 아직 안 찬 섹션에 넣는 한 줄.
 *
 * ⚠️ **빈 칸으로 두지 않는다.** 예정·진행중 회의의 기록·산출물은 "없는" 게 아니라 "아직"인데,
 *    비워 두면 하나도 안 나온 회의처럼 읽힌다(§정직성).
 * ⚠️ 진행률을 세지 않는다 — 몇 %인지 그리려면 계속 물어야 하고, 얻는 건 숫자 하나다
 *    (2026-08-10 팀 협의). 못 본다는 사실과 언제 볼 수 있는지는 한 줄이면 다 전달된다.
 */
const PENDING_MESSAGE: Record<MeetingContentPending, string> = {
  SCHEDULED: "아직 시작하지 않은 회의입니다. 회의가 끝나면 여기에 표시됩니다.",
  IN_PROGRESS: "회의가 진행 중입니다. 회의가 끝나면 여기에 표시됩니다.",
  SUMMARIZING: "회의 내용을 요약하고 있습니다. 요약이 끝나면 여기에 표시됩니다.",
  /*
    ⚠️ 실패는 기다려도 안 온다 — 그 사실을 말해야 계속 새로고침하지 않는다.
    ⚠️ **어디로 가라고 적지 않는다**(2026-08-10 리뷰). "마이페이지에서 다시 요약할 수 있습니다"라고
       썼더니 참석자에게도 그렇게 보였는데, 그 목록은 Host의 것이라 가도 이 회의가 없다 —
       못 하는 일을 하라고 시키게 된다(§정직성). 다시 돌리는 건 Host의 마이페이지가 맡는다.
  */
  FAILED: "회의 내용을 요약하지 못했습니다. 개설자가 다시 요약해야 표시됩니다.",
};

function SectionNotice({ reason }: { reason: MeetingContentPending }) {
  return (
    <p className="text-muted-foreground px-7 pt-2 pb-8 text-center text-[13px] leading-5">
      {PENDING_MESSAGE[reason]}
    </p>
  );
}

export function MeetingDetailView({ detail }: { detail: MeetingDetail }) {
  return (
    /*
      ⚠️ **한 컬럼이다.** 곁 컬럼(360)에 참석자만 두니 이름 몇 줄 아래로 오른쪽이 통째로 비었다 —
         DESIGN §1이 두 칸으로 가르라는 건 **1440을 채울 것이 있을 때**다. 여기서 폭을 채우는
         건 산출물 표와 발화 기록인데 둘 다 주 컬럼에 있다.
      ⚠️ 대신 **읽는 글은 좁게 둔다**(§4 폭) — 발화 기록만 720으로 묶는다.
    */
    <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-7">
      <div className="flex min-w-0 flex-col gap-7">
        {/* ⚠️ `overflow-hidden`이 있어야 위 띠와 발치 레일이 모서리를 따라 잘린다 */}
        <section className="border-border bg-card relative overflow-hidden rounded-2xl border p-7">
          <ProjectAccent tag={detail.projectTag} />

          {/*
            ⚠️ **태그는 제목 옆이다**(목록 카드와 같다). 아랫줄에 두면 그 줄에 칩·배지·평문이
               섞여 높이가 제각각이 된다 — 두 화면이 같은 자리를 쓰면 눈이 옮겨 다니지 않는다.
            ⚠️ 태그는 **프로젝트로 가는 링크**다(§12 순환 추적).
          */}
          <div className="flex min-w-0 items-center gap-2">
            <Link
              href={`/app/projects/${detail.projectId}`}
              className="focus-visible:ring-ring shrink-0 rounded-md transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:outline-hidden"
            >
              <ProjectTag tag={detail.projectTag} />
            </Link>
            {/* 제목은 h2 — 페이지의 h1은 PageHeader가 갖고 있다(§a11y: h1은 하나) */}
            <h2 className="truncate text-[17px] leading-7 font-semibold tracking-[-0.3px]">
              {detail.title}
            </h2>
          </div>
          <div className="pt-1.5">
            <OriginLine detail={detail} />
          </div>

          {/*
            회의 안건 — 별도 섹션 유지(§3-2).
            ⚠️ 라벨-값 표로 두지 않는다. 대주제는 값의 이름이 아니라 **묶음 이름**이라
               `프로젝트 | 킥오프`처럼 두 칸으로 벌려 두면 무엇이 라벨인지 안 읽힌다 —
               `대주제 · 소주제` 한 줄이 원래 뜻에 맞는다.
          */}
          <div className="border-border mt-5 border-t pt-5">
            <p className="text-muted-foreground text-[12px] leading-4">안건</p>
            <ul className="flex flex-wrap gap-2 pt-2">
              {detail.topics.map((topic) => (
                <li
                  key={`${topic.main}-${topic.sub}`}
                  className="border-border rounded-lg border px-2.5 py-1 text-[13px] leading-5"
                >
                  <span className="text-muted-foreground">{topic.main}</span>
                  <span className="text-muted-foreground/50 px-1.5">·</span>
                  {topic.sub}
                </li>
              ))}
            </ul>
          </div>

          {/*
            참석자 — **머리 카드 안**이다(시안과 같다). 곁 컬럼에 떼어 두면 이름 몇 줄만
            남고 그 아래가 비는데, 회의를 볼 때 "누가 있었나"는 제목·일정과 함께 읽는 값이다.
          */}
          <div className="border-border mt-5 border-t pt-5">
            <p className="text-muted-foreground text-[12px] leading-4">
              참석자 <span className="tabular-nums">{detail.attendees.length}명</span>
            </p>
            <ul className="flex flex-wrap gap-2 pt-2">
              {detail.attendees.map((attendee) => (
                <li
                  key={attendee.id}
                  className="border-border flex items-center gap-2 rounded-full border py-1 pr-3 pl-1"
                >
                  <ProfileAvatar userId={attendee.id} size={24} />
                  <span className="text-[13px] leading-5">{attendee.name}</span>
                </li>
              ))}
            </ul>
          </div>

          {/*
            ⚠️ **일시·장소는 발치 레일이다**(목록 카드와 같은 해부). 제목 밑에 두면 회의의
               정체(무슨 회의인가)와 일정이 한 덩이로 붙어 셋 다 흐려진다 — 위는 무엇,
               아래는 언제·어디로 가른다.
            ⚠️ 띠 색은 표 머리와 같은 것(`bg-secondary/50`)이다. 새 회색을 만들지 않는다.
          */}
          <div className="border-border bg-secondary/50 -mx-7 mt-6 -mb-7 flex flex-wrap items-center gap-x-3 gap-y-1 border-t px-7 py-4">
            <span className="flex shrink-0 items-center gap-1.5 text-[13px] leading-5 font-medium">
              <CalendarClock className="text-muted-foreground size-4 shrink-0" aria-hidden />
              <span className="tabular-nums">{detail.schedule}</span>
            </span>
            <span className="bg-border h-3 w-px shrink-0" aria-hidden />
            <span className="text-muted-foreground flex min-w-0 items-center gap-1.5 text-[12px] leading-4">
              <MapPin className="size-3.5 shrink-0" aria-hidden />
              <span className="truncate">{detail.roomName}</span>
            </span>
          </div>
        </section>

        {/* 산출물 — 이 회의에서 하달된 액션(§2·§5) */}
        <section className="border-border bg-card overflow-hidden rounded-2xl border">
          <div className="flex items-baseline justify-between gap-3 px-7 pt-6 pb-3">
            {/* ⚠️ 제목 앞 검은 점을 뺀다 — 상태점과 같은 생김새라 뜻이 있는 표식처럼 읽혔다(DESIGN §5) */}
            <h2 className="text-[17px] leading-7 font-semibold tracking-[-0.3px]">
              하달된 {detail.outputKindLabel}
            </h2>
            {/* ⚠️ 아직 안 찬 회의에 `전체 0건`이라 적으면 하나도 안 나온 회의로 읽힌다 */}
            {!detail.pendingReason && (
              <p className="text-muted-foreground text-[12px] leading-4 tabular-nums">
                전체 {detail.outputs.length}건
              </p>
            )}
          </div>

          {detail.pendingReason ? (
            <SectionNotice reason={detail.pendingReason} />
          ) : detail.outputs.length === 0 ? (
            <p className="text-muted-foreground px-7 pt-2 pb-8 text-center text-[13px] leading-5">
              이 회의에서 하달된 {detail.outputKindLabel}이 없습니다.
            </p>
          ) : (
            <ul className="border-border border-t">
              {detail.outputs.map((output) => (
                <li key={output.id} className="border-border not-first:border-t">
                  <Link
                    href={output.href}
                    /* ⚠️ 좁은 화면에서는 여백·간격을 줄인다 — 320px에서 고정 폭이 컨테이너를 넘겨 행이 가로로 넘쳤다 */
                    className="hover:bg-foreground/[0.04] flex items-center gap-3 px-4 py-3.5 transition-colors sm:gap-4 sm:px-7"
                  >
                    {/*
                      ⚠️ **이름이 먼저다.** 상태를 맨 왼쪽에 두니 훑을 때 `진행중·할일·진행중`이
                         먼저 읽히고 정작 무슨 액션인지가 뒤로 밀렸다 — 왼쪽은 무엇인지,
                         오른쪽은 어떤 상태인지로 축을 가른다(DESIGN §3).
                    */}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] leading-5">{output.name}</span>
                      <span className="text-muted-foreground block truncate text-[12px] leading-4">
                        {output.assignee}
                      </span>
                    </span>
                    <StatusDot
                      tone={output.status}
                      label={ACTION_STATUS_LABEL[output.status]}
                      labelClassName="w-[42px] text-left"
                    />
                    <span className="text-muted-foreground shrink-0 text-right text-[12px] leading-4 tabular-nums sm:w-[88px]">
                      {formatDate(output.dueDate)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* 발화 기록 — 화자 구분 없이 청크 단위(§3-2) */}
        <section className="border-border bg-card rounded-2xl border">
          <div className="flex items-baseline justify-between gap-3 px-7 pt-6 pb-3">
            <h2 className="text-[17px] leading-7 font-semibold tracking-[-0.3px]">발화 기록</h2>
            {!detail.pendingReason && (
              <p className="text-muted-foreground text-[12px] leading-4 tabular-nums">
                {detail.script.length}건
              </p>
            )}
          </div>

          {detail.pendingReason ? (
            <SectionNotice reason={detail.pendingReason} />
          ) : detail.script.length === 0 ? (
            <p className="text-muted-foreground px-7 pt-2 pb-8 text-center text-[13px] leading-5">
              남아 있는 발화 기록이 없습니다.
            </p>
          ) : (
            /* ⚠️ 읽는 글은 좁게 둔다(§4 폭 720) — 1440을 가로지르면 눈이 다음 줄을 못 찾는다 */
            <ul className="flex max-w-[720px] flex-col gap-2.5 px-7 pt-2 pb-7">
              {detail.script.map((chunk, index) => (
                <li key={`${chunk.at}-${index}`} className="flex items-baseline gap-4">
                  {/* 시간은 고정폭 — 숫자가 한 축에 서야 훑을 때 눈이 안 흔들린다 */}
                  <span className="text-muted-foreground/70 w-10 shrink-0 text-[12px] leading-5 tabular-nums">
                    {chunk.at}
                  </span>
                  <p className="text-[13px] leading-5 break-keep">{chunk.text}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
