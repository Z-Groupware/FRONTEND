# CLAUDE.md — Z (회의 기반 지식관리 그룹웨어) FE · 팀 공용 · 린

> 📌 살아있는 문서. **기술규칙=안정 / 세부 기능·API=요구사항 명세 확정 후 갱신.** 예시·상세는 `docs/CONVENTIONS.md`, 팀이 정한 것·미정은 `DECISIONS.md`.
> **한 줄:** 회의를 캡처(STT·녹음)하면 AI가 요약·결정·액션을 추출해 담당자에게 하달한다.
> **스택:** Next.js(App Router) · TS · Tailwind · shadcn/ui. 데이터=**Server-First + Server Action + BFF + httpOnly 쿠키**.
> **⚠️ 로그인 뒤 사내 도구다.** 공개 페이지가 아니라 SEO·OG는 대상이 아니다(§SEO). 데스크톱 1440 전용(모바일 미대응).

## 핵심 4원칙

1. **서버우선:** 조회=Server Component, `'use client'`=상호작용 잎사귀(버튼·폼·입력·캡처)만.
2. **변경(CUD)=Server Action + BFF:** 브라우저→Next서버(액션)→BE. 끝나면 `revalidatePath`. **토큰이 브라우저로 안 나간다**(사내 도구 = 권한이 핵심).
3. **정직한 목업:** 목=API 스펙 success 예시 그대로. 모든 화면 **loading/error/empty** 필수.
4. **⚡최적화=처음부터:** 이미지 `next/image`·폰트 `next/font`·무거운거 `next/dynamic`·시맨틱 태그. 쓰는 순간 적용.

## 권한 — **축이 2개다** ⭐

> 역할 가드만 짜면 안 된다. 리소스 소유권을 따로 검사한다.

- **① 역할(Role):** `OWNER`(대표·1명) · `ADMIN`(관리자·1명) · `LEADER`(팀장) · `MEMBER`(사원) · `SYSTEM`(운영자, 확장)
- **② 리소스 소유권:** 역할과 **무관**하게 그 문서의 담당자만 가능.
  예) 회의 시작·녹음·파일 제출·종료·AI 검토 = **그 회의 담당자 1명만**(OWNER라도 담당자가 아니면 불가).
- **검증은 서버에서.** 화면 숨김은 UX일 뿐 보안이 아니다 — Server Action·BFF에서 반드시 재검사.
- 승인 흐름: `MEMBER 신청 → LEADER 중간승인 → OWNER/ADMIN 최종승인`.
- 비밀번호 변경·재설정 화면 **없음**(회사 통제, 재발급은 관리자 요청).

## 라우트 그룹 (제안 — 확정 시 갱신)

```
app/
├─ (public)/     /  /login  /register  /pricing  /invite/[token]
├─ (onboarding)/ /onboarding/*                     ← OWNER 초기설정
├─ (role)/       /owner  /manage  /team  /my       ← 역할 전용 대시보드·관리
├─ (app)/        /app/*                            ← 공용 워크벤치(권한 차등)
└─ (system)/     /system/*                         ← 확장(데모 제외)
```

- `(role)` 하위 4개는 **같은 셸(사이드바 220px)** 을 쓰고 네비 항목만 역할별로 달라진다 → 레이아웃 1개 + 역할별 네비 구성.
- `/owner`와 `/manage`는 **사원관리 권한이 사실상 동일** → 화면을 복붙하지 말고 **공용 컴포넌트 + 권한 prop**으로.
- `/app/*`은 공용 화면에서 권한만 다르다 → 라우트를 나누지 말고 **컴포넌트 레벨 가드**.

## 폴더·네이밍

- `src/`: `app/` · `components/`(ui·common·domain) · `features/<도메인>/` · `hooks/` · `lib/` · `types/` · `constants/` · `styles/`
- 컴포넌트 `PascalCase`·훅 `useXxx`·액션 `xxxAction`·상수 `UPPER_SNAKE`·boolean `is/has/should`·핸들러 `handle~`/prop `on~`
- props 인터페이스 명시 · `any` 금지(`unknown`+가드) · 200줄↑ 분리 · 로직=커스텀훅 · `enum` 금지(`as const`)

## 렌더링·데이터

- 조회=Server Component `async/await`(useEffect 페칭 X). cache: `force-cache`/`no-store`/`revalidate`.
- 폼=`useActionState`+`useFormStatus`(pending). multipart=`Content-Type` 수동설정 금지. `redirect()`=try/catch 밖.
- `use client` 최소화 · 데이터는 props로 · client가 server import 말고 `children`.
- 인증=**httpOnly 쿠키**, `localStorage` 토큰 금지. 라우트 보호는 `middleware.ts` + 서버 재검사.
- 알림=**SSE**(`/app/notification`). BFF가 스트림을 중계하고 토큰을 주입한다.

