# SETUP.md — Z 레포 세팅 & 개발 인프라 (팀 공용)

> 이 문서 = **CONVENTIONS(규칙)를 실제로 굴러가게 하는 인프라.** 프론트 3인이 화면을 병렬로 찍어도 구조·품질이 흐트러지지 않게 하는 세팅.
> 우선순위: 🟢 **레포 만들 때 바로**(나중에 리트로핏 비쌈) → 🔵 **개발 초반** → ⚪ **여유되면** → ⛔ **스킵**.
> 도입 여부는 `DECISIONS.md`에서 먼저 합의한다.

## 🎯 가장 큰 레버 3가지 (이것만이라도)

1. **zod 계약 SSOT + 매퍼 `safeParse`** → **Z는 ERD·API가 아직 없다.** 목으로 먼저 가고 나중에 BE를 붙이는 구조라, shape가 어긋나면 가짜 데이터가 화면에 뜬 채 모르고 지나간다. zod가 그걸 **연동 전에 터뜨린다.**
2. **plop 스캐폴딩 + 골든 레퍼런스 도메인 1개** → 구조를 매번 새로 발명하지 않고 **정해진 칸만** 채운다. 3명이 각자 다른 구조로 짜는 것도 막는다.
3. **CI required checks + 엄격 타입** → '그럴듯해 보임'이 아니라 **'빌드·타입으로 증명됨'** 을 머지 기준으로.

---

# 🟢 Day-1 (레포 만들 때 바로)

## 1. CI 머지 게이트 + 브랜치 보호 `[M]`

**목적:** 3인 병렬 머지에서 한 명의 빌드/타입 깨짐이 develop 전체를 막는 걸 방지.

```json
"scripts": {
  "typecheck": "tsc --noEmit",
  "lint": "next lint",
  "test": "jest",
  "build": "next build"
}
```

`.github/workflows/ci.yml`:

```yaml
name: CI
on: { pull_request: { branches: [develop, main] } }
concurrency: { group: ci-${{ github.ref }}, cancel-in-progress: true }
jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: npm }
      - run: npm ci
      - run: npm run typecheck
      - run: npm run lint
      - run: npm run test -- --ci --passWithNoTests
      - run: npm run build
```

**GitHub Settings → Branches → develop:** 위 4잡을 **Required status checks** + "머지 전 최신화 필수" + 리뷰 1명 + 직접 push 금지.

## 2. 엄격 타입 게이트 + 서버/클라 경계 `[S]`

**목적:** AI 최빈 결함(조용한 `any`·인덱스 미검증·`'use client'`에 서버 import = **쿠키/토큰 번들 유출**)을 빌드 실패로 차단.

> Z는 사내 도구라 **토큰 유출 = 조직 전체 데이터 유출**이다. 이 항목은 선택이 아니다.

`tsconfig.json`:

```json
"compilerOptions": {
  "strict": true,
  "noUncheckedIndexedAccess": true,
  "noImplicitOverride": true,
  "forceConsistentCasingInFileNames": true
}
```

ESLint 핵심 룰:

```js
"@typescript-eslint/no-explicit-any": "error",
"@typescript-eslint/no-floating-promises": "error"
```

**경계:** 서버 전용 모듈(BFF·server actions·쿠키·권한 판정) 최상단에 `import 'server-only'`, 클라 전용엔 `import 'client-only'`.

## 3. ⭐ zod 계약 SSOT + 매퍼 `safeParse` `[M]`

`features/<도메인>/schemas.ts` (단일 소스):

```ts
import { z } from "zod";

// 입력 계약 (폼·서버액션·타입 공유)
export const actionInput = z.object({
  title: z.string().min(1, "제목을 입력하세요"),
  assigneeId: z.number().int().positive(),
  dueDate: z.string().date(),
  type: z.enum(["TEAM", "PERSONAL"]),
  parentActionId: z.number().int().positive().optional(), // PERSONAL만
});
export type ActionInput = z.infer<typeof actionInput>; // 타입도 여기서 파생

// BE 응답 계약 (격리막 매퍼가 검증)
export const actionRes = z.object({
  id: z.number(),
  status: z.enum(["TODO", "IN_PROGRESS", "DONE"]),
  /* … BE shape (확정 시 갱신) */
});
```

