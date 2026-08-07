import { CalendarClock, MapPin } from "lucide-react";
import Link from "next/link";

import { ProfileAvatar } from "@/components/common/profile-avatar";
import { StatusDot } from "@/components/common/status-dot";
import { ACTION_STATUS_LABEL } from "@/constants/action";
import { formatDate } from "@/lib/date";
import { pickPaletteColor } from "@/lib/palette";

import type { MeetingDetail } from "../view-types";

/**
 * 회의 상세 — **완료 회의만** 여기까지 온다(WORKFLOW §3-2).
 *
 * 라벨 4종(§12): 프로젝트 태그 · (Owner 개설 / 상위 팀 액션) · 회의 안건 · 산출물 목록.
 * ⚠️ 태그·상위 팀 액션은 **실제로 이동하는 링크**다 — 순환 추적의 핵심이라 눌리지 않는
 *    라벨로 두면 안 된다(§12).
 * ⚠️ 산출물은 회의 종류에 따라 다른 것이 담긴다(§2·§5) — 머리말(`outputKindLabel`)과
 *    담당 칸의 뜻(팀명/사람)이 서버에서 이미 갈라져 온다.
 */

function MetaLabels({ detail }: { detail: MeetingDetail }) {
  const color = pickPaletteColor(detail.projectTag);

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <Link
        href={`/app/projects/${detail.projectId}`}
        className="rounded px-2 py-0.5 text-[12px] leading-4 font-medium hover:opacity-80"
        style={{ backgroundColor: color.bgColor, color: color.textColor }}
      >
        {detail.projectTag}
      </Link>

      {detail.parentTeamActionHref ? (
        <Link
          href={detail.parentTeamActionHref}
          className="border-border text-muted-foreground hover:text-foreground rounded border px-2 py-0.5 text-[12px] leading-4 transition-colors"
        >
          {detail.originLabel}
        </Link>
      ) : (
        <span className="border-border text-muted-foreground rounded border px-2 py-0.5 text-[12px] leading-4">
          {detail.originLabel}
        </span>
      )}
    </div>
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
        <section className="border-border bg-card rounded-2xl border p-7">
          <div className="flex flex-col gap-3">
            {/* 제목은 h2 — 페이지의 h1은 PageHeader가 갖고 있다(§a11y: h1은 하나) */}
            <h2 className="text-[17px] leading-7 font-semibold tracking-[-0.3px]">
              {detail.title}
            </h2>
            <MetaLabels detail={detail} />
            <div className="text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] leading-4">
              <span className="flex items-center gap-1.5">
                <CalendarClock className="size-3.5" aria-hidden />
                <span className="translate-y-[1px] tabular-nums">{detail.schedule}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin className="size-3.5" aria-hidden />
                <span className="translate-y-[1px]">{detail.roomName}</span>
              </span>
            </div>
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
        </section>

        {/* 산출물 — 이 회의에서 하달된 액션(§2·§5) */}
        <section className="border-border bg-card overflow-hidden rounded-2xl border">
          <div className="flex items-baseline justify-between gap-3 px-7 pt-6 pb-3">
            <h2 className="flex items-center gap-2 text-[17px] leading-7 font-semibold tracking-[-0.3px]">
              <span className="bg-foreground size-2 rounded-full" aria-hidden />
              하달된 {detail.outputKindLabel}
            </h2>
            <p className="text-muted-foreground text-[12px] leading-4 tabular-nums">
              전체 {detail.outputs.length}건
            </p>
          </div>

          {detail.outputs.length === 0 ? (
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
            <h2 className="flex items-center gap-2 text-[17px] leading-7 font-semibold tracking-[-0.3px]">
              <span className="bg-foreground size-2 rounded-full" aria-hidden />
              발화 기록
            </h2>
            <p className="text-muted-foreground text-[12px] leading-4 tabular-nums">
              {detail.script.length}건
            </p>
          </div>

          {detail.script.length === 0 ? (
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
