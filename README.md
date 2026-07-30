# Z — 회의 기반 지식관리 그룹웨어 (Frontend)

> **회의를 하면, 조직의 기억이 된다.**
> 회의를 캡처(STT 자막·녹음)하면 AI가 요약·결정·액션을 추출해 담당자에게 하달한다.
> 10~50명 성장기 스타트업을 위한 B2B SaaS.

**Next.js (App Router) · TypeScript · Tailwind + shadcn/ui · 데스크톱 1440 전용**

---

## 시작하기

```bash
npm install     # 훅도 함께 설치된다
npm run dev     # http://localhost:3000
```

### 👉 처음이신가요? **[ONBOARDING.md](./ONBOARDING.md)** 를 먼저 읽어주세요

무엇이 바뀌었는지 · 어떻게 작업하는지 · 처음 만나는 에러 해결법이 다 있습니다. (10분)

---

## 검사 명령어

```bash
npm run typecheck   # 타입 검사
npm run lint        # 코드 규칙
npm run test        # 테스트
npm run build       # 프로덕션 빌드
```

> PR을 올리면 이 4개가 **자동으로 돈다.** 하나라도 실패하면 머지할 수 없다.
> 올리기 전에 로컬에서 먼저 돌려보면 시간을 아낄 수 있다.

---

## 문서

| 문서                                         | 언제 읽나                        |
| -------------------------------------------- | -------------------------------- |
| **[ONBOARDING.md](./ONBOARDING.md)**         | **처음 · 작업 흐름 · 에러 해결** |
| [docs/CONVENTIONS.md](./docs/CONVENTIONS.md) | 코드 쓰다 막힐 때 (상세 규칙)    |
| [DECISIONS.md](./DECISIONS.md)               | 팀이 정한 것 / 아직 안 정한 것   |
| [SETUP.md](./SETUP.md)                       | 인프라를 건드릴 때               |
| [CLAUDE.md](./CLAUDE.md)                     | 규칙 요약본 (빠르게 훑을 때)     |

---

## 작업 흐름

```
이슈 → 브랜치(feature/meeting-capture#12) → 커밋(feat: 제목 #12) → 푸시 → PR(base: develop, Closes #12) → 리뷰 1명 → 머지
```

- **이슈 번호를 브랜치·커밋·PR 세 군데에 전부 박는다.** 규칙은 [ONBOARDING.md](./ONBOARDING.md#4-매일-쓰는-작업-흐름).
- **모든 코드는 `develop`으로.** `main`은 건드리지 않는다.
- 이슈·PR은 **템플릿이 자동으로 뜬다.**
- ⛔ 본인 PR 본인 머지 금지 · `main`/`develop` 직접 push 금지

---

## 폴더 구조

```
src/
├─ app/                    라우트 (폴더 = URL)
│  ├─ (public)/            로그인 전
│  ├─ (onboarding)/        OWNER 초기설정
│  ├─ (role)/              owner · manage · team · my
│  ├─ (app)/               공용 워크벤치
│  └─ api/[...path]/       BFF 프록시
├─ features/<도메인>/       schemas · types · server · actions · components
├─ components/             ui(shadcn) · common · domain
├─ constants/domain.ts     도메인 상수 12종
├─ lib/                    permission(권한 2축) · endpoints(API 경로) · utils
└─ mocks/                  목 데이터 + isMock 스위치
```

> 라우트 그룹 폴더는 각자 첫 화면을 만들 때 함께 생성한다(빈 라우트는 빌드를 깨뜨린다).

---

## ⚠️ 주의

- **public 레포입니다.** `.env` 실제 값·토큰·키를 절대 커밋하지 마세요 (`.gitignore`로 막아뒀지만 확인 필요).
- **ERD·API 스펙이 아직 없습니다.** 목으로 먼저 개발하고, 격리막 구조로 나중에 교체합니다.