매퍼 경계 (`server.ts`):

```ts
const parsed = actionRes.safeParse(raw);
if (!parsed.success) {
  if (process.env.NODE_ENV !== "production") throw new Error(`BE 계약 불일치\n${parsed.error}`);
  captureException(parsed.error); // prod는 로깅 + 타입드 폴백
  return null;
}
return toAction(parsed.data); // → UI 계약
```

서버 액션 검증:

```ts
const v = actionInput.safeParse(input);
if (!v.success) return { ok: false, fieldErrors: v.error.flatten().fieldErrors };
```

> 폼은 서버우선 유지(`useActionState`+`useFormStatus`). 무거운 클라 폼만 `@hookform/resolvers/zod` 선택 결합.

## 4. ⭐ plop 스캐폴딩 + 골든 레퍼런스 `[M]` — 최고 ROI

`npm i -D plop` → `plop domain <이름>`:

```
features/<도메인>/
├─ schemas.ts       # zod + z.infer 스텁
├─ types.ts         # UI 계약
├─ server.ts        # mock|live 분기 + safeParse 매퍼 자리
├─ actions.ts       # isMock 분기 + 검증 파이프라인 골격
├─ mock/fixtures.ts # faker 팩토리 자리
├─ components/
├─ <도메인>.test.tsx
└─ README.md        # 슬라이스 규칙 스텁
```

라우트 제너레이터: `(role)`/`(app)` 그룹 + `loading.tsx`·`error.tsx` 동봉.

**골든 레퍼런스 = `액션(actions)` 도메인 추천.** 상태 3개(단순) + `TEAM`/`PERSONAL` 2계층 + 보드·타임라인 + 권한 분기까지 다 걸쳐서 본보기로 좋다. **1개를 끝까지**(서버조회+서버액션+zod매퍼+mock/live+테스트+a11y) 완성한 뒤 규칙 문서에 _"나머지 도메인은 이걸 그대로 미러링한다"_ 명시.

## 5. shadcn/ui 프리미티브 + cva + cn `[M]`

**목적:** Z는 **폼·테이블·모달·캘린더 천지**다. raw div로 손코딩하면 3명 스타일이 갈리고 a11y가 샌다.

```bash
npx shadcn@latest init
npx shadcn@latest add button input select dialog sheet table calendar popover form tabs badge skeleton
```

- 변형=`class-variance-authority(cva)`, 클래스 병합=`cn`(tailwind-merge). Toast=`sonner` 래핑.
- **디자인 토큰 단일 소스 = `globals.css`의 CSS 변수.** 라이트·다크 값을 **Day-1에 둘 다** 정의한다(CONVENTIONS §8) — 나중에 붙이면 47화면 전면 수정.

## 6. 라우트 그룹 + 공유 셸 1인 소유 `[M]`

```
app/
├─ (public)/      /  /login  /register  /pricing  /invite/[token]
├─ (onboarding)/  /onboarding/*
├─ (role)/        owner | manage | team | my      ← 셸 공유, 네비만 역할별
├─ (app)/         /app/*                          ← 공용 워크벤치(권한 차등)
├─ (system)/      /system/*                       ← 확장
└─ layout.tsx · globals.css · middleware.ts · providers   ← ⚠️ 셸 담당 1인 단독 소유 + 별도 PR로만
```

- `(role)` 4개는 **레이아웃 1개 + 역할별 네비 구성**으로. 4벌 복붙 금지.
- `/owner`·`/manage`는 사원관리 권한이 거의 같다 → **공용 컴포넌트 + 권한 prop.**
- 개발 중 **역할 강제 전환 dev 토글**(쿠키/쿼리)로 4역할 화면을 즉시 확인 — `/preview/roles`가 그 자리다.

## 7. Husky + lint-staged + Prettier + import 정렬 `[S]`

```bash
npm i -D husky lint-staged prettier prettier-plugin-tailwindcss eslint-plugin-simple-import-sort
npx husky init
```

- pre-commit: staged만 `eslint --fix` + `prettier --write`
- pre-push: `tsc --noEmit`
- `prettier-plugin-tailwindcss` = 클래스 순서 자동정렬 / `simple-import-sort` = import 순서 결정론적

