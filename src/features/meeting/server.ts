import "server-only";

import { AI_SUMMARY_STATUS, MEETING_STATUS } from "@/constants/meeting";
import { PERSONAL_ACTION_DETAIL_MOCK } from "@/features/action/mock/action-detail";
import { requireAccessToken } from "@/features/auth/session";
import { listMockManagedMembers } from "@/features/member/mock/managed";
import { PROJECT_TEAM_ACTIONS_MOCK } from "@/features/project/mock/team-actions";
import { ApiError, serverApi } from "@/lib/api";
import { ep } from "@/lib/endpoints";
import {
  type Actor,
  canCaptureMeeting,
  canOperateMeeting,
  canViewMeetingDetail,
} from "@/lib/permission";
import { isMock } from "@/mocks/config";

import { formatMeetingSchedule, meetingListRange } from "./lib";
import {
  type BeMeetingListItem,
  hostIdOf,
  isClosed,
  parseMeetingDetail,
  parseMeetingList,
  toMeetingCaptureInfo,
  toMeetingDetailView,
  toMeetingListItem,
} from "./mapper";
import { findMockMeeting, listMockMeetings } from "./mock/meetings";
import { ensureMockMeetingsSeeded, findMockMeetingExtras } from "./mock/seed";
import { findMockMeetingReview } from "./review/mock/review";
import { meetingStatusOf } from "./status";
import type { Meeting } from "./types";
import type {
  MeetingAgenda,
  MeetingCaptureResult,
  MeetingContentPending,
  MeetingDetailResult,
  MeetingDirectory,
  MeetingListItem,
  MeetingOutput,
} from "./view-types";

/**
 * 회의 조회 — **격리막**(CLAUDE.md §Mock 격리막).
 *
 * ⚠️ 컴포넌트는 `view-types`만 본다. 연동되면 여기 `isMock` 분기만 실서버 호출로 바꾸고
 *    매퍼가 shape을 흡수한다 — 화면은 안 바뀐다.
 * ⚠️ 산출물·참석자 이름은 다른 도메인의 목을 **id로 참조**해 조립한다(복사해 두면 두 벌이
 *    어긋난다). 예약 쪽도 같은 방식이다(`rooms/actions.ts` → `TOP_LEVEL_PROJECTS`).
 * ⚠️ 조회 전용이다 — 녹음·종료처럼 바꾸는 일은 캡처 화면이 브라우저에서 하고, 서버로 보내는
 *    자리는 아직 BE 협의 전이라 `TODO`로 비워 두었다.
 */

/** Owner 개설 회의의 소속 라벨(WORKFLOW §2) — 옛 문구 "프로젝트 공통"은 폐기됐다 */
const OWNER_ORIGIN_LABEL = "Owner 개설";

/** 팀 액션 회의의 라벨 — 상위 팀 액션 이름. 목이 어긋나 못 찾으면 팀 액션임은 알린다 */
function originLabelOf(meeting: Meeting): string {
  if (meeting.hostAuthority === "OWNER") return OWNER_ORIGIN_LABEL;

  const parent = (PROJECT_TEAM_ACTIONS_MOCK[meeting.projectTag] ?? []).find(
    (action) => action.id === meeting.parentTeamActionId,
  );
  return parent ? parent.name : "팀 액션 회의";
}

/**
 * 목 안건(쌍 목록) → 화면 계약(`MeetingAgenda` — 대주제 하나 + 소주제 목록).
 *
 * ⚠️ **BE가 하는 것과 같은 방식으로 접는다**(BE PR #461 `resolveAgenda` — 대주제는
 *    `findFirst`, 소주제는 전부). 목만 쌍을 그대로 보여 주면 실서버로 넘어가는 날 상세의
 *    안건 칸이 조용히 줄어든다 — 목은 실서버가 내줄 모양을 미리 보여야 한다(§정직한 목업).
 */
function toMockAgenda(topics: Meeting["topics"]): MeetingAgenda {
  return { main: topics[0].main, subs: topics.map((topic) => topic.sub) };
}

