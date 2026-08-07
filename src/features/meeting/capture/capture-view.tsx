"use client";

import { CircleAlert, Mic, Pause, Play, Square } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { LeaveGuard } from "@/components/common/leave-guard";
import { ProfileAvatar } from "@/components/common/profile-avatar";
import { Button } from "@/components/ui/button";
import { pickPaletteColor } from "@/lib/palette";
import { cn } from "@/lib/utils";

import type { CaptureAttendee, MeetingCaptureInfo } from "../view-types";
import { canSubmit, CAPTURE_PHASE, type CapturePhase, formatRecordedTime } from "./phase";
import { useCapture } from "./use-capture";

/**
 * 캡처 화면 — **Host 전용**(WORKFLOW §3-3). 한 화면이 다섯 자리를 지난다:
 * 입장 전 → 입장 후 → 녹음 중 → 일시정지 → 종료.
 *
 * ⚠️ **버튼은 2계열이다**(§3-3). [녹음 시작]이 [일시정지]/[재개] 토글로 바뀌고,
 *    [회의 종료 및 제출]은 녹음을 시작해야 열린다. 셋을 나란히 늘어놓지 않는다.
 * ⚠️ **조작은 상단바가 아니라 카드 안에 둔다**(DESIGN §1). 시안은 앱 상단바에 버튼을
 *    얹었지만 우리 셸의 상단바는 제목 줄이라, 화면마다 버튼이 붙었다 말았다 하면 그 줄이
 *    무엇을 하는 자리인지 흔들린다 — 대신 **본문 첫 카드**를 조작 줄로 쓴다.
 * ⚠️ **일시정지(보조)와 종료(위험)를 눈으로 갈라 둔다**(§3-3 종료 정책).
 * ⚠️ 알림은 셋을 갈라 쓴다(DESIGN §7): 종료는 **확인 창**(되돌릴 수 없다),
 *    제출·요약 완료는 **토스트**(알리기만 하면 된다), 마이크·자막 실패는 **화면에 남기는
 *    인라인 오류**(토스트는 사라지는데 그건 놓치면 회의가 통째로 빈다).
 * ⚠️ 타이핑 메모는 없다(§3-3 폐기). 참석자용 레이아웃도 없다.
 */
