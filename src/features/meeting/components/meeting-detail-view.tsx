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
    <div className="mx-auto grid w-full max-w-[1440px] grid-cols-1 gap-7 lg:grid-cols-[minmax(0,1fr)_360px]">
      {/* 주 컬럼 — 읽을 게 많은 것(§DESIGN 1) */}
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

          {/* 회의 안건 — 별도 섹션 유지(§3-2) */}
          <dl className="border-border mt-5 flex flex-col gap-2 border-t pt-5">
            {detail.topics.map((topic) => (
              <div key={`${topic.main}-${topic.sub}`} className="flex items-baseline gap-3">
                <dt className="text-muted-foreground w-24 shrink-0 truncate text-[12px] leading-5">
                  {topic.main}
                </dt>
                <dd className="text-[13px] leading-5">{topic.sub}</dd>
              </div>
            ))}
          </dl>
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
                    className="hover:bg-foreground/[0.04] flex items-center gap-4 px-7 py-3.5 transition-colors"
                  >
                    <StatusDot
                      tone={output.status}
                      label={ACTION_STATUS_LABEL[output.status]}
                      labelClassName="w-[42px] text-left"
                    />
                    <span className="min-w-0 flex-1 truncate text-[13px] leading-5">
                      {output.name}
                    </span>
                    <span className="text-muted-foreground w-24 shrink-0 truncate text-[12px] leading-4">
                      {output.assignee}
                    </span>
                    <span className="text-muted-foreground w-[88px] shrink-0 text-right text-[12px] leading-4 tabular-nums">
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
            <ul className="flex flex-col gap-4 px-7 pt-2 pb-7">
              {detail.script.map((chunk, index) => (
                <li key={`${chunk.at}-${index}`} className="flex items-baseline gap-3">
                  <span className="text-muted-foreground/70 w-12 shrink-0 text-[12px] leading-5 tabular-nums">
                    {chunk.at}
                  </span>
                  <p className="text-[13px] leading-5 break-keep">{chunk.text}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* 곁 컬럼 — 값 두어 개짜리(§DESIGN 1) */}
      <div className="flex flex-col gap-7">
        <section className="border-border bg-card h-fit rounded-2xl border">
          <div className="flex items-baseline justify-between gap-3 px-7 pt-6 pb-3">
            <h2 className="flex items-center gap-2 text-[17px] leading-7 font-semibold tracking-[-0.3px]">
              <span className="bg-foreground size-2 rounded-full" aria-hidden />
              참석자
            </h2>
            <p className="text-muted-foreground text-[12px] leading-4 tabular-nums">
              {detail.attendees.length}명
            </p>
          </div>

          <ul className="flex flex-col gap-2.5 px-7 pt-1 pb-6">
            {detail.attendees.map((attendee) => (
              <li key={attendee.id} className="flex items-center gap-2.5">
                <ProfileAvatar userId={attendee.id} size={28} />
                <span className="text-[13px] leading-5">{attendee.name}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