function toListItem(meeting: Meeting, viewerId: number, now: Date): MeetingListItem {
  const firstTopic = meeting.topics[0];

  return {
    id: meeting.id,
    title: meeting.title,
    status: meetingStatusOf(meeting, now),
    projectTag: meeting.projectTag,
    originLabel: originLabelOf(meeting),
    topicSummary: `${firstTopic.main} · ${firstTopic.sub}`,
    schedule: formatMeetingSchedule(meeting.start, meeting.end),
    roomName: meeting.roomName,
    attendeeCount: meeting.attendeeIds.length,
    isHost: meeting.hostId === viewerId,
    aiSummaryStatus: meeting.aiSummaryStatus,
  };
}

/**
 * 목록 — 탭 두 개를 한 번에 만든다(WORKFLOW §3-2).
 *
 * ⚠️ **목록은 전 구성원 공개**다(§3-2-1) — 여기서 권한으로 거르지 않는다. 막는 건 상세다.
 * ⚠️ 차례: 진행중 → 예정(가까운 순) → 완료(최근 순). 지금 다뤄야 하는 회의가 위로 온다.
 */
export async function getMeetingDirectory(viewerId: number): Promise<MeetingDirectory> {
  if (!isMock) return getLiveMeetingDirectory();

  ensureMockMeetingsSeeded();
  const now = new Date();
  const byId = new Map(listMockMeetings().map((meeting) => [meeting.id, meeting]));
  const rows = listMockMeetings().map((meeting) => ({
    item: toListItem(meeting, viewerId, now),
    startMs: meeting.start.getTime(),
  }));
  const items = sortMeetingListItems(rows);

  return {
    hosted: items.filter((item) => item.isHost),
    invited: items.filter((item) => {
      if (item.isHost) return false;
      const meeting = byId.get(item.id);
      return meeting !== undefined && meeting.attendeeIds.includes(viewerId);
    }),
  };
}

/**
 * 목록 차례 — **지금 다뤄야 하는 회의가 위로 온다**(WORKFLOW §3-2).
 *
 * ⚠️ **목·실서버가 같은 함수를 쓴다.** 정렬이 두 벌이면 같은 회의가 경로마다 다른 자리에
 *    서고, 그건 화면을 눌러 보는 것만으로는 안 드러난다(§격리막과 같은 이유).
 * ⚠️ 시각은 항목이 아니라 **원본**에서 받는다 — `schedule`은 이미 사람이 읽는 문자열이라
 *    거기서 시각을 되파면 표기가 바뀔 때마다 정렬이 조용히 틀어진다.
 */
const STATUS_RANK = {
  [MEETING_STATUS.IN_PROGRESS]: 0,
  [MEETING_STATUS.SCHEDULED]: 1,
  [MEETING_STATUS.DONE]: 2,
  // ⚠️ 취소는 맨 뒤다(MEET-06) — 더 볼 일 없는 회의 중에서도 가장 뒤로 물러난다.
  [MEETING_STATUS.CANCELED]: 3,
} as const;

function sortMeetingListItems(
  rows: { item: MeetingListItem; startMs: number }[],
): MeetingListItem[] {
  return [...rows]
    .sort((a, b) => {
      const rankGap = STATUS_RANK[a.item.status] - STATUS_RANK[b.item.status];
      if (rankGap !== 0) return rankGap;
      // 예정·진행중은 가까운 회의부터, 완료·취소는 최근 회의부터
      return a.item.status === MEETING_STATUS.SCHEDULED ||
        a.item.status === MEETING_STATUS.IN_PROGRESS
        ? a.startMs - b.startMs
        : b.startMs - a.startMs;
    })
    .map((row) => row.item);
}