## 8. commitlint `[S]`

```bash
npm i -D @commitlint/cli @commitlint/config-conventional
```

commit-msg 훅 연결. 규칙(`feat: 회의 캡처 버튼 #12`) 위반 커밋 거부.
type 9종 허용(`feat/fix/style/refactor/docs/chore/test/design/merge`) + 제목 끝 `#{이슈번호}` 필수 — `config-conventional` 기본값과 다르니 `commitlint.config.js`에서 `type-enum`·커스텀 룰로 덮어쓴다.
⚠️ DECISIONS.md에서 **commitlint 하드 블록은 채택 안 함**으로 결론난 상태다(마찰). 이 항목은 도입 시에만 적용.

## 9. `.claude/commands` 슬래시 + 셀프체크 훅 + DoD `[S]`

- `.claude/commands/`에 재사용 프롬프트 커밋: `/new-screen` · `/integrate <domain>` · `/dod`
- **파일 저장 후 자동 검사 훅**: 편집 직후 `tsc --noEmit` + `eslint --fix`를 돌려 '완료' 전에 걸러낸다.
- **`/dod`** = 부록 A.

## 10. CODEOWNERS + 오너십 맵 `[S~M]`

분업이 **화면 축 3분할**(`DECISIONS.md` A-1)일 때 예시:

```
# .github/CODEOWNERS
/src/app/(app)/meeting/**  /src/features/meeting/**     @devA   # 워크벤치(캡처·AI검토 포함)
/src/app/(app)/board/**    /src/features/{action,project,handover}/**   @devB   # 업무
/src/app/(role)/**         /src/features/{member,room,billing}/**       @devC   # 조직
/src/app/layout.tsx  /src/app/globals.css  /src/components/ui/**        @devC   # 공유 셸 단독
/src/**/schemas.ts   /src/types/**                       @devA @devB @devC      # 계약=공동소유
```

- `OWNERSHIP.md`에 3분할을 명문화한다.
- ⚠️ **캡처(녹음)와 STT(자막)는 한 화면이다** → 반드시 **같은 사람**에게. 나누면 충돌한다.

## 11. 타입드 엔드포인트 레지스트리 `[M]`

**목적:** 존재하지 않는 API 경로가 코드에 박히는 것을 막는다. **Z는 API 스펙이 없어서 경로를 임의로 적기 쉽다.**

```ts
// lib/endpoints.ts — 실재(또는 합의된) 경로만 여기에
export const ep = {
  meetings: () => "/api/meetings",
  meeting: (id: number) => `/api/meetings/${id}`,
  actions: () => "/api/actions",
} as const;
```

규칙: `serverApi`/`fetch`에 **문자열 URL 리터럴 금지, `ep.*`만.**
⚠️ 지금은 **FE 제안 경로**다. BE 합류 시 이 파일을 **가장 먼저** 맞춘다.

---

# 🔵 개발 초반

## A. 공용 목 팩토리(faker ko) + mock/live 패리티 테스트 `[S]`

```bash
npm i -D @faker-js/faker
```

- `mocks/factories.ts`: `makeMeeting`·`makeAction`·`makeMember`·`makeHandover`(한글 이름·부서·직급·시간대). isMock 액션·`/preview`·Jest가 **전부 재사용**.
- **패리티 테스트:** 모든 fixture를 라이브 매퍼가 쓰는 **바로 그 zod 스키마로 `parse`** → "목은 되는데 live 깨짐"을 연동 전에 잡는다.
- ⚠️ 팩토리는 **1명이 소유**한다. 3명이 각자 만들면 shape가 갈린다.

## B. `/preview` 카탈로그 활용 `[S]` (Storybook 대체)

- 화면 목록에 이미 `/preview` `/preview/roles` `/preview/layout`이 있다. 여기에 **컴포넌트 상태(로딩/에러/빈/롱텍스트)** 까지 넣는다.
- `NODE_ENV!=='production'` 게이트. RSC 네이티브·의존성 0으로 Storybook 효용 90%.
- **`/preview/roles`가 권한 검증의 핵심 도구**다 — 4역할 화면을 한 자리에서 비교.

## C. 피처별 슬라이스 규칙 문서 `[M]`

