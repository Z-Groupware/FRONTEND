import type { ProjectStatus } from "@/constants/project";

/**
 * 녹음 용량 화면(`/manage/storage`)의 **UI 계약**.
 *
 * ⚠️ 컴포넌트는 이 타입만 본다. BE 응답 모양이 정해지면 매퍼가 여기에 맞춰 흡수한다
 *    (CLAUDE.md §Mock → Live 격리막).
 * ⚠️ 용량은 **GB 숫자**로 들고 다닌다. `"8.2GB"` 같은 문자열로 받으면 합계를 못 낸다 —
 *    서식은 화면에서 `formatGb`가 붙인다.
 * ⚠️ **총량(포함량)은 여기 없다.** 그건 `BillingConfig.includedStorageGb`가 쥐고 있고,
 *    두 벌로 들고 있으면 반드시 어긋난다(§요금제: 금액·포함량의 정본은 하나다).
 */

/**
 * 프로젝트 한 줄이 차지한 용량.
 *
 * ⚠️ **음성과 자막·요약을 나눠 센다.** 둘 다 과금 대상인데 지울 때의 성격이 다르다 —
 *    음성은 지워도 되는 아카이브고, 자막·요약은 회의에서 남은 제품 자산이다.
 *    합쳐서 보여주면 무엇을 지워야 하는지 판단할 수 없다(CLAUDE.md §디자인 토큰 옆 사용량 규칙).
 */
export interface ProjectStorage {
  /** 프로젝트 태그 — 화면 이동에도 쓴다(`/app/projects/:tag`) */
  tag: string;
  name: string;
  /**
   * **녹음이 남은** 회의 수. 회의 하나가 파일 여러 개다(캡처가 10분마다 끊는다).
   * ⚠️ 회의 자체의 수가 아니다 — 녹음을 지우면 0이 되지만 회의는 그대로 남는다.
   */
  meetingCount: number;
  /** 음성 파일(GB) — **지울 수 있는 쪽** */
  voiceGb: number;
  /** 자막·요약(GB) — 지우지 않는다. 회의에서 남은 결과물이다 */
  sttGb: number;
  /** 가장 오래된 녹음 날짜 `YYYY-MM-DD` — 지울지 판단하는 기준이다 */
  oldestRecordedAt: string;
  /**
   * 프로젝트 상태 — **끝난 프로젝트의 녹음만 지운다.**
   *
   * ⚠️ `isDone: boolean`이 아니다. 상태는 셋이라(`할일`·`진행중`·`완료`) 참·거짓으로 줄이면
   *    화면이 `할일`을 `진행중`으로 잘못 부른다 — 값도 라벨도 `constants/project`가 정본이다.
   */
  status: ProjectStatus;
}

/** 화면 한 장이 필요로 하는 전부 */
export interface StorageOverview {
  /** 전체 음성(GB) */
  voiceGb: number;
  /** 전체 자막·요약(GB) */
  sttGb: number;
  /**
   * 프로젝트별 내역.
   *
   * ⚠️ 지금은 **전량**을 받는다. BE가 페이지 단위로 주기 시작하면 스크롤로 이어 붙인다
   *    (CLAUDE.md §목록·페이지네이션) — 그때 `server.ts`와 매퍼만 고친다.
   */
  projects: readonly ProjectStorage[];
}
