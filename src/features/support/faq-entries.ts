import { PLANS } from "@/features/billing/plans";

import { FAQ_CATEGORY, type FaqCategory, type FaqEntry } from "./faq";

/**
 * 도움말이 실제로 답하는 것들.
 *
 * ⚠️ 근거는 `docs/CONVENTIONS.md`와 **코드의 실제 값**이다. 둘 다에 없는 것은 적지 않는다 —
 *    환불 규정·데이터 보관 기간처럼 팀이 안 정한 건 "모른다"로 흘린다(§정직성).
 * ⚠️ 금액·플랜 이름을 **문자열로 박지 않는다.** `plans.ts`에서 읽어 온다 — 박아 두면
 *    가격이 바뀔 때 `/plans`와 도움말이 서로 다른 말을 한다.
 * ⚠️ 키워드는 **넉넉히** 넣는다. 사람은 "요금제"라고 안 치고 "얼마"라고 친다.
 * ⚠️ 답은 **빈 줄로 문단을 나눈다.** 한 덩어리로 쓰면 말풍선 안이 글 벽이 된다.
 */

/*
  ⚠️ 단위 문자열이 "영원히 무료"·"/ 인원 / 월"처럼 모양이 달라, 슬래시 주변 공백만 눌러
     한 줄에서 읽히게 다듬는다.
*/
const planLines = PLANS.map((plan) =>
  `· ${plan.name} — ${plan.price} ${plan.unit}`.replace(/\s*\/\s*/g, "/"),
).join("\n");

export const FAQ_ENTRIES: readonly FaqEntry[] = [
  {
    id: "product",
    category: FAQ_CATEGORY.SERVICE,
    question: "Z는 어떤 서비스인가요?",
    keywords: ["무엇", "서비스", "제품", "소개", "뭐하는", "어떤 서비스", "뭐 하는"],
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
    id: "seats",
    category: FAQ_CATEGORY.PRICING,
    question: "인원이 늘면 요금이 어떻게 되나요?",
    keywords: ["인원", "사람", "좌석", "구성원", "늘어나면", "몇 명"],
    answer: "유료 플랜은 인원 수만큼 과금돼요.\n\n결제 화면에서 인원을 정하면 그만큼 계산됩니다.",
    links: [{ label: "요금제 보기", href: "/plans" }],
  },
  {
    id: "signup",
    category: FAQ_CATEGORY.START,
    question: "어떻게 시작하나요?",
    keywords: ["시작", "가입", "신청", "등록", "회원", "도입", "어떻게 쓰"],
    answer:
      "기업 등록 신청을 남겨 주세요.\n\n검토 후 담당자 메일로 기업 코드를 보내 드려요. 그 코드로 로그인하면 워크스페이스가 열립니다.",
    links: [{ label: "기업 등록 신청", href: "/register" }],
  },
  {
    id: "company-code",
    category: FAQ_CATEGORY.START,
    question: "기업 코드가 뭔가요?",
    keywords: ["기업코드", "기업 코드", "회사코드", "코드", "초대장"],
    answer:
      "회사를 가리키는 식별자예요. 직접 지어 넣는 값이 아니라 등록이 승인되면 메일로 받습니다.\n\n한 번 입력하면 브라우저가 기억해서, 다음부터는 이메일과 비밀번호만 넣으면 돼요.",
    links: [{ label: "로그인", href: "/login" }],
  },
  {
    id: "review-time",
    category: FAQ_CATEGORY.START,
    question: "신청하면 얼마나 걸리나요?",
    keywords: ["얼마나 걸", "며칠", "언제", "승인", "검토", "기다"],
    answer:
      "영업일 기준 1~2일 안에 담당자 메일로 결과를 보내 드려요.\n\n승인되면 그 메일에 기업 코드가 함께 옵니다.",
  },
  {
    id: "roles",
    category: FAQ_CATEGORY.ACCOUNT,
    question: "권한은 어떻게 나뉘나요?",
    keywords: ["권한", "역할", "role", "owner", "admin", "leader", "member", "관리자", "팀장"],
    answer:
      "Owner · Admin · Leader · Member 네 역할이 있어요.\n\n다만 역할만으로 다 정해지진 않습니다 — 회의 시작이나 녹음처럼 그 회의 담당자만 할 수 있는 일이 따로 있어요.",
    links: [{ label: "권한 매트릭스 보기", href: "/roles" }],
  },
  {
    id: "password",
    category: FAQ_CATEGORY.ACCOUNT,
    question: "비밀번호를 잊었어요",
    keywords: ["비밀번호", "패스워드", "잊", "까먹", "찾기", "재발급", "로그인 안"],
    answer:
      "직접 재설정하는 화면은 없어요. 회사 관리자에게 재발급을 요청하시면 됩니다.\n\n사내 도구라 계정을 회사가 관리하는 구조예요.",
  },
  {
    id: "invite",
    category: FAQ_CATEGORY.ACCOUNT,
    question: "팀원은 어떻게 초대하나요?",
    keywords: ["초대", "팀원", "사원", "직원", "부서", "조직도"],
    answer:
      "관리자가 부서와 직급을 정한 뒤 메일 주소로 초대해요.\n\n부서마다 리더는 한 명이고, 사원은 부서에 소속됩니다.",
    links: [{ label: "권한 매트릭스 보기", href: "/roles" }],
  },
  {
    id: "browser",
    category: FAQ_CATEGORY.ENV,
    question: "어떤 브라우저에서 쓸 수 있나요?",
    keywords: ["브라우저", "크롬", "사파리", "chrome", "safari", "엣지", "지원", "환경"],
    answer:
      "회의 자막(음성 인식)은 크롬 계열 브라우저에서만 동작해요.\n\n사파리나 파이어폭스에서는 자막을 못 쓰고, 대신 화면에서 미리 안내해 드립니다.",
  },
  {
    id: "dark-mode",
    category: FAQ_CATEGORY.ENV,
    question: "다크 모드가 있나요?",
    keywords: ["다크", "어두운", "야간", "dark", "테마", "밝기"],
    answer: "네, 전 페이지에 있어요.\n\n상단바 오른쪽 끝 버튼으로 바꿀 수 있습니다.",
  },
  {
    id: "legal",
    category: FAQ_CATEGORY.ENV,
    question: "약관과 개인정보 처리는 어디서 보나요?",
    keywords: ["약관", "이용약관", "개인정보", "정책", "처리방침", "법적", "동의"],
    answer:
      "이용약관과 개인정보처리방침을 각각 따로 두고 있어요.\n\n아래에서 전문을 보실 수 있습니다.",
    links: [
      { label: "이용약관", href: "/terms" },
      { label: "개인정보처리방침", href: "/privacy" },
    ],
  },
  {
    id: "location",
    category: FAQ_CATEGORY.ENV,
    question: "회사가 어디에 있나요?",
    keywords: ["위치", "주소", "어디", "찾아", "오시는", "지도", "사무실"],
    answer:
      "을지대학교 박애관 421호에 있어요.\n\n지도와 대중교통 안내는 오시는 길에서 볼 수 있어요.",
    links: [{ label: "오시는 길", href: "/location" }],
  },
];

/** 갈래별로 묶어 준다 — 고른 갈래 안의 질문만 보여줄 때 쓴다 */
export function entriesOfCategory(category: FaqCategory) {
  return FAQ_ENTRIES.filter((entry) => entry.category === category);
}