- `features/<도메인>/`, `app/api/`(BFF)에 슬라이스별 규칙·소유자·mock/live 패턴을 담은 **짧은 규칙 문서**를 둔다.
- 루트 규칙은 린하게 유지하고, 세부는 해당 폴더에서 본다 → "남 코드 몰라 막힘" 해소.
- **권한 규칙(CONVENTIONS §7)은 이 슬라이스 문서에도 짧게 반복**한다 — 역할 가드만 짜는 실수가 제일 흔하다.

## D. Contract-First 선(先)머지 `[S]`

- 병렬 착수 **전에**, 작은 `contract` PR(도메인 `schemas.ts`/`types.ts` + 공용 `fixtures.ts`)을 develop에 먼저 머지 → 3인이 한 shape 공유.
- **Z는 ERD가 없어서 이게 특히 중요하다.** FE가 계약 드라이버가 된다.

## E. Knip (데드코드 검출) `[S]`

- `npm i -D knip` → CI에 추가(처음엔 리포트, 안정화 후 차단).

---

# ⚪ 여유되면 / 발표 임박

- **BE 서브모듈 + `openapi-typescript`** (BE 합류 후) — 목 단계엔 반대로 **zod → OpenAPI export**(FE가 계약 드라이버).
- **`size-limit` 번들 예산** — STT·녹음·캘린더·DnD가 조용히 번들을 부풀리는 것 차단.
- **Playwright 스모크(Vercel 프리뷰)** — 핵심 라우트 렌더 성공 + 콘솔 에러 0. **역할별 스모크**를 넣으면 권한 회귀를 잡는다.

---

# ⛔ 스킵 (1개월·3인엔 과함)

| 항목                        | 이유                                                 |
| --------------------------- | ---------------------------------------------------- |
| 정식 Storybook              | RSC 지원 거칠고 유지비↑ → `/preview`로 90% 효용      |
| GitHub merge queue          | 3인 규모엔 과투자                                    |
| MSW                         | isMock 분기 + zod 픽스처로 이미 완결                 |
| 반응형·모바일 대응          | **데스크톱 1440 전용**이 확정. 지금 만들면 낭비      |
| SEO 인프라(sitemap·OG 전면) | 로그인 뒤 도구 → 랜딩·요금제만 예외(CONVENTIONS §16) |

---

# 부록 A. Definition of Done (`/dod` — PR 전 자가검증)

- [ ] 타입이 zod에서 파생(`z.infer`)인가
- [ ] 매퍼에 `safeParse` 있고 실패 시 dev throw / prod 폴백+로그인가
- [ ] `isMock` 분기 + 정직 주석 있나 (목·미구현·폴백 명시)
- [ ] 엔드포인트가 `ep.*` 상수인가 (문자열 URL·환각 아님)
- [ ] **권한 2축을 다 검사했나** — 역할 가드 + **리소스 소유권**(회의 담당자 등), 그리고 **서버에서 재검사**
- [ ] `tsc` / `lint` / `test` 그린
- [ ] mock/live 패리티 테스트 통과
- [ ] a11y (label·role·alt·**키보드**) / `loading.tsx`·`error.tsx` 존재 / DnD면 키보드 대체 경로
- [ ] 이미지 `next/image` · 무거운 것 `dynamic` · 시맨틱 태그
- [ ] 브라우저 전용 API(STT·녹음) 쓰면 **미지원·권한거부 안내**가 있나

# 부록 B. 레포 최종 폴더

```
레포/
├─ CLAUDE.md               # 규칙 린 버전
├─ SETUP.md  DECISIONS.md  OWNERSHIP.md
├─ docs/CONVENTIONS.md     # 풀 규칙
├─ .github/                # ci.yml · CODEOWNERS · PR/이슈 템플릿
├─ .claude/                # commands/ · settings.json(훅)
├─ plop-templates/  plopfile.js
├─ src/
│  ├─ app/ (public)/ (onboarding)/ (role)/ (app)/ (system)/ preview/ api/
│  ├─ components/ ui/ common/ domain/
│  ├─ features/<도메인>/{schemas,types,server,actions,components,*.test}
│  ├─ mocks/factories.ts   lib/{endpoints,permission,utils}   types/ constants/ styles/
```
