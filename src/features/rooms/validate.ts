import { getDay, isValid, parse } from "date-fns";

import type { Authority } from "@/constants/authority";
import { requiresParentTeamAction } from "@/lib/permission";

import { RESERVATION_DURATION_MINUTES } from "./constants";
import type {
  MeetingRoomDraft,
  MeetingRoomFormErrors,
  RoomReservationDraft,
  RoomReservationFormErrors,
} from "./types";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):(00|30)$/;
/**
 * 회의실 운영 시작·종료 시각용 — **예약 슬롯과 똑같이 30분 단위다**(2026-08-12 고침).
 * ⚠️ 전에는 임의 분(09:15)을 허용했는데 BE `@Pattern`([확인] `CreateMeetingRoomRequest`)이
 *    30분 단위만 받아, FE 검증을 통과한 값이 400으로 튕기고 그 오류가 매핑 default 분기라
 *    **엉뚱한 이름 칸에** 붙었다 — 검증 규칙은 BE와 한 벌이어야 한다.
 */
const GENERAL_TIME_PATTERN = /^([01]\d|2[0-3]):(00|30)$/;

function isValidCalendarDate(value: string): boolean {
  if (!DATE_PATTERN.test(value)) return false;
  return isValid(parse(value, "yyyy-MM-dd", new Date()));
}

function toMinutes(time: string): number {
  const [hour, minute] = time.split(":");
  return Number(hour) * 60 + Number(minute);
}

/**
 * 회의실 예약 폼 검증 — 화면(모달)과 서버(Server Action)가 **이 함수 하나**로 본다.
 * ⚠️ 같은 회의실·시간대 중복 여부는 여기서 보지 않는다 — 그건 기존 예약 목록이 있어야 판단할 수
 *    있어 `actions.ts`가 목/실서버 조회 뒤에 따로 확인한다.
 * ⚠️ **참조 무결성도 여기서 안 본다** — `roomId`·`projectId`가 실제로 존재하는지, 골라 낸
 *    `parentTeamActionId`가 진짜 그 프로젝트·그 팀의 것인지는 `actions.ts`가 목/실서버 조회
 *    뒤에 따로 확인한다(§권한: 화면 숨김은 UX일 뿐 보안이 아니다). 여기는 **형식**만 본다.
 * @param host "상위 팀 액션" 필수 여부는 회의를 여는 사람의 권한에 달렸다(`requiresParentTeamAction`,
 *   WORKFLOW.md §3-1) — Owner면 이 필드가 없어도 되고, Leader/Member면 반드시 있어야 한다.
 * @param room 이 예약이 실제로 겨냥한 회의실의 이용 가능 시간 — **회의실마다 다르다**(2026-08-14,
 *   BE 24시간 운영 협의). 예전엔 전역 09:00~18:00 상수 하나로 모든 회의실을 같이 막았는데,
 *   그러면 회의실별로 다르게 늘린 운영시간이 의미가 없어진다. `roomId`가 가리키는 회의실을
 *   못 찾았으면(폼 조작 등) `null`을 넘긴다 — 그때는 시간대 검사를 건너뛴다, 존재하지 않는
 *   `roomId` 자체는 `actions.ts`가 참조 무결성으로 따로 막는다(위 주석 참고).
 */
