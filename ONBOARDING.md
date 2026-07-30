# 팀원 가이드북 — 뭐가 바뀌었고, 앞으로 어떻게 작업하나

> **처음 오셨거나, 세팅 PR 이후로 뭐가 달라졌는지 모르겠으면 이 문서부터 읽으세요.**
> 읽는 데 10분, 따라 하는 데 5분입니다.

---

## 목차

1. [3줄 요약](#1-3줄-요약)
2. [처음 시작하기 (5분)](#2-처음-시작하기-5분)
3. [무엇이 바뀌었나 — Before / After](#3-무엇이-바뀌었나--before--after)
4. [매일 쓰는 작업 흐름](#4-매일-쓰는-작업-흐름)
5. [새로 생긴 규칙 6가지](#5-새로-생긴-규칙-6가지)
6. [⚠️ 처음에 꼭 만나는 에러들](#6-️-처음에-꼭-만나는-에러들)
7. [문서 5종 — 언제 뭘 읽나](#7-문서-5종--언제-뭘-읽나)
8. [작업 순서 & 올리기 전 확인](#8-작업-순서--올리기-전-확인)
9. [자주 묻는 것](#9-자주-묻는-것)

---

## 1. 3줄 요약

1. **PR을 올리면 자동 검사 4개가 돈다.** 하나라도 빨간불이면 머지가 안 된다.
2. **커밋할 때 코드가 자동으로 정리된다.** 포맷 논쟁 없음. 대신 규칙 위반이면 커밋이 거부된다.
3. **규칙은 전부 문서에 있다.** 헷갈리면 사람한테 묻지 말고 문서를 먼저 본다.

---

## 2. 처음 시작하기 (5분)

```bash
git clone https://github.com/module06-4/FRONTEND.git
cd FRONTEND
npm install          # 훅도 여기서 자동 설치된다 (prepare 스크립트)
npm run dev          # http://localhost:3000
```

**확인:** 아래 4개가 다 통과하면 세팅 성공.

```bash
npm run typecheck    # 타입 검사
npm run lint         # 코드 규칙 검사
npm run test         # 테스트 (아직 없어도 통과)
npm run build        # 프로덕션 빌드
```

> 💡 이 4개가 **PR에서 자동으로 도는 것과 똑같은 검사**다. PR 올리기 전에 로컬에서 돌려보면 빨간불을 미리 막을 수 있다.

---

## 3. 무엇이 바뀌었나 — Before / After

### 🔴 이건 몰랐다가 당황하기 쉬움

|                   | 전        | 후                                                              |
| ----------------- | --------- | --------------------------------------------------------------- |
| **커밋**          | 그냥 됨   | **커밋 직전에 자동 검사·정리가 돈다.** 규칙 위반이면 **거부됨** |
| **푸시**          | 그냥 됨   | **푸시 직전에 타입 검사**가 돈다. 타입 에러면 **거부됨**        |
| **PR**            | 올리면 끝 | **자동 검사 4개**가 돌고, 빨간불이면 머지 못 함                 |
| **`any` 사용**    | 경고만    | **에러 → 빌드 실패**                                            |
| **`console.log`** | 자유      | **에러 → 커밋 거부** (`console.warn`/`error`는 허용)            |

### 🟢 이건 편해진 것

|               | 전             | 후                                                                    |
| ------------- | -------------- | --------------------------------------------------------------------- |
| 코드 포맷     | 각자 다름      | **저장·커밋 시 자동 통일** (들여쓰기·따옴표·Tailwind 클래스 순서까지) |
| import 순서   | 각자 다름      | **자동 정렬** → diff 깨끗해지고 머지 충돌 감소                        |
| UI 컴포넌트   | 매번 직접 만듦 | **shadcn/ui 14종** 이미 있음 (버튼·인풋·모달·테이블·탭 등)            |
| 색상          | 하드코딩       | **디자인 토큰**(CSS 변수)으로 통일. 다크모드 값도 이미 정의됨         |
| 상태값 문자열 | 직접 타이핑    | **`constants/domain.ts`에 12종 상수 + 한글 라벨**                     |
| 권한 체크     | 각자 구현      | **`lib/permission.ts`에 함수로**                                      |
| 이슈·PR 쓰기  | 빈칸부터       | **템플릿 자동 적용** (Z 역할·작업영역·체크리스트 포함)                |

### 📁 새로 생긴 파일들

```
CLAUDE.md              ← 규칙 요약본 (린)
DECISIONS.md           ← 팀이 뭘 확정했고 뭐가 미정인지
SETUP.md               ← 인프라 로드맵 (왜 이렇게 깔았는지)
ONBOARDING.md          ← 지금 읽는 이 문서
docs/CONVENTIONS.md    ← 상세 규칙 (예시·코드 포함)

.github/
├─ workflows/ci.yml         ← 자동 검사
├─ PULL_REQUEST_TEMPLATE.md
└─ ISSUE_TEMPLATE/{feature,fix,docs}.md

src/
├─ constants/domain.ts      ← 도메인 상수 12종
├─ lib/permission.ts        ← 권한 판정 (서버 전용)
├─ lib/endpoints.ts         ← API 경로 모음
└─ components/ui/           ← shadcn 14종
```

---

## 4. 매일 쓰는 작업 흐름

```
① 이슈 만들기  →  ② 브랜치  →  ③ 코드  →  ④ 커밋  →  ⑤ 푸시  →  ⑥ PR  →  ⑦ 리뷰 1명  →  ⑧ 머지
```

### ① 이슈 만들기

GitHub → Issues → New issue → **템플릿 3종 중 선택** (Feature / Fix / Docs)
템플릿이 자동으로 뜬다. **빈칸을 지우지 말고 채운다** (안 쓰는 항목은 그대로 두기).

> 📌 **만들고 나면 이슈 번호(#12 같은 것)를 기억해 두자.** 브랜치·커밋·PR 세 군데에 전부 들어간다.

### ② 브랜치

```bash
git checkout develop
git pull
git checkout -b feature/meeting-capture#12     # 또는 fix/... · docs/...
```

- **base는 항상 `develop`** (`main`은 릴리즈용, 우리는 안 건드림)
- 형식: `feature/{도메인}-{기능}#{이슈번호}` · `fix/{도메인}-{내용}#{이슈번호}` · `docs/{내용}#{이슈번호}`
- 뒤에 이슈 번호를 붙이는 이유: 브랜치가 여러 개 쌓여도 **어느 이슈 작업인지 이름만 보고 안다.**

### ③ 코드

- 새 컴포넌트 만들기 전에 **`src/components/ui/`에 이미 있는지 확인**
- 색은 하드코딩 대신 **토큰** (`bg-background`, `text-muted-foreground` 등)
- 상태 문자열은 **`constants/domain.ts`에서 import**

### ④ 커밋

```bash
git add .
git commit -m "feat: 회의 캡처 녹음 버튼 #12"
```

> ⏳ **커밋할 때 몇 초 멈춘다.** 자동으로 lint·포맷을 돌리는 중이니 정상이다.
> ❌ **거부되면** 아래 [6번](#6-️-처음에-꼭-만나는-에러들)을 보자.

**커밋 메시지 형식:** `type: 제목 #{이슈번호}` (한글 50자 이내)
`feat` · `fix` · `style` · `refactor` · `docs` · `chore` · `test` · `design` · `merge`

### ⑤ 푸시

```bash
git push -u origin feature/meeting-capture#12
```

> ⏳ **푸시할 때도 멈춘다.** 타입 검사 중이다.

### ⑥ PR

```bash
gh pr create --base develop     # 또는 GitHub 웹에서
```

**PR 템플릿이 자동으로 뜬다.** 체크리스트를 **실제로 확인하고** 체크하자 (형식적으로 다 체크하면 의미 없음).
본문에 **`Closes #이슈번호`** 를 꼭 넣는다 → 머지되면 이슈가 자동으로 닫힌다.

### ⑦⑧ 리뷰 · 머지

- 자동 검사 4개가 **초록**이어야 함
- **리뷰 1명 승인** 후 머지
- ⛔ **본인 PR 본인 머지 금지**

---

## 5. 새로 생긴 규칙 6가지

### 규칙 1. 🔐 권한은 **축이 2개**다 — 제일 중요

Z에서 가장 틀리기 쉬운 부분이다.

```
① 역할(Role)     : OWNER / ADMIN / LEADER / MEMBER
② 리소스 소유권   : 역할과 무관하게 "그 문서의 담당자만"
```

**예시:** 회의 시작·녹음·제출·종료·AI검토는 **그 회의 담당자 1명만** 할 수 있다.
**OWNER(대표)라도 담당자가 아니면 못 한다.**

```ts
import { canOperateMeeting, assertPermission } from "@/lib/permission";

// Server Action 안에서
assertPermission(canOperateMeeting(actor, meeting));
```

> ⚠️ **화면에서 버튼을 숨기는 건 보안이 아니다.** 서버(Server Action·BFF)에서 **반드시 다시 검사**한다.

### 규칙 2. 🎨 색을 직접 쓰지 않는다

```tsx
❌ <div className="bg-[#FBFBFA] text-[#1C1917]">
✅ <div className="bg-sidebar text-foreground">
```

이유: **다크모드가 이미 전 페이지에 켜져 있다.** 토큰을 쓰면 다크 대응이 공짜로 따라오고, 하드코딩하면 그 화면만 다크에서 깨진다.

> 📌 **`dark:` 클래스를 직접 쓰지 않는다.** `bg-card`처럼 토큰만 쓰면 테마가 알아서 뒤집힌다.
> `dark:`가 필요하다고 느껴지면 대부분 **토큰을 안 쓴 것**이니 먼저 토큰을 확인하자.
> 테마 전환 버튼은 [`components/common/theme-toggle.tsx`](src/components/common/theme-toggle.tsx)에 있다.

### 규칙 3. 📝 상태 문자열을 직접 타이핑하지 않는다

```tsx
❌ if (action.status === "IN_PROGRESS")
✅ import { ACTION_STATUS, ACTION_STATUS_LABEL } from "@/constants/domain";
   if (action.status === ACTION_STATUS.IN_PROGRESS)
   <Badge>{ACTION_STATUS_LABEL[action.status]}</Badge>
```

**주의:** `DELAYED`는 **상태가 아니다.** 마감이 지났는지 계산하는 값이라 `isDelayed(action)` 함수를 쓴다.

### 규칙 4. 🌐 API 경로를 문자열로 쓰지 않는다

```ts
❌ fetch("/api/meetings/" + id)
✅ import { ep } from "@/lib/endpoints";
   fetch(ep.meeting(id))
```

이유: **아직 BE가 없어서** 경로를 지어내기 쉽다. 한 곳에 모아두면 BE 합류 시 이 파일만 고치면 된다.
**`ep`에 없는 경로가 필요하면 → 지어내지 말고 팀에 물어본다.**

### 규칙 5. 🕵️ 안 되는 걸 되는 척하지 않는다

목 데이터거나, 미구현이거나, 임시 폴백이면 **주석과 화면에 명시**한다.

```tsx
// ⚠️ 목 데이터 — BE 연동 전 (이슈 #12)
```

빈 화면으로 조용히 숨기면 나중에 아무도 모른다. **화면에도 "준비 중" 같은 안내를 남긴다.**

### 규칙 6. 🖥 서버 우선 (Server-First)

- **조회**는 Server Component에서 `async/await` — `useEffect`로 데이터 가져오지 않는다
- **변경**은 Server Action + BFF — 브라우저가 백엔드를 직접 부르지 않는다
- `'use client'`는 **버튼·폼·입력처럼 진짜 필요한 잎사귀에만**

이유: 사내 도구라 **토큰이 브라우저로 나가면 안 된다.**

---

## 6. ⚠️ 처음에 꼭 만나는 에러들

### 😱 "커밋이 안 돼요"

```
✖ eslint --fix found some errors
```

**원인:** 규칙 위반. 대부분 아래 셋 중 하나다.

| 메시지                              | 원인          | 해결                                   |
| ----------------------------------- | ------------- | -------------------------------------- |
| `Unexpected any`                    | `any` 사용    | `unknown` + 타입 가드로 바꾸기         |
| `Unexpected console statement`      | `console.log` | 지우기 (`console.warn`/`error`는 허용) |
| `Run autofix to sort these imports` | import 순서   | `npx eslint . --fix`                   |

**대부분 자동으로 고쳐진다:**

```bash
npx eslint . --fix
npx prettier --write .
git add . && git commit -m "..."
```

### 😱 "푸시가 안 돼요"

```
error TS2345: Argument of type ...
```

**원인:** 타입 에러. `npm run typecheck`로 확인하고 고친다.

> **자주 나는 것:** 배열 인덱싱이 `undefined`일 수 있다는 에러.
> `noUncheckedIndexedAccess`를 켜서 그렇다 — **버그를 미리 막아주는 것**이니 우회하지 말고 처리하자.
>
> ```ts
> const first = list[0]; // 타입: T | undefined
> if (!first) return; // 이렇게 좁혀준다
> ```

### 😱 "PR이 빨간불이에요"

PR 페이지 아래 **Details**를 눌러 어느 단계에서 깨졌는지 본다.

| 실패 단계   | 로컬에서            |
| ----------- | ------------------- |
| `typecheck` | `npm run typecheck` |
| `lint`      | `npx eslint .`      |
| `test`      | `npm run test`      |
| `build`     | `npm run build`     |

> 💡 **`build`만 깨지는 경우**가 종종 있다. 대개 **빈 `page.tsx`** 때문이다 — 활성 라우트의 `page.tsx`가 비어 있으면 빌드가 실패한다.

### 😱 "`permission.ts`를 import했더니 빌드가 깨져요"

```
'server-only' cannot be imported from a Client Component
```

**정상이다.** 권한 판정은 서버 전용이라 일부러 막아놨다. 클라이언트에서 권한이 필요하면:

- 서버에서 판정한 **결과(boolean)를 props로** 내려준다
- 화면 숨김용이면 그걸로 충분하다 (**실제 차단은 어차피 서버에서** 한다)

### 😱 "훅이 안 도는 것 같아요"

```bash
npm install     # prepare 스크립트가 훅을 설치한다
```

`git clone` 직후 `npm install`을 안 했으면 훅이 없다.

---

## 7. 문서 5종 — 언제 뭘 읽나

| 문서                        | 언제                                                  |
| --------------------------- | ----------------------------------------------------- |
| **ONBOARDING.md** (이 문서) | 처음 · 뭐가 바뀌었는지 모를 때                        |
| **CLAUDE.md**               | 규칙 **요약본** — 빠르게 훑을 때 (상세는 CONVENTIONS) |
| **docs/CONVENTIONS.md**     | 코드 쓰다 막힐 때 (예시·상세 규칙 24섹션)             |
| **DECISIONS.md**            | "이거 왜 이렇게 정했지?" / "이거 우리 정한 거 맞나?"  |
| **SETUP.md**                | 인프라를 건드릴 때 (CI·훅·설정)                       |

> **규칙을 바꾸고 싶으면** → 팀 합의 먼저 → `DECISIONS.md`부터 고치고 → 나머지 문서를 맞춘다.

---

## 8. 작업 순서 & 올리기 전 확인

### 순서

- **한 번에 다 짜지 말고 나눈다:** ① 타입/스키마 → ② API 함수 → ③ 화면
  (UI 버그와 연동 버그가 섞이면 원인 찾기가 어렵다)

### 올리기 전 확인

```bash
npm run typecheck && npx eslint . && npm run build
```

- **API 경로**는 반드시 `ep.*`([src/lib/endpoints.ts](src/lib/endpoints.ts))에서 가져왔는지 — 문자열 직접 입력 금지
- **권한 2축**(역할 + 리소스 소유권)을 서버에서 다 검사했는지

---

## 9. 자주 묻는 것

**Q. `main`에 올려도 되나요?**
아니요. **모든 코드는 `develop`으로.** `main`은 안 건드립니다.

**Q. 포맷을 내 스타일로 바꾸고 싶어요.**
Prettier에 위임하기로 했습니다. 개인 설정보다 **일관성**이 우선이에요. 정말 바꿔야 하면 팀 합의 → `.prettierrc.json` 수정.

**Q. `src/components/ui/` 안의 shadcn 파일을 고쳐도 되나요?**
됩니다(소스를 우리가 소유). 다만 lint 대상에서 제외돼 있으니, 크게 고칠 거면 **`components/common/`에 감싸서** 쓰는 걸 권합니다.

**Q. 테스트를 꼭 써야 하나요?**
지금 당장은 아닙니다. 다만 **로직·매퍼(순수 함수)는 짜자마자** 쓰는 게 규칙이에요 — 나중에 몰아 쓰면 시간 없어서 잘립니다. 컴포넌트 테스트는 목으로 동작이 확정된 뒤 핵심만.

**Q. BE가 없는데 어떻게 개발하나요?**
목으로 먼저 만듭니다. **격리막 구조**(`docs/CONVENTIONS.md` §21) 덕분에 나중에 BE가 붙어도 **`server.ts`와 매퍼만** 고치면 되고 컴포넌트는 안 건드립니다.

**Q. 다크모드는 지금 만드나요?**
아니요, **나중**입니다. 다만 **토큰은 이미 깔려 있으니** 색을 하드코딩만 안 하면 됩니다.

**Q. 뭘 먼저 해야 할지 모르겠어요.**
`DECISIONS.md`의 **분업 3분할**(워크벤치 / 업무 / 조직·셸)을 보고 본인 영역의 화면부터 시작하세요. 담당이 아직 안 정해졌으면 그것부터 정해야 합니다.

---

**막히면 물어보세요. 이 문서에 없는 게 있으면 추가합니다.**