/**
 * 목록 — 실서버(MEET-02).
 *
 * ⚠️ **탭을 서버가 가른다**(`scope=HOSTED`·`ATTENDING`). 전부 받아 와서 `isHost`로 나누면
 *    같은 회의를 두 번 실어 나르고, 페이지가 잘릴 때 한쪽 탭만 조용히 비어 버린다 —
 *    BE가 `ATTENDING`에서 host를 이미 빼 준다(BE `MeetingListScope`).
 * ⚠️ **`from`·`to`를 반드시 싣는다.** 서버 기본이 `오늘-3개월 ~ 오늘`이라 생략하면 **예정
 *    회의가 통째로 빠진다**(§endpoints `MeetingListParams`) — 이 화면의 첫 줄이 예정 회의다.
 * ⚠️ **무한 스크롤은 이 이슈에서 안 만든다**(범위 밖). 대신 한 페이지를 BE 상한(100)까지
 *    받아 첫 화면이 20건에서 잘리지 않게 한다 — 그보다 많으면 뒤가 안 보인다(CLAUDE.md
 *    §목록의 스크롤 트리거를 붙일 때 이 상수를 지우고 `page`를 이어 붙인다).
 * ⚠️ 두 탭을 **같이 부른다**(`Promise.all`). 차례로 부르면 화면이 두 번 기다린다.
 */
const MEETING_LIST_PAGE_SIZE = 100;

async function getLiveMeetingDirectory(): Promise<MeetingDirectory> {
  const accessToken = await requireAccessToken();
  const { from, to } = meetingListRange(new Date());

  const query = { from, to, page: 0, size: MEETING_LIST_PAGE_SIZE } as const;
  const [hosted, invited] = await Promise.all([
    serverApi<unknown>(ep.meetings({ ...query, scope: "HOSTED" }), { accessToken }),
    serverApi<unknown>(ep.meetings({ ...query, scope: "ATTENDING" }), { accessToken }),
  ]);

  return {
    hosted: toSortedListItems(parseMeetingList(hosted)),
    invited: toSortedListItems(parseMeetingList(invited)),
  };
}

function toSortedListItems(meetings: BeMeetingListItem[]): MeetingListItem[] {
  return sortMeetingListItems(
    meetings.map((meeting) => ({
      item: toMeetingListItem(meeting),
      startMs: new Date(meeting.startAt).getTime(),
    })),
  );
}

/** 산출물 조립 — 회의 종류에 따라 팀 액션(§2) 또는 개인 액션(§5)이다 */
function outputsOf(meeting: Meeting): { kindLabel: string; outputs: MeetingOutput[] } {
  const extrasFound = findMockMeetingExtras(meeting.id);

  if (meeting.hostAuthority === "OWNER") {
    const pool = PROJECT_TEAM_ACTIONS_MOCK[meeting.projectTag] ?? [];
    const outputs = (extrasFound?.outputTeamActionIds ?? [])
      .map((id) => pool.find((action) => action.id === id))
      .filter((action) => action !== undefined)
      .map((action) => ({
        id: action.id,
        name: action.name,
        assignee: action.team,
        status: action.status,
        dueDate: action.dueDate,
        href: `/app/projects/${meeting.projectId}/team/${action.id}`,
      }));
    return { kindLabel: "팀 액션", outputs };
  }

  /*
    이름·담당자는 `action` 목에서 id로 찾고, 상태·마감일은 시드가 든다 — 그 두 값은
    `PersonalActionDetail`에 저장돼 있지 않다(§seed).
  */
  const outputs = (extrasFound?.outputPersonalActions ?? [])
    .map((ref) => ({ ref, action: PERSONAL_ACTION_DETAIL_MOCK[ref.id] }))
    .filter(
      (pair): pair is { ref: (typeof pair)["ref"]; action: NonNullable<(typeof pair)["action"]> } =>
        pair.action !== undefined,
    )
    .map(({ ref, action }) => ({
      id: action.id,
      name: action.name,
      assignee: action.assigneeName,
      status: ref.status,
      dueDate: ref.dueDate,
      href: `/app/actions/${action.id}`,
    }));
  return { kindLabel: "개인 액션", outputs };
}