export function CaptureView({ meeting }: { meeting: MeetingCaptureInfo }) {
  const capture = useCapture();
  const [isConfirming, setIsConfirming] = useState(false);

  const unsupported = !capture.support.stt || !capture.support.recording;
  const isRecording = capture.phase === CAPTURE_PHASE.RECORDING;
  const isPaused = capture.phase === CAPTURE_PHASE.PAUSED;
  const isEnded = capture.phase === CAPTURE_PHASE.ENDED;

  /*
    ⚠️ **녹음 중에 창을 닫으려 하면 붙잡는다**(공용 `LeaveGuard`). 지금 녹음은 브라우저 안에만
       있어서 탭을 닫으면 통째로 사라진다 — 온보딩이 `sessionStorage`를 지키는 것과 같은 이유다.
    ⚠️ 종료한 뒤에는 안 붙잡는다. 제출이 끝나 잃을 게 없다.
  */
  const hasUnsaved = isRecording || isPaused;

  return (
    <>
      <LeaveGuard hasUnsaved={hasUnsaved} />

      {capture.phase === CAPTURE_PHASE.BEFORE_ENTER ? (
        <EnterCard meeting={meeting} support={capture.support} onEnter={capture.enter} />
      ) : (
        <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-7">
          {/*
            조작 줄 — **무슨 회의인지 · 얼마나 녹음했는지 · 무엇을 할 수 있는지**가 한 줄에 선다.
            ⚠️ 왼쪽은 정보, 오른쪽은 조작으로 축을 가른다(DESIGN §3: 열마다 축이 따로 선다).
               타이머는 `tabular-nums`라 숫자가 바뀌어도 옆의 버튼이 안 밀린다.
          */}
          <section className="border-border bg-card flex flex-wrap items-center gap-x-6 gap-y-4 rounded-2xl border p-7">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <ProjectTag tag={meeting.projectTag} />
                <PhaseBadge phase={capture.phase} />
              </div>
              <h1 className="truncate pt-2 text-[17px] leading-7 font-semibold tracking-[-0.3px]">
                {meeting.title}
              </h1>
              <p className="text-muted-foreground pt-0.5 text-[12px] leading-4">
                {meeting.schedule} · {meeting.roomName}
              </p>
            </div>

            {/* 실제 녹음 누적 — 일시정지는 빠진다(§3-3) */}
            <div className="shrink-0 text-right">
              <p className="text-[30px] leading-9 font-semibold tracking-[-0.8px] tabular-nums">
                {formatRecordedTime(capture.recordedMs)}
              </p>
              <p className="text-muted-foreground text-[11px] leading-4">일시정지 시간 제외</p>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              {isEnded ? (
                /* ⚠️ 토스트는 사라진다 — 끝났다는 사실은 화면에도 남긴다(DESIGN §7) */
                <p className="text-muted-foreground text-[13px] leading-5">
                  회의를 종료하고 제출했습니다.
                </p>
              ) : (
                <>
                  {capture.phase === CAPTURE_PHASE.READY ? (
                    <Button
                      type="button"
                      variant="ink"
                      className="h-10 px-4 text-[13px]"
                      disabled={unsupported}
                      onClick={() => void capture.start()}
                    >
                      <Mic className="size-4" aria-hidden />
                      {/* 아이콘 옆 한글은 1px 내린다(DESIGN §5) */}
                      <span className="translate-y-[1px]">녹음 시작</span>
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      className="h-10 px-4 text-[13px]"
                      onClick={isPaused ? capture.resume : capture.pause}
                    >
                      {isPaused ? (
                        <Play className="size-4" aria-hidden />
                      ) : (
                        <Pause className="size-4" aria-hidden />
                      )}
                      <span className="translate-y-[1px]">{isPaused ? "재개" : "일시정지"}</span>
                    </Button>
                  )}

                  <Button
                    type="button"
                    variant="destructive"
                    className="border-destructive/40 h-10 border px-4 text-[13px]"
                    disabled={!canSubmit(capture.phase)}
                    onClick={() => setIsConfirming(true)}
                  >
                    <Square className="size-3.5" aria-hidden />
                    <span className="translate-y-[1px]">회의 종료 및 제출</span>
                  </Button>
                </>
              )}
            </div>
          </section>

          {unsupported && <UnsupportedNotice support={capture.support} />}

          {/*
            ⚠️ 마이크·자막 실패는 **화면에 남긴다.** 토스트로만 알리면 자리를 비운 사이에
               사라져서, 아무것도 안 담긴 채로 회의가 끝난다(DESIGN §7: 놓치면 안 되는 건 화면에).
          */}
          {capture.error && (
            <p
              role="alert"
              className="border-destructive/30 bg-destructive/5 text-destructive flex items-start gap-2 rounded-lg border px-3.5 py-3 text-[12px] leading-[18px] break-keep"
            >
              <span className="flex h-[18px] shrink-0 items-center">
                <CircleAlert className="size-3.5" aria-hidden />
              </span>
              <span>{capture.error}</span>
            </p>
          )}

          {/* ⚠️ 곁 컬럼은 360 고정(DESIGN §1) — 반씩 나누면 자막 줄이 짧아져 눈이 헤맨다 */}
          <div className="grid grid-cols-1 gap-7 lg:grid-cols-[minmax(0,1fr)_360px]">
            <TranscriptCard chunks={capture.chunks} isRecording={isRecording} isPaused={isPaused} />
            <AttendeeCard attendees={meeting.attendees} />
          </div>
        </div>
      )}

      {/*
        ⚠️ 종료는 되돌릴 수 없다 — **무엇을 잃는지** 적고 한 번 더 받는다(DESIGN §7).
           §3-3의 확인 문구를 우리 카피 규칙(~합니다체 · 제목은 물음)에 맞춰 옮겼다.
        ⚠️ `cancelLabel`은 안 넘긴다 — 기본값 `취소`를 쓴다(DESIGN §7).
      */}
      <ConfirmDialog
        isOpen={isConfirming}
        onOpenChange={() => setIsConfirming(false)}
        title="회의를 종료하고 요약을 진행할까요?"
        description={
          <>
            녹음이 끝나고 마지막 파일이 제출됩니다. 이어서 요약이 시작됩니다.
            <br />
            종료한 뒤에는 다시 녹음할 수 없습니다.
          </>
        }
        confirmLabel="종료"
        isDestructive
        mark="alert"
        onConfirm={() => {
          setIsConfirming(false);
          capture.end();
        }}
      />

      {isEnded && <SummaryToasts meetingId={meeting.id} />}
    </>
  );
}

