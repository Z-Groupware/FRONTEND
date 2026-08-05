# CLAUDE.md — Z (회의 기반 지식관리 그룹웨어) FE · 팀 공용 · 린

> 📌 살아있는 문서. **기술규칙=안정 / API=스펙 확정 후 갱신.** 예시·상세는 `docs/CONVENTIONS.md`, 팀이 정한 것·미정은 `DECISIONS.md`. **화면별 요구사항은 팀 명세·이슈**를 본다.
> **한 줄:** 회의를 캡처(STT·녹음)하면 AI가 요약·결정·액션을 추출해 담당자에게 하달한다.
> **스택:** Next.js(App Router) · TS · Tailwind · shadcn/ui. 데이터=**Server-First + Server Action + BFF + httpOnly 쿠키**.
> **⚠️ 로그인 뒤 사내 도구다.** 공개 페이지가 아니라 SEO·OG는 대상이 아니다(§SEO). **1440 기준 설계 + 반응형 여지 확보**(§디자인 토큰).

## 핵심 4원칙

1. **서버우선:** 조회=Server Component, `'use client'`=상호작용 잎사귀(버튼·폼·입력·캡처)만.
2. **변경(CUD)=Server Action + BFF:** 브라우저→Next서버(액션)→BE. 끝나면 `revalidatePath`. **토큰이 브라우저로 안 나간다**(사내 도구 = 권한이 핵심).
3. **정직한 목업:** 목=API 스펙 success 예시 그대로. 모든 화면 **loading/error/empty** 필수.
4. **⚡최적화=처음부터:** 이미지 `next/image`·폰트 `next/font`·무거운거 `next/dynamic`·시맨틱 태그. 쓰는 순간 적용.

## 권한 — **축이 2개다** ⭐

> 역할 가드만 짜면 안 된다. 리소스 소유권을 따로 검사한다.

- **① 역할(Role):** 화면·메뉴 접근. **역할 종류와 범위는 `DECISIONS.md`** 를 따른다(정책이라 바뀐다).
- **② 리소스 소유권:** 역할과 **무관**하게 그 문서의 담당자만 가능.
  예) 회의 시작·녹음·파일 제출·종료 = **그 회의 담당자 1명만**(OWNER라도 담당자가 아니면 불가).
- **③ 조직 계층:** **2계층**(부서 > 역할) 트리. 아랫단은 하위 부서가 아니라 **그 부서 안의 역할**이고 **비워둘 수 있다**(`없음`, 예: 팀장). 사원은 **부서에** 소속된다. 권한은 부서가 아니라 **직급**에서 온다 — LEADER 직급은 회사에 하나, 그 직급자는 **부서마다 한 명**. **LEADER는 자기 부서 전체**를 관리 → BE 응답에 **부서 경로** 필요(`isWithinDepartmentScope`).
- **검증은 서버에서.** 화면 숨김은 UX일 뿐 보안이 아니다 — Server Action·BFF에서 반드시 재검사.
- 권한 판정은 `lib/permission.ts` 한 곳에. 역할 상수를 화면에 하드코딩하지 않는다.
- ⚠️ **계층 비교로 짜지 않는다**(BE 컨벤션 확정). BE `@PreAuthorize`가 선형 계층이 아니라
  **엔드포인트마다 다른 기능 매트릭스**다 — 프론트도 `role >= LEADER` 같은 비교가 아니라
  **화면·액션 단위 판정 함수**(`canCreateProject` 등)로 짠다. 지금 구조가 이미 그렇다.
- 회의 참석자 지정·열람 범위는 역할마다 다르다 — `/app/meeting` 가드는 이 매트릭스를 따른다
  (값은 `lib/permission.ts`, 근거는 [`docs/WORKFLOW.md`](docs/WORKFLOW.md)).

## 라우트 그룹