/**
 * 상세 — **완료 회의만** 연다(§3-2). 못 여는 이유를 값으로 돌려준다(§view-types).
 *
 * ⚠️ 권한 판정은 `canViewMeetingDetail` **그대로**다(§3-2-1) — 새 판정을 만들지 않는다.
 *    잠금은 에러가 아니라서 목록 카드(메타)는 계속 보인다.
 */
export async function getMeetingDetail(id: string, viewer: Actor): Promise<MeetingDetailResult> {
  if (!isMock) return getLiveMeetingDetail(id, viewer);

  ensureMockMeetingsSeeded();
  const meeting = findMockMeeting(id);
  if (!meeting) return { kind: "notFound" };

  const canView = canViewMeetingDetail(viewer, {
    isOwnerHosted: meeting.hostAuthority === "OWNER",
    attendeeIds: meeting.attendeeIds,
    hostTeamId: meeting.hostTeamId,
  });
  if (!canView) return { kind: "locked", title: meeting.title };

  /*
    ⚠️ **아직 안 끝났다고 화면을 막지 않는다**(2026-08-10 팀 협의). 예정·진행중 회의도
       시간·장소·참석자·안건은 이미 정해진 값이다 — 없는 건 회의가 남기는 것(기록·산출물)뿐이라
       그 두 칸만 안내로 채운다(§view-types `MeetingContentPending`).
    ⚠️ 순서가 있다. 회의가 안 끝났으면 요약은 시작조차 안 했으므로 회의 상태를 먼저 본다.
  */
  const status = meetingStatusOf(meeting, new Date());
  const pendingReason: MeetingContentPending | null =
    status === MEETING_STATUS.CANCELED
      ? "CANCELED"
      : status === MEETING_STATUS.SCHEDULED
        ? "SCHEDULED"
        : status === MEETING_STATUS.IN_PROGRESS
          ? "IN_PROGRESS"
          : meeting.aiSummaryStatus === AI_SUMMARY_STATUS.PENDING ||
              meeting.aiSummaryStatus === AI_SUMMARY_STATUS.SUMMARIZING
            ? "SUMMARIZING"
            : meeting.aiSummaryStatus === AI_SUMMARY_STATUS.FAILED
              ? "FAILED"
              : null;

  /*
    참석자 이름은 사원 명부에서 id로 찾는다 — 같은 사람이 화면마다 같은 이름·같은 아바타 색이
    되려면 명부가 하나여야 한다(§구성원과 같은 이유). 명부에 없는 id는 조용히 숨기지 않고
    "알 수 없음"으로 남긴다(§정직성).
  */
  const roster = new Map(listMockManagedMembers().map((member) => [member.id, member.name]));
  const { kindLabel, outputs } = outputsOf(meeting);

  /*
    ⚠️ 검토 대기·중단은 **산출물 칸만의 사정**이다(회의 안 끝남·요약 중과는 다른 축) — 요약이
       끝났는데도(REVIEWED) Host가 [액션 분배 확정]을 안 눌렀거나, 요약 자체가 서버 문제로
       중단됐을 때(FAILED + isStalled) 산출물 칸이 왜 비었는지 갈라 보여준다(§view-types).
  */
  const review =
    meeting.aiSummaryStatus === AI_SUMMARY_STATUS.REVIEWED
      ? findMockMeetingReview(meeting.id)
      : null;
  const pendingActionCount = review && !review.actionsConfirmed ? review.drafts.length : 0;
  const isStalled =
    pendingReason === "FAILED" ? (findMockMeetingExtras(meeting.id)?.isStalled ?? false) : false;

  return {
    kind: "ok",
    detail: {
      id: meeting.id,
      title: meeting.title,
      projectId: meeting.projectId,
      projectTag: meeting.projectTag,
      originLabel: originLabelOf(meeting),
      parentTeamActionHref:
        meeting.hostAuthority === "OWNER"
          ? null
          : `/app/projects/${meeting.projectId}/team/${meeting.parentTeamActionId}`,
      agenda: toMockAgenda(meeting.topics),
      schedule: formatMeetingSchedule(meeting.start, meeting.end),
      roomName: meeting.roomName,
      attendees: meeting.attendeeIds.map((attendeeId) => ({
        id: attendeeId,
        name: roster.get(attendeeId) ?? "알 수 없음",
      })),
      outputKindLabel: kindLabel,
      outputs,
      script: findMockMeetingExtras(meeting.id)?.script ?? [],
      pendingReason,
      pendingActionCount,
      isStalled,
      isHost: canOperateMeeting(viewer, { ownerId: meeting.hostId }),
    },
  };
}

