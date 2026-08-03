import { FAQ_CATEGORY, type FaqEntry } from "./faq";

/**
 * 계정과 권한에 대한 답.
 *
 * ⚠️ 근거는 `docs/CONVENTIONS.md`와 **코드의 실제 값**이다. 둘 다에 없는 것은 적지 않는다 —
 *    환불 규정·결제 수단처럼 팀이 안 정한 건 "모른다"로 흘린다(§정직성).
 * ⚠️ 키워드에 **범용어를 넣지 않는다.** "무엇"·"코드"·"어디" 같은 말은 아무 문장에나 들어가
 *    엉뚱한 항목이 걸린다. 못 찾는 건 갈래를 다시 보여 주면 되지만, 틀린 답은 못 되돌린다.
 * ⚠️ 답은 **빈 줄로 문단을 나눈다.** 한 덩어리로 쓰면 말풍선 안이 글 벽이 된다.
 */

export const ACCOUNT_ENTRIES: readonly FaqEntry[] = [
  {
    id: "roles",
    category: FAQ_CATEGORY.ACCOUNT,
    question: "권한은 어떻게 나뉘나요?",
    keywords: ["권한", "역할", "role", "owner", "admin", "leader", "member", "관리자", "팀장"],
    answer:
      "Owner · Leader · Member 세 역할이 있고, 그 위에 Admin을 겸할 수 있어요.\n\nAdmin은 따로 떨어진 역할이 아니라 덧붙는 권한이에요 — 예를 들어 한 사람이 Leader이면서 Admin일 수 있습니다. 계정을 나눠 쓰지 않아요.\n\n다만 역할만으로 다 정해지진 않습니다 — 회의 시작이나 녹음처럼 그 회의 담당자만 할 수 있는 일이 따로 있어요.",
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
      "Admin을 가진 사람이 부서와 직급을 정한 뒤 메일 주소로 초대해요.\n\n부서마다 리더는 한 명이고, 사원은 부서에 소속됩니다.",
    links: [{ label: "권한 매트릭스 보기", href: "/roles" }],
  },
  {
    id: "org-structure",
    category: FAQ_CATEGORY.ACCOUNT,
    question: "부서와 직급은 어떻게 구성되나요?",
    keywords: ["부서", "직급", "조직", "체계", "구조", "계층"],
    answer:
      "부서 아래에 역할이 오는 2계층이에요. 역할은 비워 둘 수도 있습니다.\n\n사원은 부서에 소속되고, 권한은 부서가 아니라 직급에서 옵니다.\n\nLeader 직급은 회사에 하나이고, 그 직급을 가진 사람은 부서마다 한 명이에요.",
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
    id: "owner-admin",
    category: FAQ_CATEGORY.ACCOUNT,
    question: "Owner 계정과 Admin 권한은 어떻게 받나요?",
    keywords: ["owner 계정", "admin 계정", "관리자 계정", "대표 계정", "겸직", "관리자 지정"],
    answer:
      "기업 등록이 승인되면 시스템이 Owner 계정 하나를 만들어 대표 메일로 보내 드려요.\n\nAdmin은 계정이 아니라 권한이에요. 사원이 들어온 뒤 대표가 그 사람에게 켜 줍니다 — 직급이 아니라 사람에게 붙어요.\n\n대표 본인은 Admin을 겸할 수 없습니다.",
  },
  {
    id: "role-scope",
    category: FAQ_CATEGORY.ACCOUNT,
    question: "역할마다 뭘 할 수 있나요?",
    keywords: ["뭘 할 수", "무엇을 할", "할 수 있는 일", "권한 범위"],
    answer:
      "· Owner — 기업 전체 관리\n· Leader — 팀 현황·액션 관리\n· Member — 일반 사용\n\n여기에 +Admin(겸직) — 계정·회의실·직급 권한 관리가 얹혀요. 회의 개설이나 액션 조회 같은 건 Admin을 켠다고 늘지 않고, 그 사람의 역할이 정합니다.\n\n표로 정리한 화면이 따로 있어요.",
    links: [{ label: "권한 매트릭스 보기", href: "/roles" }],
  },
  {
    id: "leader-scope",
    category: FAQ_CATEGORY.ACCOUNT,
    question: "팀장은 어디까지 볼 수 있나요?",
    keywords: ["팀장은", "leader는", "부서 전체", "팀원 현황"],
    answer: "자기 부서 전체를 봅니다. 조회·초대·통계·중간 승인까지 그 부서의 모든 역할이 포함돼요.",
    links: [{ label: "권한 매트릭스 보기", href: "/roles" }],
  },
  {
    id: "member-status",
    category: FAQ_CATEGORY.ACCOUNT,
    question: "휴직한 사람은 어떻게 표시되나요?",
    keywords: ["휴직", "재직", "상태 표시", "아직 로그인", "미접속"],
    answer:
      "사원은 재직 · 휴직 · 대기로 나뉘어요.\n\n대기는 계정은 발급됐는데 아직 한 번도 로그인하지 않은 상태예요.",
  },
  {
    id: "handover-flow",
    category: FAQ_CATEGORY.ACCOUNT,
    question: "인수인계는 어떤 순서로 진행되나요?",
    keywords: ["인수인계 절차", "인수인계는 어떤", "승인 절차", "결재", "반려", "중간 승인"],
    answer:
      "작성 중 → 전달 완료 → 중간 승인 → 최종 승인 순서예요. 중간에 반려될 수도 있습니다.\n\n휴가와 오프보딩 두 가지 상황에서 씁니다.",
  },
];