/**
 * 종료 뒤 알림 — **토스트 둘**(WORKFLOW §3-3 5~6, 시안도 토스트다).
 *
 * ⚠️ 창으로 막지 않는다. §3-3이 "다른 작업을 하셔도 된다"고 못박은 자리다 — AI 분석은
 *    프론트가 부르는 게 아니라 서버가 종료 처리 안에서 큐에 걸고 실패해도 재시도한다.
 *    모달로 붙잡으면 안 해도 될 기다림을 만든다.
 * ⚠️ 토스트는 **한 줄**이다(DESIGN §7). 문장이 아니라 결과 한 조각만 적는다.
 * ⚠️ 진행 단계는 3단계로 뭉쳐 있다(§3-3 5) — 계층 정보는 화면에 안 내보낸다.
 */
function SummaryToasts({ meetingId }: { meetingId: string }) {
  useEffect(() => {
    toast.success("회의를 제출했습니다");

    /*
      ⚠️ **목이다.** 실제로는 `/processing-status`를 폴링해야 한다(§3-3 5).
         지금은 붙일 서버가 없어 시간으로 흉내만 낸다 — 되는 척하지 않도록 문구에도
         "목"이라고 적는다(CLAUDE.md §AI 기능: 목이면 명시).
    */
    // TODO(BE 협의): `GET /meetings/{id}/processing-status` 폴링으로 바꾼다
    const timer = window.setTimeout(() => {
      toast.success("요약이 끝났습니다 (목)");
    }, 4_000);

    return () => window.clearTimeout(timer);
  }, [meetingId]);

  return null;
}

/**
 * 입장 전 — 가운데 한 장(DESIGN §4 폭: 확인 화면 560).
 *
 * ⚠️ 들어가기 전에 **무엇이 시작되고 무엇이 아직 아닌지** 적는다. 버튼만 두면 누르는 순간
 *    마이크 권한 창이 떠서, 무슨 일인지 모른 채 거부하게 된다.
 */
