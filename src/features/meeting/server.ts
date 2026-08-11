import "server-only";

import { AI_SUMMARY_STATUS, MEETING_STATUS } from "@/constants/meeting";
import { PERSONAL_ACTION_DETAIL_MOCK } from "@/features/action/mock/action-detail";
import { listMockManagedMembers } from "@/features/member/mock/managed";
import { PROJECT_TEAM_ACTIONS_MOCK } from "@/features/project/mock/team-actions";
import { type Actor, canCaptureMeeting, canViewMeetingDetail } from "@/lib/permission";
import { isMock } from "@/mocks/config";

import { formatMeetingSchedule } from "./lib";
import { findMockMeeting, listMockMeetings } from "./mock/meetings";
import { ensureMockMeetingsSeeded, findMockMeetingExtras } from "./mock/seed";
import { meetingStatusOf } from "./status";
import type { Meeting } from "./types";
import type {
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
  if (!isMock) {
    // TODO(BE 협의): `GET /meetings` — 응답 봉투는 아직 모른다(매퍼가 벗긴다)
    throw new Error("회의 목록 API가 아직 연결되지 않았습니다.");
  }

  ensureMockMeetingsSeeded();
  const now = new Date();
  const items = listMockMeetings().map((meeting) => toListItem(meeting, viewerId, now));

  const rank = {
    [MEETING_STATUS.IN_PROGRESS]: 0,
    [MEETING_STATUS.SCHEDULED]: 1,
    [MEETING_STATUS.DONE]: 2,
  } as const;
  const byId = new Map(listMockMeetings().map((meeting) => [meeting.id, meeting]));
  const startOf = (item: MeetingListItem) => byId.get(item.id)?.start.getTime() ?? 0;

  items.sort((a, b) => {
    if (rank[a.status] !== rank[b.status]) return rank[a.status] - rank[b.status];
    // 예정은 가까운 회의부터, 완료는 최근 회의부터
    return a.status === MEETING_STATUS.DONE ? startOf(b) - startOf(a) : startOf(a) - startOf(b);
  });

  return {
    hosted: items.filter((item) => item.isHost),
    invited: items.filter((item) => {
      if (item.isHost) return false;
      const meeting = byId.get(item.id);
      return meeting !== undefined && meeting.attendeeIds.includes(viewerId);
    }),
  };
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
  if (!isMock) {
    // TODO(BE 협의): `GET /meetings/{id}`
    throw new Error("회의 상세 API가 아직 연결되지 않았습니다.");
  }

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
    status === MEETING_STATUS.SCHEDULED
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
      topics: meeting.topics,
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
    },
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
  if (!isMock) {
    // TODO(BE 협의): `GET /meetings/{id}` — 캡처는 Host 판정에 쓸 최소 필드만 받으면 된다
    throw new Error("회의 캡처 API가 아직 연결되지 않았습니다.");
  }

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