## 도메인 상수 (ERD 명칭과 100% 일치 · `as const` + 라벨맵)

| 대상          | 코드값                                                           |
| ------------- | ---------------------------------------------------------------- |
| 액션          | `TODO → IN_PROGRESS → DONE` (+파생 플래그 `DELAYED`)             |
| 액션 타입     | `TEAM` / `PERSONAL`(= `parentActionId`로 TEAM 참조)              |
| 프로젝트      | `IN_PROGRESS → DONE`                                             |
| 회의          | `SCHEDULED → IN_PROGRESS → DONE`                                 |
| 캡처 세션     | `IDLE → RECORDING → SUBMITTING → DONE`                           |
| AI 요약       | `PENDING → SUMMARIZING → REVIEWED → DISTRIBUTED`                 |
| 인수인계      | `DRAFT → SUBMITTED → MID_APPROVED → FINAL_APPROVED` / `REJECTED` |
| 인수인계 타입 | `VACATION` / `OFFBOARDING`                                       |
| 사원 상태     | `ACTIVE` / `ON_LEAVE` / `PENDING`(발급 후 미로그인)              |
| 회의 초대     | `PENDING` / `ACCEPTED` / `DECLINED`                              |
| 구독·결제     | `FREE`/`TEAM` · `PAID`/`UNPAID`/`CANCELED`                       |
| 기업(시스템)  | `ACTIVE` / `SUSPENDED` / `UNPAID`                                |

- **`DELAYED`는 상태가 아니라 파생값**(마감 경과) — 상태 필드에 넣지 말고 계산한다.
- 화면엔 한글 라벨, 코드엔 영문 상수. 라벨 하드코딩 금지.

## Mock → Live 격리막

- 컴포넌트=**UI계약 타입(types.ts)만** 의존. `server.ts`/`actions.ts`가 `isMock` 분기(mock | serverApi).
- **매퍼**가 BE shape → UI계약 흡수. 연동 시 **server·actions·매퍼만 수정, 컴포넌트 0줄.**
- ⚠️ ERD·API 스펙 **미확정**(BE 협의 전) → 지금은 목 기준. 확정되면 매퍼만 고친다.

## 연동 검증

- **BE 레포 실코드로** 경로·메서드·요청/응답 shape 확인. ⚠️ **Swagger·계약문서·구두 추측 금지.** 못 하면 "가정 shape·미검증" 주석.

## 디자인 토큰 (하드코딩 금지 · **CSS 변수로 정의**)

> 다크모드는 "확장"이지만 **토큰 구조는 Day-1**. 나중에 붙이면 전 화면을 다시 고쳐야 한다.

- **라이트:** 배경 `#FFFFFF` · 사이드바 `#FBFBFA` · 카드 `#FFFFFF`+보더 `#E7E5E4` · 섹션띠 `#FAFAF9`
- **다크:** 배경 `#1A1715` · 카드 `#242120` · 보조 `#2E2A28` · 보더 `#33302D` · 사이드바 `#151211` · 텍스트 `#FAFAF9` · 보조텍스트 `#A8A29E`
  - ⚠️ **순검정 금지.** 사이드바 < 배경 < 카드 순으로 밝아지게 유지한다(층이 보여야 한다).
  - 다크는 **전 페이지 적용**이다. 컴포넌트에서 `dark:` 클래스를 직접 쓰지 말고 토큰만 쓴다.
- **시맨틱:** 액센트 `#3B82F6` · 성공 `#22C55E` · 경고 `#F59E0B` · 에러 `#EF4444` / 상태점 대기=회색·진행중=초록·완료=보라
- **레이아웃:** 사이드바 220px + PageLayout 4종 — `list`(1440) · `detail`(1440 2컬럼) · `form`(960, 좌 네비 180px) · `centered`(560 세로중앙)
- 폼 2열(`FormRow`) · 제출 버튼 하단우측 · 로딩=스켈레톤 · 모션 100/150/250ms · 숫자 `tabular-nums`
- **카피:** ~해요체 · 날짜 `8월 5일(화)` · 역할 워딩은 영어
- 아이콘: `lucide-react` 표준 / 커스텀SVG=SVGR(`currentColor`). ❌이모지·`<img src=.svg>`

## 브라우저 API (캡처 화면) ⚠️