function EnterCard({
  meeting,
  support,
  onEnter,
}: {
  meeting: MeetingCaptureInfo;
  support: { stt: boolean; recording: boolean };
  onEnter: () => void;
}) {
  const unsupported = !support.stt || !support.recording;

  return (
    <div className="mx-auto flex w-full max-w-[560px] flex-col justify-center py-16">
      <section className="border-border bg-card rounded-2xl border p-7 text-center">
        <ProjectTag tag={meeting.projectTag} className="mx-auto" />
        <h1 className="pt-3 text-[17px] leading-7 font-semibold tracking-[-0.3px] break-keep">
          {meeting.title}
        </h1>
        <p className="text-muted-foreground pt-1.5 text-[13px] leading-5">
          {meeting.schedule} · {meeting.roomName}
        </p>

        {/* 참석자 — 얼굴을 겹쳐 두고 수를 적는다. 아바타 색은 사람마다 고정이다(DESIGN §5) */}
        <div className="flex items-center justify-center gap-2 pt-5">
          <span className="flex -space-x-2">
            {meeting.attendees.map((attendee) => (
              <span key={attendee.id} className="ring-card rounded-full ring-2">
                <ProfileAvatar userId={attendee.id} size={28} />
              </span>
            ))}
          </span>
          <span className="text-muted-foreground text-[12px] leading-4 tabular-nums">
            {meeting.attendees.length}명 참석
          </span>
        </div>

        {unsupported && <UnsupportedNotice support={support} className="mt-6" />}

        <Button
          type="button"
          variant="ink"
          className="mt-6 h-11 w-full text-[14px]"
          onClick={onEnter}
        >
          입장
        </Button>
        <p className="text-muted-foreground pt-2 text-[11px] leading-4 break-keep">
          입장해도 녹음은 시작되지 않습니다. 회의 화면에서 [녹음 시작]을 눌러 주세요.
        </p>
      </section>
    </div>
  );
}

