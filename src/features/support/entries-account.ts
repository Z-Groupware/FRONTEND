import { FAQ_CATEGORY, type FaqEntry } from "./faq";

/**
 * 시작하기·계정·이용 환경에 대한 답.
 *
 * ⚠️ 근거는 `docs/CONVENTIONS.md`와 **코드의 실제 값**이다. 둘 다에 없는 것은 적지 않는다 —
 *    환불 규정·결제 수단처럼 팀이 안 정한 건 "모른다"로 흘린다(§정직성).
 * ⚠️ 키워드에 **범용어를 넣지 않는다.** "무엇"·"코드"·"어디" 같은 말은 아무 문장에나 들어가
 *    엉뚱한 항목이 걸린다. 못 찾는 건 갈래를 다시 보여 주면 되지만, 틀린 답은 못 되돌린다.
 * ⚠️ 답은 **빈 줄로 문단을 나눈다.** 한 덩어리로 쓰면 말풍선 안이 글 벽이 된다.
 */

export const ACCOUNT_ENTRIES: readonly FaqEntry[] = [
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
    keywords: ["기업코드", "기업 코드", "회사코드", "코드는 어디", "코드가 뭐"],
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
    id: "onboarding",
    category: FAQ_CATEGORY.START,
    question: "처음 들어가면 뭘 하나요?",
    keywords: ["온보딩", "초기 설정", "처음", "세팅", "설정부터"],
    answer:
      "관리자가 초기 설정을 세 단계로 마칩니다.\n\n1. 부서 체계 만들기\n2. 직급 체계와 권한 정하기\n3. 사원 초대하기\n\n다 하면 바로 회의를 시작할 수 있어요.",
  },
  {
    id: "lost-code",
    category: FAQ_CATEGORY.START,
    question: "기업 코드를 잃어버렸어요",
    keywords: ["코드를 잃", "코드 분실", "코드 까먹", "메일을 못", "코드가 없"],
    answer:
      "회사 관리자에게 문의해 주세요. 관리자가 코드를 다시 알려드릴 수 있어요.\n\n승인 메일에도 같은 코드가 적혀 있습니다.",
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
    keywords: ["비밀번호", "패스워드", "까먹", "재발급", "로그인 안", "잊어", "잊었"],
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
    id: "org-structure",
    category: FAQ_CATEGORY.ACCOUNT,
    question: "부서와 직급은 어떻게 구성되나요?",
    keywords: ["부서", "직급", "조직", "체계", "구조", "계층"],
    answer:
      "부서 아래에 역할이 오는 2계층이에요. 역할은 비워 둘 수도 있습니다.\n\n사원은 부서에 소속되고, **권한은 부서가 아니라 직급에서** 옵니다.\n\nLeader 직급은 회사에 하나이고, 그 직급을 가진 사람은 부서마다 한 명이에요.",
    links: [{ label: "권한 매트릭스 보기", href: "/roles" }],
  },
  {
    id: "meeting-owner",
    category: FAQ_CATEGORY.ACCOUNT,
    question: "회의는 누가 시작할 수 있나요?",
    keywords: ["회의 시작", "누가 시작", "녹음 시작", "담당자만", "종료"],
    answer:
      "그 회의의 담당자 한 명만 할 수 있어요. 시작·녹음·파일 제출·종료 모두요.\n\nOwner라도 담당자가 아니면 못 합니다 — 역할과 별개로 움직이는 부분이에요.",
    links: [{ label: "권한 매트릭스 보기", href: "/roles" }],
  },
  {
    id: "browser",
    category: FAQ_CATEGORY.ENV,
    question: "어떤 브라우저에서 쓸 수 있나요?",
    keywords: ["브라우저", "크롬", "사파리", "chrome", "safari", "엣지", "지원 브라우저"],
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
    id: "mobile",
    category: FAQ_CATEGORY.ENV,
    question: "모바일에서도 쓸 수 있나요?",
    keywords: ["모바일", "폰", "휴대폰", "아이폰", "안드로이드", "태블릿", "앱"],
    // ⚠️ 반응형 전면 구현은 아직이다 — 되는 척하지 않는다(§정직성)
    answer:
      "지금은 데스크톱 화면을 기준으로 만들어져 있어요.\n\n모바일 대응은 준비 중이라, 당장은 PC에서 쓰시는 걸 권해 드려요.",
  },
  {
    id: "data",
    category: FAQ_CATEGORY.ENV,
    question: "데이터는 어디에 보관되나요?",
    keywords: ["데이터", "보관", "저장", "서버", "aws", "클라우드", "안전"],
    answer:
      "서버는 AWS에서 운영해요.\n\n어떤 정보를 왜 다루는지는 개인정보처리방침에 적어 뒀습니다.",
    links: [{ label: "개인정보처리방침", href: "/privacy" }],
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
    // ⚠️ 질문을 "위치"가 들어가게 적는다 — "어디"만으로 잡으면 "화장실이 어디"까지 걸린다
    question: "회사 위치가 어디인가요?",
    keywords: ["위치", "주소", "오시는", "찾아가", "지도", "사무실"],
    answer:
      "을지대학교 박애관 421호에 있어요.\n\n지도와 대중교통 안내는 오시는 길에서 볼 수 있어요.",
    links: [{ label: "오시는 길", href: "/location" }],
  },
];