/**
 * 상세 — 실서버(MEET-04).
 *
 * ⚠️ **판정 순서를 목과 맞춘다**(없음 → 권한 없음 → 통과). `getLiveMeetingCapture`와 같은
 *    규칙이다 — 순서가 갈리면 같은 회의가 경로마다 다른 이유로 막힌다.
 * ⚠️ **404(`MT-001`)·403(`MT-011`) 둘 다 값으로 돌린다.** 캡처(`getLiveMeetingCapture`)는 403을
 *    던지는데, 거기서는 **우리가 먼저 판정한 뒤**의 403이라 판정이 틀렸다는 신호이기 때문이다.
 *    상세는 다르다 — 목록이 전 구성원 공개라 아무나 눌러 들어올 수 있고, 우리는 판정에 필요한
 *    값(개설 팀·참석자)을 조회 전에 갖고 있지 않다. 여기서 403은 고장이 아니라 **잠금**이고,
 *    잠금은 에러 화면이 아니다(WORKFLOW §3-2-1).
 * ⚠️ 제목은 못 싣는다 — 실패 봉투에 회의 제목이 없다(§view-types `locked`).
 * ⚠️ 개설자 판정은 **목 경로와 같은 함수**(`canOperateMeeting`)다. 매퍼는 값이 어디 있는지만
 *    알려 주고(`hostIdOf`) 판정은 `lib/permission.ts` 한 곳이다(CLAUDE.md §권한).
 */
async function getLiveMeetingDetail(id: string, viewer: Actor): Promise<MeetingDetailResult> {
  const accessToken = await requireAccessToken();

  let raw: unknown;
  try {
    raw = await serverApi<unknown>(ep.meeting(Number(id)), { accessToken });
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return { kind: "notFound" };
    if (error instanceof ApiError && error.status === 403) return { kind: "locked", title: null };
    throw error;
  }

  /* ⚠️ 단언이 아니라 **검사**다 — 모양이 어긋나면 화면을 그리기 전에 여기서 멈춘다 */
  const detail = parseMeetingDetail(raw);

  return {
    kind: "ok",
    detail: toMeetingDetailView(detail, {
      isHost: canOperateMeeting(viewer, { ownerId: hostIdOf(detail) }),
    }),
  };
}

/**
 * 캡처 진입 — **Host만**(WORKFLOW §3-3).
 *
 * ⚠️ 상세와 **판정이 다르다.** 상세는 `canViewMeetingDetail`(참석자·팀·Owner)로 열리지만
 *    캡처는 `canCaptureMeeting`(그 회의를 연 사람 한 명)이다 — 권한(역할)이 아니라
 *    **리소스 소유권**이라 Owner라고 남의 회의를 녹음할 수 없다(§권한: 축이 2개다).
 * ⚠️ 판정은 `lib/permission.ts`에 있다. 여기서 `hostId`를 직접 비교하면, 앞으로 붙을
 *    종료·업로드 API가 다른 조건을 쓰게 되어 화면과 서버가 갈린다.
 * ⚠️ 끝난 회의는 다시 못 들어간다 — 종료는 되돌릴 수 없다(§3-3 종료 정책).
 * ⚠️ 화면 판정일 뿐이다. 진짜 검사는 종료·업로드 API가 서버에서 다시 한다.
 */