/** 실시간 자막 — 화자 구분 없이 청크 단위다(§3-2) */
function TranscriptCard({
  chunks,
  isRecording,
  isPaused,
}: {
  chunks: { id: string; at: string; text: string }[];
  isRecording: boolean;
  isPaused: boolean;
}) {
  return (
    <section className="border-border bg-card flex min-h-[440px] min-w-0 flex-col rounded-2xl border">
      <div className="flex items-center justify-between gap-3 px-7 pt-6 pb-3">
        <h2 className="flex min-w-0 items-center gap-2 text-[17px] leading-7 font-semibold tracking-[-0.3px]">
          {/*
            ⚠️ 도는 중일 때만 점이 산다. **색이 아니라 깜빡임**으로 알린다 —
               색으로 알리는 건 에러뿐이다(DESIGN §5).
          */}
          <span
            className={cn(
              "size-2 shrink-0 rounded-full",
              isRecording ? "bg-foreground animate-pulse" : "bg-foreground/30",
            )}
            aria-hidden
          />
          실시간 자막
          <span className="text-muted-foreground truncate text-[12px] leading-4 font-normal">
            {isRecording ? "인식 중" : isPaused ? "멈춤" : "녹음 시작 후 표시됩니다"}
          </span>
        </h2>
        <span className="text-muted-foreground shrink-0 text-[12px] leading-4 tabular-nums">
          {chunks.length}건
        </span>
      </div>

      {chunks.length === 0 ? (
        /* 빈 상태 — 왜 비었는지, 무엇을 하면 되는지 말한다(DESIGN §8) */
        <div className="flex flex-1 flex-col items-center justify-center gap-2 px-7 pb-12 text-center">
          <Mic className="text-muted-foreground/50 size-6" aria-hidden />
          <p className="text-[13px] leading-5 break-keep">
            녹음을 시작하면 실시간 자막이 표시됩니다
          </p>
          <p className="text-muted-foreground text-[12px] leading-4 break-keep">
            문장 단위로 기록됩니다
          </p>
        </div>
      ) : (
        <ol className="flex flex-1 flex-col gap-2.5 px-7 pb-6">
          {chunks.map((chunk) => (
            <li
              key={chunk.id}
              className="border-border bg-secondary/40 rounded-lg border px-4 py-3"
            >
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-muted-foreground text-[11px] leading-4 tabular-nums">
                  {chunk.at}
                </span>
                {/* AI가 아니라 브라우저 받아쓰기다 — "AI"라고 쓰지 않는다(CLAUDE.md §AI 기능) */}
                <span className="text-muted-foreground/70 shrink-0 text-[11px] leading-4">
                  자동 인식
                </span>
              </div>
              <p className="pt-1 text-[13px] leading-5 break-keep">{chunk.text}</p>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

/** 참가자 레일 — 이름 아래 소속, 진행자는 오른쪽에 표시 */
function AttendeeCard({ attendees }: { attendees: CaptureAttendee[] }) {
  return (
    <section className="border-border bg-card h-fit rounded-2xl border">
      <div className="flex items-center justify-between gap-3 px-7 pt-6 pb-3">
        <h2 className="flex items-center gap-2 text-[17px] leading-7 font-semibold tracking-[-0.3px]">
          <span className="bg-foreground size-2 rounded-full" aria-hidden />
          참가자
        </h2>
        <span className="text-muted-foreground text-[12px] leading-4 tabular-nums">
          {attendees.length}명
        </span>
      </div>
      <ul className="flex flex-col gap-3.5 px-7 pb-6">
        {attendees.map((attendee) => (
          <li key={attendee.id} className="flex items-center gap-2.5">
            <ProfileAvatar userId={attendee.id} size={32} />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13px] leading-5">{attendee.name}</span>
              {attendee.subtitle && (
                <span className="text-muted-foreground block truncate text-[11px] leading-4">
                  {attendee.subtitle}
                </span>
              )}
            </span>
            {attendee.isHost && (
              <span className="border-border text-muted-foreground shrink-0 rounded border px-1.5 py-0.5 text-[11px] leading-4">
                진행
              </span>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

/**
 * 프로젝트 태그 칩 — 색은 `pickPaletteColor`가 정한다(DESIGN §5).
 * ⚠️ 배경과 글자를 **같은 벌**에서 꺼낸다. 다른 벌을 섞으면 대비가 무너진다.
 */
function ProjectTag({ tag, className }: { tag: string; className?: string }) {
  const color = pickPaletteColor(tag);
  return (
    <span
      className={cn(
        "inline-flex w-fit shrink-0 items-center rounded px-1.5 py-0.5 text-[11px] leading-none font-medium",
        className,
      )}
      style={{ backgroundColor: color.bgColor, color: color.textColor }}
    >
      {tag}
    </span>
  );
}

/** 지금 무슨 상태인지 — 색이 아니라 **명도**로 가른다(DESIGN §5) */
function PhaseBadge({ phase }: { phase: CapturePhase }) {
  const LABEL: Record<CapturePhase, string> = {
    BEFORE_ENTER: "대기",
    READY: "대기",
    RECORDING: "녹음 중",
    PAUSED: "일시정지",
    ENDED: "종료됨",
  };

  return (
    <span
      className={cn(
        "shrink-0 rounded border px-2 py-0.5 text-[11px] leading-4",
        phase === CAPTURE_PHASE.RECORDING
          ? "border-foreground/35 bg-foreground/[0.06] text-foreground font-medium"
          : "border-border text-muted-foreground",
      )}
    >
      {LABEL[phase]}
    </span>
  );
}

/**
 * 미지원 브라우저 안내 — **조용히 안 되는 척하지 않는다**(CLAUDE.md §브라우저 API).
 * ⚠️ 무엇이 안 되는지 갈라 적는다. "지원하지 않습니다" 한 줄이면 녹음이 안 되는지 자막이
 *    안 되는지 알 수 없어서, 회의를 그냥 진행했다가 기록이 통째로 빈다.
 */
function UnsupportedNotice({
  support,
  className,
}: {
  support: { stt: boolean; recording: boolean };
  className?: string;
}) {
  const missing = [!support.recording && "녹음", !support.stt && "자막"].filter(Boolean).join("·");

  return (
    <p
      className={cn(
        "border-destructive/30 bg-destructive/5 flex items-start gap-2 rounded-lg border px-3.5 py-3 text-left text-[12px] leading-[18px] break-keep",
        className,
      )}
    >
      <span className="flex h-[18px] shrink-0 items-center">
        <CircleAlert className="text-destructive size-3.5" aria-hidden />
      </span>
      <span>
        이 브라우저에서는 <b>{missing}</b>이 동작하지 않습니다. Chrome 계열 브라우저에서 다시 열어
        주세요.
      </span>
    </p>
  );
}