export function validateRoomReservationDraft(
  draft: RoomReservationDraft,
  host: { role: Authority },
  room: { openTime: string; closeTime: string } | null,
): RoomReservationFormErrors {
  const errors: RoomReservationFormErrors = {};

  if (!draft.title.trim()) errors.title = "회의 제목을 입력해 주세요";
  if (!draft.roomId.trim()) errors.roomId = "회의실을 선택해 주세요";

  if (!draft.date.trim()) {
    errors.date = "날짜를 선택해 주세요";
  } else if (!isValidCalendarDate(draft.date)) {
    errors.date = "올바른 날짜가 아니에요";
  } else {
    /*
      ⚠️ **화면(`SlotPicker`)도 요일 선택지를 월~금뿐으로 두지만, 여기서 다시 본다**(§권한:
         화면 숨김은 UX일 뿐 보안이 아니다). 값 자체는 폼 조작·직접 호출로 주말이 들어올 수 있다.
    */
    const day = getDay(parse(draft.date, "yyyy-MM-dd", new Date()));
    if (day === 0 || day === 6) errors.date = "평일에만 예약할 수 있어요";
  }

  if (!draft.startTime.trim()) {
    errors.startTime = "시작 시간을 선택해 주세요";
  } else if (!TIME_PATTERN.test(draft.startTime)) {
    errors.startTime = "예약은 30분 단위로만 가능합니다";
  } else if (room) {
    const startMinutes = toMinutes(draft.startTime);
    const openMinutes = toMinutes(room.openTime);
    const closeMinutes = toMinutes(room.closeTime);
    if (startMinutes < openMinutes || startMinutes + RESERVATION_DURATION_MINUTES > closeMinutes) {
      errors.startTime = `회의실 이용 시간(${room.openTime}~${room.closeTime}) 안에서 선택해 주세요`;
    }
  }

  // ⚠️ 프로젝트는 이제 항상 필수다(WORKFLOW.md §3-1 확정) — 프로젝트에 안 묶인 예약은 없다.
  if (!draft.projectId.trim()) errors.projectId = "프로젝트를 선택해 주세요";

  if (draft.topics.length === 0 || !draft.topics[0]?.main.trim() || !draft.topics[0]?.sub.trim()) {
    errors.topics = "회의 안건(대주제·소주제)을 한 쌍 이상 입력해 주세요";
  } else if (draft.topics.some((topic) => !topic.main.trim() || !topic.sub.trim())) {
    errors.topics = "빈 안건 칸을 채우거나 삭제해 주세요";
  }

  // ⚠️ Owner가 개설하면 이 필드가 아예 없다(= 프로젝트 회의) — Leader/Member면 반드시 있어야
  //    한다(= 팀 액션 회의, WORKFLOW.md §3-1 "상위 팀 액션 노출 조건").
  if (requiresParentTeamAction(host)) {
    if (!draft.parentTeamActionId) errors.parentTeamActionId = "상위 팀 액션을 선택해 주세요";
  } else if (draft.parentTeamActionId !== undefined) {
    // ⚠️ Owner는 반대로 이 필드를 아예 못 넣는다 — Owner 개설 회의(프로젝트 회의)엔 상위 팀
    //    액션 개념이 없다(WORKFLOW.md §2). 폼이 조작돼 값이 들어와도 여기서 막는다.
    errors.parentTeamActionId = "Owner가 개설하는 회의에는 상위 팀 액션을 지정할 수 없습니다";
  }

  if (draft.attendeeIds.length === 0) {
    errors.attendeeIds = "참석자를 한 명 이상 선택해 주세요";
  } else if (draft.attendeeIds.some((id) => !Number.isInteger(id))) {
    errors.attendeeIds = "참석자 값이 올바르지 않습니다";
  }

  return errors;
}

/**
 * 회의실 추가·수정 폼 검증(`/manage/rooms`) — 화면과 서버(Server Action)가 이 함수 하나로 본다.
 * ⚠️ 이용 가능 시간도 **예약 슬롯과 같은 30분 단위**다(2026-08-13 정정 — 전에는 "제약이 없다"고
 *    적혀 있었으나 BE `@Pattern`이 30분 단위만 받는다). 검증 규칙은 BE와 한 벌이어야 한다.
 */
export function validateMeetingRoomDraft(draft: MeetingRoomDraft): MeetingRoomFormErrors {
  const errors: MeetingRoomFormErrors = {};

  if (!draft.name.trim()) errors.name = "회의실 이름을 입력해 주세요";
  if (!draft.location.trim()) errors.location = "위치를 입력해 주세요";

  if (!draft.openTime.trim()) {
    errors.openTime = "이용 시작 시간을 입력해 주세요";
  } else if (!GENERAL_TIME_PATTERN.test(draft.openTime)) {
    errors.openTime = "30분 단위로 입력해 주세요 (예: 09:00, 09:30)";
  }

  if (!draft.closeTime.trim()) {
    errors.closeTime = "이용 종료 시간을 입력해 주세요";
  } else if (!GENERAL_TIME_PATTERN.test(draft.closeTime)) {
    errors.closeTime = "30분 단위로 입력해 주세요 (예: 18:00, 18:30)";
  }

  if (
    !errors.openTime &&
    !errors.closeTime &&
    toMinutes(draft.openTime) >= toMinutes(draft.closeTime)
  ) {
    errors.closeTime = "종료 시간은 시작 시간보다 늦어야 합니다";
  }

  return errors;
}