export async function getMeetingCapture(id: string, viewer: Actor): Promise<MeetingCaptureResult> {
  if (!isMock) return getLiveMeetingCapture(id, viewer);

  ensureMockMeetingsSeeded();
  const meeting = findMockMeeting(id);
  if (!meeting) return { kind: "notFound" };

  if (!canCaptureMeeting(viewer, meeting)) return { kind: "notHost", title: meeting.title };

  if (meetingStatusOf(meeting, new Date()) === MEETING_STATUS.DONE) {
    return { kind: "alreadyDone", title: meeting.title };
  }

  /*
    ⚠️ 소속·직급까지 든다. 회의 중 참가자 레일은 이름만으로 부족하다 — 명부가 하나라
       화면마다 같은 사람이 같은 이름·같은 아바타 색으로 나온다(§구성원과 같은 이유).
  */
  const roster = new Map(listMockManagedMembers().map((member) => [member.id, member]));

  return {
    kind: "ok",
    meeting: {
      id: meeting.id,
      title: meeting.title,
      projectTag: meeting.projectTag,
      schedule: formatMeetingSchedule(meeting.start, meeting.end),
      roomName: meeting.roomName,
      attendees: meeting.attendeeIds.map((attendeeId) => {
        const member = roster.get(attendeeId);
        return {
          id: attendeeId,
          name: member?.name ?? "알 수 없음",
          // 팀이 없는 사람(대표)은 직급만 — 빈 가운뎃점을 남기지 않는다
          subtitle: [member?.teamName, member?.position].filter(Boolean).join(" · "),
          isHost: attendeeId === meeting.hostId,
        };
      }),
    },
  };
}

/**
 * 캡처 진입 — 실서버.
 *
 * ⚠️ **판정 순서를 목과 똑같이 맞춘다**(없음 → Host 아님 → 이미 끝남 → 통과). 순서가 갈리면
 *    같은 회의가 목에서는 `notHost`, 실서버에서는 `alreadyDone`으로 다르게 막혀 화면이
 *    다른 말을 한다.
 * ⚠️ **404(`MT-001`)는 값으로 돌린다.** 던지면 `error.tsx`가 뜨는데, 없는 회의는 고장이 아니라
 *    "그런 회의가 없습니다"라고 말해 줄 일이다(§view-types: 못 들어가는 이유를 값으로).
 *    나머지 오류(500·네트워크)는 그대로 던진다 — 그건 진짜 고장이라 에러 화면이 맞다.
 * ⚠️ **403(`MT-011` 열람 권한 없음)은 뭉개지 않는다.** BE가 막았다면 우리 판정이 틀렸다는
 *    뜻이라, 조용히 다른 화면을 그리면 어긋난 걸 아무도 모른다.
 * ⚠️ **개설자 판정은 `canCaptureMeeting`이 한다** — 목 경로와 같은 함수다. 응답에서는 그 값이
 *    `host.memberId`에 들어 있어 매퍼(`hostIdOf`)가 꺼내 준다. `server.ts`가 중첩을 직접
 *    벗기면 shape이 바뀔 때 여기까지 고쳐야 한다.
 */
async function getLiveMeetingCapture(id: string, viewer: Actor): Promise<MeetingCaptureResult> {
  const accessToken = await requireAccessToken();

  let raw: unknown;
  try {
    raw = await serverApi<unknown>(ep.meeting(Number(id)), { accessToken });
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return { kind: "notFound" };
    throw error;
  }

  /* ⚠️ 단언이 아니라 **검사**다 — 모양이 어긋나면 판정 전에 여기서 멈춘다(매퍼 주석 참고) */
  const detail = parseMeetingDetail(raw);

  /* ⚠️ 판정은 목 경로와 **같은 함수**다 — 매퍼는 값이 어디 있는지만 알려 준다(§권한) */
  if (!canCaptureMeeting(viewer, { hostId: hostIdOf(detail) })) {
    return { kind: "notHost", title: detail.title };
  }
  if (isClosed(detail)) return { kind: "alreadyDone", title: detail.title };

  return { kind: "ok", meeting: toMeetingCaptureInfo(detail) };
}