app/
├─ (public)/ / /login /register /plans /roles /location /terms /privacy
│ ← 로그인 전. 기업 코드는 여기서만.
├─ (onboarding)/ /onboarding/1~3 · /payment · /done ← OWNER 초기설정 **4단계**(결제가 개통 관문)
│
├─ (role)/ ← 같은 셸(사이드바 220px), 네비 항목만 역할/권한별로 다름
│ ├─ /owner **base role = Owner 전용** : 대시보드 · /owner/setting(기업설정)
│ │ · /owner/leader-handovers(+/:id) — 팀장급 **오프보딩** 인수인계
│ ├─ /manage **Owner ‖ is_admin — 관리 기능 전부가 여기 하나로** :
│ │ /manage/members(+/:id) · /manage/new(계정발급) · /manage/rooms
│ │ · /manage/billing(구독·결제) · /manage/storage(용량)
│ ├─ /team **base role = Leader**(본인 부서 스코프) : 대시보드 · /team/members(+/:id)
│ │ · /team/action · /team/handover(+/:id)
│ └─ /my **base role = Member** 대시보드
│
├─ (app)/ /app/* ← 공용 워크벤치(로그인 전원, 컴포넌트 레벨 권한 차등)
│ projects(+/new·/:tag·/:tag/team/:teamId) · actions/:id · my/actions
│ · meeting(+/:id·/:id/capture·/:id/review) · rooms · board · calendar
│ · notice(+/:id·/new·/:id/edit) · people · me · search · handover
│
├─ (gate)/ /subscription ← 구독이 끊긴 회사의 재개 화면
└─ (system)/ /system/* ← 목업(더미), 향후 개선

- **기업 코드는 URL에 안 붙인다.** 기업 식별은 세션 쿠키(`companyId`). 코드는 로그인 전 화면(`/login`·`/register`)에만.
- `(role)` 4개는 **같은 셸(사이드바 220px)**, 네비만 역할별 → 레이아웃 1개 + 역할별 네비.
- :star: **ADMIN은 역할 아닌 플래그(`is_admin`).** 전용 대시보드 없이 base role 대시보드 사용, `/manage/*` 메뉴만 추가. 가드 = `role==="owner" || is_admin`. 관리 기능은 `/manage`로 단일화(중복 금지). 관리자 권한 부여 토글도 admin 조작 가능.
- :no_entry: 단 **`/owner/leader-handovers`(팀장 오프보딩 인수인계)는 OWNER 전용**(위계상 admin 불가). 팀장 휴직은 여기 말고 `/manage/members/:id`에서 승인.
- `/app/*`은 라우트 분리 대신 **컴포넌트 레벨 가드**. (`/app/my/actions`=OWNER 접근 불가 / `/app/projects/new`·기획 편집=OWNER만 / `/app/handover`=OWNER 제외)
- 진입 스코프만 다르고 데이터 같으면 라우트는 나누되 **상세 컴포넌트 재사용** (`/team/action` vs `/app/projects/:tag/team/:teamId`).
- 회의 생성 진입점 없음 → `/app/rooms` 예약 = 회의 개설.
- :no_entry: **명세에 없는 화면·기능은 안 만든다.** 화면 내 항목 순서도 명세 따름.
- ⚠️ **관리 기능은 `/manage/*` 하나로 모은다**(팀 URL 문서 2026-08-05). `/owner/*`에 두면 겸직자에게
  주소가 거짓말을 하고, 두 곳에 나눠 두면 같은 화면이 두 벌이 된다. 판정은
  `canManageBilling(actor)` 한 곳(`lib/permission.ts`)에서 한다.
- 📄 **화면별 동작·라벨·예외는 [`docs/WORKFLOW.md`](docs/WORKFLOW.md)** 를 본다(팀 정본).
  **정책·기능은 그 문서**, **라우트 경로 최신값은 위 트리**가 정본이다 — 어긋나면 각자 자기 몫을 따른다.

## 폴더·네이밍

- `src/`: `app/` · `components/`(ui·common·domain) · `features/<도메인>/` · `hooks/` · `lib/` · `types/` · `constants/` · `styles/`
- 컴포넌트 `PascalCase`·훅 `useXxx`·액션 `xxxAction`·상수 `UPPER_SNAKE`·boolean `is/has/should`·핸들러 `handle~`/prop `on~`
- props 인터페이스 명시 · `any` 금지(`unknown`+가드) · 200줄↑ 분리 · 로직=커스텀훅 · `enum` 금지(`as const`)

## 렌더링·데이터

- 조회=Server Component `async/await`(useEffect 페칭 X). cache: `force-cache`/`no-store`/`revalidate`.
- 폼=`useActionState`+`useFormStatus`(pending). multipart=`Content-Type` 수동설정 금지. `redirect()`=try/catch 밖.
- `use client` 최소화 · 데이터는 props로 · client가 server import 말고 `children`.
- 인증=**httpOnly 쿠키**, `localStorage` 토큰 금지. 라우트 보호는 `middleware.ts` + 서버 재검사.
- 알림=**SSE**. BFF(`/api/notifications/stream`)가 스트림을 중계하고 토큰을 주입한다.
  ⚠️ **알림 화면은 없다**(팀 워크플로우) — 상단 배너로만 띄운다. 없앤 건 화면이지 스트림이 아니다.
- 변경 결과 피드백=**토스트**(shadcn `sonner`, `<Toaster />`는 루트 레이아웃 1개). ❌폼 검증 오류(→필드 인라인)·파괴적 작업 확인(→Dialog)·페이지 전체 실패(→`error.tsx`). 토스트는 사라지므로 **보조**다.

## 요금제 — 유료 하나뿐 ⚠️

- **무료 요금제도 체험도 없다**(2026-08-04). 온보딩 4단계에서 **결제를 마쳐야** 워크스페이스가 열린다.
- **결제 전·해지 후는 플랜이 아니라 상태**다 — `SUBSCRIPTION_STATUS`(`ACTIVE`·`CANCELING`·`UNPAID`·`EXPIRED`). 쓸 수 있는지는 `canUseWorkspace()` 한 곳에서 판정한다.
- 화면에 **"무료"·"결제 없이"라고 쓰지 않는다.** 한 곳만 남아도 돈을 안 받는 것처럼 읽힌다(§정직성).
- 금액·포함량·단가의 정본은 **`billing/types.ts`의 `BillingConfig`** 하나이고 값은 BE가 준다.
  `pricing.ts`(계산)·`usage.ts`(소진율)·`plans.ts`(기능 목록)는 전부 거기서 파생된다(DECISIONS §요금제).

## 도메인 상수

- **`as const` + 라벨맵**으로 정의(`enum` 금지). 코드엔 영문 상수, 화면엔 한글 라벨 — **라벨 하드코딩 금지.**
- 값 목록은 **`constants/`에 정의**한다. 문서에 옮겨 적지 않는다(바뀌면 두 벌이 어긋난다).
  ⚠️ **ERD·API 스펙이 확정됐다**(BE 컨벤션 문서). 실제 값은 `constants/domain.ts`가 정본이고,
  **BE enum과 이름·값이 같아야 한다** — 다르면 매퍼에서 조용히 어긋난다.
- 마감 경과 같은 **파생값은 상태 필드에 넣지 말고 계산**한다.
  예) 액션 상태는 **저장 3개**(`할일`·`진행중`·`완료`), **`지연`은 마감일로 계산해 표시**한다.
- 액션 마감일: AI가 안 집으면 **프로젝트 마감일**이 기본, 집으면 그 값. 어느 쪽이든
  **검토 화면에서 [액션 분배 확정]을 누른 시점의 값이 최종**이다 — 그 뒤로 자동 변경 없음.
- 🚫 **화면에 안 내보내는 것:** 내부 식별자(`GOODS-01`)·임의 해시태그(`#OKR`). 태그는
  **프로젝트 태그 하나뿐**이다 — 없는 걸 금지 문장으로만 두면 나중에 누가 만든다(§CONVENTIONS 6).

## Mock → Live 격리막

- 컴포넌트=**UI계약 타입(types.ts)만** 의존. `server.ts`/`actions.ts`가 `isMock` 분기(mock | serverApi).
- **매퍼**가 BE shape → UI계약 흡수. 연동 시 **server·actions·매퍼만 수정, 컴포넌트 0줄.**
- ⚠️ ERD·API 스펙은 **확정됐다**(BE 컨벤션 문서). 아직 배포된 API가 아니라 목으로 개발하되,
  **매퍼는 확정된 shape 기준으로** 짠다 — 목 shape을 따로 지어내면 연동 때 두 번 고친다.

## 연동 검증

- **BE 레포 실코드로** 경로·메서드·요청/응답 shape 확인. ⚠️ **Swagger·계약문서·구두 추측 금지.**
  못 하면 "가정 shape·미검증" 주석. **컨벤션 문서가 나왔어도 이 원칙은 그대로다** — 그건 규약이지
  배포된 스펙이 아니다.
- 응답 봉투는 성공 `{ httpStatus, message, data }` · 실패 `{ errorCode, message, timestamp, path, traceId, details }`.
  **`data`만 꺼내 UI 계약으로 옮기는 건 매퍼의 일**이고, 컴포넌트는 봉투를 모른다.
- 오류 문구는 **`errorCode` 문자열로 매핑**한다(BFF·매퍼에서). 접두어 규칙을 화면에 하드코딩하지 않는다 —
  결제 실패를 코드로 받아 문구를 우리가 정하는 것(`billing/payment.ts`)과 같은 방식이다.

## 디자인 토큰 (하드코딩 금지 · **CSS 변수로 정의**)

> 다크모드는 "확장"이지만 **토큰 구조는 Day-1**. 나중에 붙이면 전 화면을 다시 고쳐야 한다.

- **라이트:** 배경·셸 `#FFFFFF` · 카드 `#FFFFFF`+보더 `#E7E5E4` · 섹션띠 `#FAFAF9`
- **다크:** 배경·셸 `#1A1715` · 카드 `#242120` · 보조 `#2E2A28` · 보더 `#33302D` · 텍스트 `#FAFAF9` · 보조텍스트 `#A8A29E`
  - ⚠️ **순검정 금지**(다크 최저값 `#1A1715`).
  - **셸 껍데기(사이드바·상단바)는 `--background` 한 색**, 본문은 같은 색 + `.bg-dot-grid`, 카드만 `--card`.
    색으로 층을 3단 나누지 않는다 — 화면이 조각나 보인다(DECISIONS §셸 표면).
  - 다크는 **전 페이지 적용**이다. 컴포넌트에서 `dark:` 클래스를 직접 쓰지 말고 토큰만 쓴다.
- **시맨틱:** 액센트 `#3B82F6` · 성공 `#22C55E` · 경고 `#F59E0B` · 에러 `#EF4444` / 상태점 할일=회색·진행중=초록·완료=보라·**지연=빨강**(마감일로 계산)
- **포커스 링은 먹색**(`--ring`). 색으로 알리는 건 **에러(빨강)뿐** — 나머지는 명도·아이콘·문구로 구분한다.
- **레이아웃:** 사이드바 220px + PageLayout 4종 — `list`(1440) · `detail`(1440 2컬럼) · `form`(960, 좌 네비 180px) · `centered`(560 세로중앙)
  - ⚠️ **위 폭은 목표치이지 고정값이 아니다.** `w-[1440px]` 대신 `mx-auto max-w-[1440px] px-8`, absolute 대신 flex/grid, 표는 `overflow-x-auto`로 감싼다. 사이드바는 컴포넌트로 분리(모바일은 Sheet).
  - 반응형 전면 구현은 지금 안 한다. 대상 화면 선별은 디자인 확정 후.
- 폼 2열(`FormRow`) · 제출 버튼 하단우측 · 로딩=스켈레톤 · 모션 100/150/250ms · 숫자 `tabular-nums`
- **카피:** **~합니다체**(2026-08-04 변경) · 날짜 `8월 5일(수)` · 역할 워딩은 영어
  - 사내 도구이고 **돈·권한·기록이 걸린 화면**이라 친근한 말투가 오히려 가볍게 읽힌다. `들어올 수 없어요` → `접근할 수 없습니다`.
  - 명령은 **`~해 주세요`** 를 쓴다. `~하십시오`는 딱딱해서 안 쓴다.
  - ⚠️ 옛 화면에 `~해요체`가 남아 있으면 그건 이 변경 전 것이다.
- 아이콘: `lucide-react` 표준 / 커스텀SVG=SVGR(`currentColor`). ❌이모지·`<img src=.svg>`

## 브라우저 API (캡처 화면) ⚠️

- **STT=`webkitSpeechRecognition`은 Chrome 계열 전용.** `'use client'` + `next/dynamic(ssr:false)` 필수.
- **미지원 브라우저는 안내를 띄운다** — 조용히 안 되는 척 금지(§정직성). 녹음 실패도 마찬가지.
- 자막↔메모는 **1:1 대응** 구조를 유지한다.
- **파이프라인 확정**(BE 옵션 A): STT 텍스트=요약 입력 · 음성파일=아카이브·다시듣기 자산 ·
  메모=제출 즉시 저장(**빈 제출 허용**). 음성파일 업로드가 끝나야 **종료 버튼이 뜬다**.
- ⚠️ **초안과 생성을 가른다.** 회의 종료 → AI 요약은 **담당자·마감일이 채워진 초안**까지다.
  **실제 액션은 검토 화면에서 [액션 분배 확정]을 눌러야 생긴다** — 반려(✕)한 항목은 안 생긴다.
- ⚠️ **AI 검토 화면은 있다**(`/app/meeting/:id/review`, 2026-08-05 확정). BE 컨벤션 문서에는
  "검토 화면 없음"으로 적혀 있으나 **틀린 값이다** — 담당자·마감일을 고칠 자리가 없으면
  잘못 뽑힌 액션이 그대로 하달된다. **[액션 분배 확정]을 눌러야 실제로 생성된다.**
- 회의 예약은 **30분 단위 한 타임**이다(확정). 연속 예약으로 늘리지 않는다.

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

- [x] (확정) **ERD·API 스펙** — BE 코드 컨벤션 문서로 도메인 모델·Enum·에러코드까지 확정.
      값은 `constants/domain.ts`, 응답 봉투는 §연동 검증. ⚠️ **배포 스펙은 아니므로 구현 때 BE 레포로 재확인.**
- [ ] **디자인 시안** — 화면 목록은 확정됐으나 시안은 미정
- [ ] 프론트 3인 분업 (A 캡처 / B 실시간 / C 뷰 — 제안 상태)
- [ ] 배포 = **AWS 확정, 서비스 미정**(Amplify/ECS/EC2). ⚠️ 정적 배포는 불가 — Server Action·BFF·SSE가 Node 서버를 요구한다 · AI 실모델
- [ ] 온라인 회의 반영 시점 · "퇴사" 대체어(오프보딩)
- [ ] **캡처 잔여 3건**(BE 미확정) — 청크 통합본 저장 주체(BE ‖ 프론트) · 참석자 실시간 자막
      중계(socket.io) 유지 여부 · 담당자 STT 미지원 시 폴백
- [x] (확정) **결제는 Toss** — BE `billing` 도메인 확정. 프론트 이음매는 `billing/payment-method.ts`
- [x] (확정) **캡처 파이프라인 = 옵션 A** — §브라우저 API 참고
- [ ] 모바일 대응 화면 선별 (디자인 확정 후)
- [x] (확정) 스택=**Next.js App Router** · 스타일=Tailwind+shadcn/ui · **1440 기준 + 반응형 여지 확보** · 다크모드 전 페이지 · 기업 코드는 URL에 없음(세션)