- **STT=`webkitSpeechRecognition`은 Chrome 계열 전용.** `'use client'` + `next/dynamic(ssr:false)` 필수.
- **미지원 브라우저는 안내를 띄운다** — 조용히 안 되는 척 금지(§정직성). 녹음 실패도 마찬가지.
- 자막↔메모는 **1:1 대응** 구조를 유지한다.

## SEO — 대상 아님

- 로그인 뒤 사내 도구다. **OG·sitemap·구조화 데이터 불필요**, `robots.ts`는 **noindex**.
- 단 **시맨틱 태그·`h1` 1개·`<a>`/`<Link>` 이동**은 a11y 이유로 그대로 지킨다.

## 컴포넌트 위생·a11y

- **만들기 전 재사용 확인:** `ui` > `common` > 도메인. 있으면 props화, 없을 때만 신규.
- a11y(RTL `getByRole` 직결): input=`label htmlFor`·버튼 이름/`aria-label`·img `alt`·모달 `role="dialog"`+포커스·클릭은 `button`/`a`.
- **DnD 보드는 키보드 대체 경로 필수**(드래그만으로 조작 가능하면 접근 불가).

## 성능

- CWV: **INP<200ms · CLS<0.1**, First Load JS<200KB. 무거운거 `next/dynamic`·개별 import·moment 금지(date-fns/dayjs).
- **고밀도 목록(결재·액션·회의)은 페이지네이션 우선**, 수백 행 넘어가면 가상화 검토.

## 테스트

- **작성 시점:** 로직/매퍼=짜자마자 · 컴포넌트(RTL)=mock 확정 후 핵심위주 · E2E=실연동 후. **마지막 몰빵 금지.**
- Jest+RTL(`next/jest`·jsdom) · `getByRole` 우선 · AAA · `user-event`. E2E=Playwright(auto-waiting).

## AI 기능

- 프론트 키 노출 금지 → **서버 프록시.** LLM 응답=**SSE 스트리밍**. 마크다운=`react-markdown`+`remark-gfm`+**`rehype-sanitize`(XSS)**.
- 대상: ①회의 요약(3줄·결정·액션) ②액션 분배 ③프로젝트 자동 매칭.
- ⚠️ **AI 아닌 것을 AI라 부르지 않는다** — STT(브라우저 기능)·인수인계 자동취합(규칙 기반)은 AI 표기 금지.
- ⚠️ 데모는 **목**이다(실 모델 미선정) → 목이면 주석·화면에 명시.

## Git·PR

- 이슈 번호가 브랜치·커밋·PR을 잇는다. 작업 전 이슈부터 만든다.
- 브랜치 `feature/{도메인}-{기능}#{이슈번호}` · `fix/{도메인}-{내용}#{이슈번호}` · `docs/{내용}#{이슈번호}`. base는 `develop`(`main`은 릴리즈용).
- 커밋 `type: 제목 #{이슈번호}`(한글 50자). type 9종: feat/fix/style/refactor/docs/chore/test/design/merge.
- PR 본문에 `Closes #{이슈번호}`.
- PR: 무엇·왜·확인법 + 리뷰 1명. ⛔ console·주석코드 커밋 · main/develop 직접push · `any` · 토큰 localStorage.

## AI(Claude)와 일하는 법 ⭐

1. **간결하게.** 답변·문서·주석 군더더기 없이. (길이는 프롬프트로만 줄어든다)
2. **요청한 범위만.** 안 시킨 리팩터·추가 파일 금지. 애매하면 **한 줄 묻고 진행**.
3. **검증은 알아서 — "다시 확인해" 지시 금지**(중복 작업). 단 **성공 기준**(스키마·필수 필드·연동 검증)은 명세이므로 유지.
4. **서브에이전트 위임은 크고 독립적인 작업만.** 검증용 위임 금지.
5. **코드리뷰에 "고위험만/보수적으로" 금지** — 전부 보고시키고 필터는 별도 단계.

## ⚠️[팀확정] (임의로 정하지 말 것)

- [ ] **ERD·API 스펙** (BE 협의 전) · **요구사항 명세 구체화**(역할별 세부 기능)
- [ ] 프론트 3인 분업 (A 캡처 / B 실시간 / C 뷰 — 제안 상태)
- [ ] 배포 환경(Vercel 추정) · 결제 실연동(Toss) 여부 · AI 실모델
- [ ] 온라인 회의 반영 시점 · "퇴사" 대체어(오프보딩) · 다크모드 적용 범위
- [x] (확정) 스택=**Next.js App Router** · 스타일=Tailwind+shadcn/ui · 데스크톱 1440 전용
