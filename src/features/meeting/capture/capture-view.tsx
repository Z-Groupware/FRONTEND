"use client";

import { CircleAlert, Mic, Pause, Play, Square } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { LeaveGuard } from "@/components/common/leave-guard";
import { ProfileAvatar } from "@/components/common/profile-avatar";
import { Button } from "@/components/ui/button";
import { pickPaletteColor } from "@/lib/palette";
import { cn } from "@/lib/utils";

import type { CaptureAttendee, MeetingCaptureInfo } from "../view-types";
import { canSubmit, CAPTURE_PHASE, type CapturePhase, formatRecordedTime } from "./phase";
import type { LiveCaption } from "./types";
import { useCapture } from "./use-capture";
import { useLiveCaptions } from "./use-live-captions";

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
export function CaptureView({
  meeting,
  initialCaptions,
  viewerId,
}: {
  meeting: MeetingCaptureInfo;
  /** 구독 전 자막(CAP-12 백필) — 서버가 읽어 내려준다 */
  initialCaptions: LiveCaption[];
  /** 보고 있는 사람 — 되돌아온 내 자막을 걷어내는 데 쓴다 */
  viewerId: number;
}) {
  const capture = useCapture(meeting.id);
  /*
    ⚠️ **남의 자막은 따로 받는다.** 내 자막은 이 브라우저의 STT가 만들고(`capture.chunks`),
       남의 자막은 서버를 거쳐 온다 — 두 경로를 한 훅에 묶으면 마이크가 없는 참석자
       화면에서도 STT를 켜야 하는 모양이 된다.
    ⚠️ 합쳐서 **시각순으로 세운다.** 도착 순서대로 쌓으면 네트워크가 늦은 사람의 말이
       뒤에 붙어 대화가 뒤집힌다.
  */
  const remoteCaptions = useLiveCaptions(meeting.id, initialCaptions);

  /*
    ⚠️ **내 말은 남의 자막에서 걷어낸다.** BE는 보낸 사람을 빼지 않고 구독자 **전원**에게
       뿌린다(`CaptionStreamRegistry.broadcastToLocal`) — 안 걸러내면 내가 한 말이 두 번
       뜬다(내 STT가 만든 것 + 서버가 되돌려준 것).
    ⚠️ 합친 뒤 **`atMs`로 세운다.** 도착 순서대로 쌓으면 네트워크가 늦은 사람의 말이 뒤에
       붙어 대화가 뒤집히고, `at` 문자열로 세우면 한 시간을 넘길 때 순서가 깨진다.
  */
  const captionLines = useMemo(() => {
    const speakerById = new Map(meeting.attendees.map((a) => [a.id, a.name]));
    const mine = capture.chunks.map((chunk) => ({ ...chunk, speaker: null }));
    const others = remoteCaptions
      .filter((caption) => caption.personId !== viewerId)
      .map((caption) => ({
        id: caption.id,
        at: caption.at,
        atMs: caption.atMs,
        text: caption.text,
        /* 명단 밖 발화는 이름이 없다 — 자리를 비우지 말고 모르는 사람으로 말한다(§정직성) */
        speaker:
          caption.personId === null
            ? "알 수 없음"
            : (speakerById.get(caption.personId) ?? "알 수 없음"),
      }));
    return [...mine, ...others].sort((a, b) => a.atMs - b.atMs);
  }, [capture.chunks, remoteCaptions, meeting.attendees, viewerId]);
  const router = useRouter();
  const [isConfirming, setIsConfirming] = useState(false);

  const unsupported = !capture.support.stt || !capture.support.recording;
  const isRecording = capture.phase === CAPTURE_PHASE.RECORDING;
  const isPaused = capture.phase === CAPTURE_PHASE.PAUSED;

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
        <div className="mx-auto flex min-h-0 w-full max-w-[1440px] flex-1 flex-col gap-7">
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
              {/* ⚠️ `h2`다 — 페이지의 `h1`은 상단바(`MeetingHeader` → `PageHeader`)가 갖고 있다.
                  둘을 두면 한 화면에 h1이 두 개가 된다(CLAUDE.md §SEO: h1 1개). */}
              <h2 className="truncate pt-2 text-[17px] leading-7 font-semibold tracking-[-0.3px]">
                {meeting.title}
              </h2>
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

          {/*
            ⚠️ 곁 컬럼은 360 고정(DESIGN §1) — 반씩 나누면 자막 줄이 짧아져 눈이 헤맨다.
            ⚠️ **남는 높이를 여기가 다 먹는다**(`min-h-0 flex-1`). 그래야 자막 카드가 화면
               끝까지 자라고, 그 안에서만 스크롤이 생긴다.
          */}
          <div className="grid min-h-0 flex-1 grid-cols-1 gap-7 lg:grid-cols-[minmax(0,1fr)_360px]">
            <TranscriptCard
              chunks={captionLines}
              partial={capture.partial}
              isRecording={isRecording}
              isPaused={isPaused}
            />
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
          /*
            ⚠️ **세 줄을 비슷한 길이로 끊는다**(DESIGN §6). `요약은 백그라운드에서 진행되니
               목록으로 돌아가 다른 일을 하셔도 됩니다`(34자)는 창 폭(약 27자)을 넘겨
               `하셔도 / 됩니다`로 갈라졌다 — `<br />`은 넘치지 않을 때만 줄바꿈 자리를 정한다.
            ⚠️ "기다리지 않아도 된다"는 뜻은 **백그라운드**라는 낱말이 이미 담고 있다.
          */
          <>
            녹음이 끝나고 마지막 파일이 제출됩니다.
            <br />
            요약은 백그라운드에서 진행됩니다.
            <br />
            종료한 뒤에는 다시 녹음할 수 없습니다.
          </>
        }
        confirmLabel="종료"
        isDestructive
        mark="alert"
        onConfirm={() => {
          setIsConfirming(false);

          /*
            ⚠️ **끄는 일이 실패해도 화면은 넘어가야 한다.** `capture.end()`는 지금 로컬 정리다
               — 녹음기·STT를 멈추고 상태를 `ENDED`로 바꾼다. 그런데 `MediaRecorder.stop()`은
               상태가 어긋나면 던지고(`InvalidStateError`), 여기서 던지면 **토스트도 이동도
               안 일어난 채** 이미 닫힌 확인 창만 남는다 — 종료를 눌렀는데 아무 일도 안 난
               것처럼 보이고, 되돌릴 수 없는 동작이라 다시 누르지도 못한다.
            ⚠️ 그래서 잡고 넘어간다. 마이크 표시등이 남는 건 화면을 떠날 때 정리 효과가
               한 번 더 끈다(`use-capture`의 unmount 정리).
            ⚠️ **연동 때 여기가 갈린다.** 종료 알림 API(§3-3 4)가 붙으면 `end()`가 서버를
               부르게 되고, 그때는 **실패를 삼키면 안 된다** — 마지막 세그먼트가 확정되지
               않았는데 "요약을 시작했습니다"라고 말하게 된다. 그 시점에 이 자리를
               `try { await ... } catch { toast.error(...) }`로 바꾸고 이동을 막아야 한다.
          */
          try {
            capture.end();
          } catch {
            // 로컬 정리 실패는 사용자가 할 수 있는 일이 없다 — 흐름만 잇는다
          }

          /*
            ⚠️ **바로 목록으로 돌려보낸다**(팀 확정). 요약 API는 응답이 오래 걸려서 서버가
               백그라운드로 돌린다 — 여기서 기다리게 두면 아무것도 못 하는 화면을 몇 분씩
               쳐다보게 된다. 창을 닫아도 안전한 일이라 붙잡을 이유가 없다(§3-3 4).
            ⚠️ 토스트가 **"백그라운드"를 말한다**(팀 확정: 목록으로 보낸 뒤에 그렇게 전한다).
               옮겨 간 화면에서 처음 보는 말이 이거라, 여기서 안 하면 왜 목록으로 튕겼는지
               모른 채 요약을 기다리게 된다.
            ⚠️ 한 줄(220px)이라 글자 자리가 **184px**뿐이다(DESIGN §7) — 이 문구는 153px다.
               더 길게 쓰려면 잘린다.
          */
          toast.success("백그라운드에서 요약 중입니다");
          router.push("/app/meeting");
        }}
      />
    </>
  );
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
        {/* ⚠️ `h2`다 — 페이지의 `h1`은 상단바가 갖고 있다(§SEO: h1 1개) */}
        <h2 className="pt-3 text-[17px] leading-7 font-semibold tracking-[-0.3px] break-keep">
          {meeting.title}
        </h2>
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
  partial,
  isRecording,
  isPaused,
}: {
  chunks: { id: string; at: string; atMs: number; text: string; speaker: string | null }[];
  partial: string;
  isRecording: boolean;
  isPaused: boolean;
}) {
  const listRef = useRef<HTMLOListElement>(null);
  /** 바닥에 붙어 있는가 — **새 줄이 들어오기 전** 값이라야 판정이 맞다 */
  const isPinnedRef = useRef(true);

  /*
    ⚠️ **삽입 뒤에 거리를 재면 안 된다.** 새 문장이 이미 높이를 늘린 뒤라, 긴 문장 하나가
       들어오면 "멀어졌다"고 잘못 읽고 따라가지 않는다 — 그래서 스크롤할 때마다 미리 적어 둔다.
    ⚠️ 위로 올려 지난 말을 읽는 중이면 **끌어내리지 않는다.** 읽던 자리를 빼앗는 게 놓친
       한 줄보다 성가시다.
  */
  const handleScroll = () => {
    const list = listRef.current;
    if (!list) return;
    isPinnedRef.current = list.scrollHeight - list.scrollTop - list.clientHeight <= 80;
  };

  /*
    ⚠️ 흐린 줄(`partial`)이 자라도 같이 따라간다 — 말하는 동안 그 줄이 화면 밖으로 나가면
       인식되고 있는지 볼 수가 없다.
  */
  useEffect(() => {
    const list = listRef.current;
    if (!list || !isPinnedRef.current) return;
    list.scrollTop = list.scrollHeight;
  }, [chunks.length, partial]);

  return (
    <section className="border-border bg-card flex h-full min-h-0 min-w-0 flex-col overflow-hidden rounded-2xl border">
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

      {chunks.length === 0 && !partial ? (
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
        <ol
          ref={listRef}
          onScroll={handleScroll}
          className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-7 pb-6"
        >
          {/*
            ⚠️ **시간은 왼쪽 고정폭 홈통이다** — 상세 화면의 발화 기록과 같은 모양이다.
               같은 내용을 두 화면이 다르게 그리면 회의가 끝나는 순간 기록이 낯설어진다.
            ⚠️ 한때 줄마다 테두리 카드에 시각을 윗줄로 올렸는데, 한 문장이 90px를 먹어
               화면에 대여섯 줄밖에 안 들어왔다 — 실시간 자막은 **흐름이 보여야** 한다.
            ⚠️ `자동 인식` 꼬리표를 줄마다 붙이지 않는다. 모든 줄이 같은 값이라 아무것도
               구분하지 못하면서 자리만 먹었다 — 그 말은 카드 머리가 한 번 한다.
          */}
          {chunks.map((chunk) => (
            /*
              ⚠️ **한 문장이 옅은 박스 하나다.** 줄만 그어 두니 짧은 말("그대여")에서는 글자가
                 왼쪽 200px만 채우고 오른쪽 800px이 허옇게 비어, 화면 반쪽만 쓰는 것처럼
                 보였다 — 박스가 폭을 끝까지 채워 주면 그 빈 자리가 면으로 읽힌다.
              ⚠️ 시각은 박스 **안쪽 왼쪽 홈통**이다. 윗줄로 올리면 한 문장이 두 줄을 먹어
                 한 화면에 대여섯 개밖에 안 들어온다.
            */
            <li
              key={chunk.id}
              className="border-border bg-secondary/40 flex items-baseline gap-3.5 rounded-lg border px-4 py-2.5"
            >
              {/* 시각은 **참고값**이다 — 문장보다 한 단계 작고 옅게 둬서 눈이 글에 먼저 간다 */}
              <span className="text-muted-foreground/60 w-9 shrink-0 text-[11px] leading-5 tabular-nums">
                {chunk.at}
              </span>
              <p className="min-w-0 flex-1 text-[13px] leading-5 break-keep">
                {/*
                  ⚠️ **남이 한 말에만 이름을 붙인다.** 내 말에까지 달면 줄마다 같은 이름이
                     반복돼 아무것도 구분하지 못하면서 자리만 먹는다(`자동 인식` 꼬리표를
                     걷어낸 것과 같은 판단).
                  ⚠️ 이름은 **글 안에 이어 둔다.** 시각처럼 별도 홈통을 만들면 이름이 없는
                     내 줄에 빈 자리가 생겨 글이 들쭉날쭉해진다.
                */}
                {chunk.speaker && (
                  <span className="text-muted-foreground mr-1.5 font-medium">{chunk.speaker}</span>
                )}
                {chunk.text}
              </p>
            </li>
          ))}

          {/*
            아직 확정 전인 말.
            ⚠️ 확정된 줄과 **같은 홈통**에 두되 시각 자리는 비운다 — 아직 시각이 정해지지
               않았고, 확정되는 순간 그 자리에 채워지며 자연스럽게 이어진다.
            ⚠️ **기울임을 쓰지 않는다.** 한글 폰트는 이탤릭이 없어서 브라우저가 글자를 억지로
               기울이는데(가짜 기울임), 획이 뭉개져 깨진 글씨로 보인다 — 곧 뒤집힐 값이라는 건
               **옅은 색과 깜빡이는 점**이 말한다.
          */}
          {partial && (
            /*
              ⚠️ 확정된 줄과 **같은 박스**를 쓰되 테두리를 점선으로 둔다 — 자리는 같아서
                 확정되는 순간 매끄럽게 이어지고, 아직 굳지 않은 값이라는 건 선이 말한다.
            */
            <li className="border-border/70 flex items-baseline gap-3.5 rounded-lg border border-dashed px-4 py-2.5">
              {/*
                시각 자리에 **듣고 있다는 표시**를 둔다. 시각은 문장이 확정될 때 정해지므로
                아직 비어 있는데, 그냥 비워 두면 앞줄이 밀린 것처럼 보였다.
              */}
              <span className="flex w-9 shrink-0 items-center pt-2" aria-hidden>
                <span className="bg-foreground/40 size-1.5 animate-pulse rounded-full" />
              </span>
              <p className="text-muted-foreground min-w-0 flex-1 text-[13px] leading-5 break-keep">
                {partial}
              </p>
            </li>
          )}
        </ol>
      )}
    </section>
  );
}

/** 참가자 레일 — 이름 아래 소속, 진행자는 오른쪽에 표시 */
function AttendeeCard({ attendees }: { attendees: CaptureAttendee[] }) {
  return (
    <section className="border-border bg-card flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border">
      <div className="flex items-center justify-between gap-3 px-7 pt-6 pb-3">
        <h2 className="flex items-center gap-2 text-[17px] leading-7 font-semibold tracking-[-0.3px]">
          <span className="bg-foreground size-2 rounded-full" aria-hidden />
          참가자
        </h2>
        <span className="text-muted-foreground text-[12px] leading-4 tabular-nums">
          {attendees.length}명
        </span>
      </div>
      <ul className="flex min-h-0 flex-1 flex-col gap-3.5 overflow-y-auto px-7 pb-6">
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
