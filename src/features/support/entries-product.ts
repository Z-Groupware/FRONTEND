import { PLANS } from "@/features/billing/plans";

import { FAQ_CATEGORY, type FaqEntry } from "./faq";

/**
 * 제품과 요금에 대한 답.
 *
 * ⚠️ 근거는 `docs/CONVENTIONS.md`와 **코드의 실제 값**이다. 둘 다에 없는 것은 적지 않는다 —
 *    환불 규정·결제 수단처럼 팀이 안 정한 건 "모른다"로 흘린다(§정직성).
 * ⚠️ 키워드에 **범용어를 넣지 않는다.** "무엇"·"코드"·"어디" 같은 말은 아무 문장에나 들어가
 *    엉뚱한 항목이 걸린다. 못 찾는 건 갈래를 다시 보여 주면 되지만, 틀린 답은 못 되돌린다.
 * ⚠️ 답은 **빈 줄로 문단을 나눈다.** 한 덩어리로 쓰면 말풍선 안이 글 벽이 된다.
 */

/*
  ⚠️ 플랜 값은 `plans.ts`에서 읽는다 — 금액을 여기 박으면 `/plans`와 다른 말을 하게 된다.
  ⚠️ 단위 문자열이 "영원히 무료"·"/ 인원 / 월"처럼 모양이 달라, 슬래시 주변 공백만 눌러
     한 줄에서 읽히게 다듬는다.
*/
const planLines = PLANS.map((plan) =>
  `· ${plan.name} — ${plan.price} ${plan.unit}`.replace(/\s*\/\s*/g, "/"),
).join("\n");

export const PRODUCT_ENTRIES: readonly FaqEntry[] = [
  {
    id: "product",
    category: FAQ_CATEGORY.SERVICE,
    question: "Z는 어떤 서비스인가요?",
    keywords: ["서비스", "제품", "소개", "뭐하는", "뭐 하는", "무슨 서비스", "어떤 서비스"],
    answer:
      "회의를 캡처하면 그게 조직의 기억이 되는 그룹웨어예요.\n\n회의 중 자막이 쌓이고, 끝나면 결정과 할 일이 정리돼 담당자에게 배정됩니다.\n\n10~50명 규모 팀을 염두에 두고 만들었어요.",
  },
  {
    id: "capture",
    category: FAQ_CATEGORY.SERVICE,
    question: "회의 내용은 어떻게 기록되나요?",
    keywords: ["기록", "녹음", "자막", "캡처", "받아쓰기", "stt", "음성", "회의록"],
    answer:
      "회의 중 말한 내용이 자막으로 실시간 기록돼요.\n\n자막 옆에 메모를 붙일 수도 있고, 회의가 끝나도 그대로 남습니다.",
  },
  {
    id: "ai",
    category: FAQ_CATEGORY.SERVICE,
    question: "AI가 뭘 해주나요?",
    keywords: ["ai", "인공지능", "자동", "정리", "요약", "분배", "똑똑"],
    // ⚠️ 자막(STT)은 브라우저 기능이라 AI로 표기하지 않는다(CLAUDE.md §AI 기능)
    answer:
      "회의에서 나온 할 일을 담당자에게 나눠 배정하는 걸 AI가 맡아요.\n\n자막을 받아 적는 건 브라우저 기능이라 AI가 아닙니다 — 그건 그렇게 말씀드리는 게 맞을 것 같아요.",
  },
  {
    id: "search",
    category: FAQ_CATEGORY.SERVICE,
    question: "지난 회의 내용을 다시 찾을 수 있나요?",
    keywords: ["검색", "다시 찾", "지난", "예전", "이전 회의", "기록 조회"],
    answer:
      "네, 통합 검색이 있어요. 회의·자막·액션을 한 곳에서 찾습니다.\n\nFree 플랜에도 들어 있어요.",
  },
  {
    id: "handover",
    category: FAQ_CATEGORY.SERVICE,
    question: "인수인계는 어떻게 되나요?",
    keywords: ["인수인계", "인수", "휴직", "담당자 변경", "넘겨"],
    // ⚠️ 자동 취합은 **규칙 기반**이다 — AI로 표기하지 않는다(CLAUDE.md §AI 기능)
    answer:
      "담당자가 맡고 있던 회의·액션·문서를 자동으로 모아 인수인계 문서를 만들어요.\n\n규칙에 따라 모으는 것이라 AI는 아닙니다.\n\nTeam 플랜 기능이에요.",
    links: [{ label: "요금제 보기", href: "/plans" }],
  },
  {
    id: "notification",
    category: FAQ_CATEGORY.SERVICE,
    question: "알림은 어떻게 오나요?",
    keywords: ["알림", "푸시", "알려주", "통보", "notification", "할 일이 생기면"],
    answer:
      "네, 나에게 배정된 액션이 생기면 실시간으로 알림이 옵니다.\n\n새로고침하지 않아도 화면에 바로 떠요.",
  },
  {
    id: "pricing",
    category: FAQ_CATEGORY.PRICING,
    question: "요금제가 어떻게 되나요?",
    keywords: ["요금", "가격", "얼마", "비용", "돈", "플랜", "유료", "가입비", "결제"],
    answer: `두 가지가 있어요.\n\n${planLines}\n\n자세한 기능 차이는 요금제 화면에서 표로 볼 수 있어요.`,
    links: [{ label: "요금제 보기", href: "/plans" }],
  },
  {
    id: "free",
    category: FAQ_CATEGORY.PRICING,
    question: "무료로도 쓸 수 있나요?",
    keywords: ["무료", "공짜", "free", "체험", "안 내고"],
    answer:
      "네, Free 플랜은 영원히 무료예요.\n\n회의 캡처와 실시간 자막, 통합 검색, AI 액션 분배, 프로젝트·액션 관리까지 쓸 수 있습니다.\n\n나중에 올리셔도 돼요.",
    links: [{ label: "요금제 비교", href: "/plans" }],
  },
  {
    id: "plan-change",
    category: FAQ_CATEGORY.PRICING,
    question: "플랜을 나중에 바꿀 수 있나요?",
    keywords: ["플랜 변경", "업그레이드", "바꿀 수", "옮길 수", "downgrade", "전환"],
    answer:
      "네, Free로 시작해서 나중에 올리셔도 돼요.\n\n플랜은 **기능 접근**으로 갈립니다 — 개수나 용량 한도로 막지 않아요.",
    links: [{ label: "요금제 비교", href: "/plans" }],
  },
  {
    id: "seats",
    category: FAQ_CATEGORY.PRICING,
    question: "인원이 늘면 요금이 어떻게 되나요?",
    keywords: ["인원", "사람", "좌석", "구성원", "늘어나면", "몇 명"],
    answer: "유료 플랜은 인원 수만큼 과금돼요.\n\n결제 화면에서 인원을 정하면 그만큼 계산됩니다.",
    links: [{ label: "요금제 보기", href: "/plans" }],
  },
];
