# 화면 배율(Screen Scale) 사용 시 드롭다운/팝오버 위치 어긋남

## 증상

"화면 배율"을 100%가 아닌 값(예: 75%)으로 설정하면, `Select`·`Popover`·`Tooltip`
등 base-ui 기반 팝업 전부가 트리거 바로 아래/옆이 아니라 엉뚱한 위치에 뜬다.
`/app/projects`의 "정렬 기준" Select에서도 재현되므로 특정 화면 문제가 아니라
공용 컴포넌트(`components/ui/select.tsx`, `popover.tsx` 등) 전체에 해당한다.

## 원인

`features/appearance/scale.ts`의 화면 배율 기능이 `document.documentElement.style.zoom`
(비표준 CSS `zoom` 속성)으로 배율을 적용한다.

```js
// scale.ts — SCALE_BOOT_SCRIPT
e.style.zoom = String(s / 100);
```

base-ui의 `Select`/`Popover`는 내부적으로 Floating UI를 써서 트리거의
`getBoundingClientRect()`로 좌표를 구하고, 그 결과를 popup 쪽 `position: absolute`
엘리먼트에 `transform: translate(x, y)`로 적용해 위치를 잡는다.

- `getBoundingClientRect()`는 **줌이 이미 반영된(화면에 보이는 그대로의) 좌표**를 돌려준다.
- 그런데 popup의 `transform: translate(x, y)`가 적용되는 엘리먼트는
  `zoom`이 걸린 `<html>` **안에** 있다 — 그래서 브라우저가 이 translate 값에
  **줌을 한 번 더** 곱해서 렌더링한다.
- 결과: 실제 렌더링 위치 = 의도한 위치 × 줌값. (75% 배율에서 실측 확인: 어긋난 좌표가
  정확히 `의도한 좌표 × 0.75`와 일치했다.)

즉 "이미 줌이 반영된 좌표"를 "또 줌이 걸리는 요소"에 그대로 꽂아 넣어서
좌표가 이중으로 줄어드는, `zoom` 속성과 Floating UI 기반 라이브러리의 고전적인
비호환 문제다. Floating UI 공식 문서도 `zoom` 대신 `transform: scale()`을
쓰라고 안내한다.

## 재현

1. 화면 배율을 75%(또는 100%가 아닌 값)로 설정
2. `/app/projects`에서 "정렬 기준" 드롭다운 클릭 → 팝업이 검색창 쪽으로 어긋나서 뜬다
3. 배율을 100%로 되돌리면 정상 위치에 뜬다 (원인 확정)

## 해결 방향 (택 1)

1. **`zoom` → `transform: scale()` 전환(권장)**
   - 배율 적용 대상을 별도 wrapper(`<div id="app-scale-root">`)로 감싸고
     `transform: scale(s)` + `transform-origin: top left`로 배율을 준다.
   - `transform`은 popup의 좌표 계산에 영향을 주지 않는 새 스태킹/좌표계를
     만들지 않으므로(참조 요소와 popup이 같은 좌표계 안에 있는 한) Floating UI가
     정상 동작한다. 단, 배율 대상 wrapper의 실제 레이아웃 크기(`width`/`height`)를
     역보정해야 스크롤 영역 계산이 어긋나지 않는다 — 지금 `globals.css`의
     `--app-zoom` 변수로 `100dvh`를 역산하는 로직과 같은 보정을 `scale()` 버전에도
     맞춰 옮겨야 한다.
2. **팝업 좌표를 배율만큼 나눠서 보정** — base-ui 내부 좌표 계산 로직을 건드려야
   해서(vendored 패키지가 아니라 `@base-ui/react`라 패치 유지보수 부담) 권장하지 않음.

## 영향 범위

`components/ui/select.tsx`·`popover.tsx`·`tooltip.tsx`·`dropdown-menu.tsx`를 쓰는
모든 화면. 화면 배율이 100%인 기본값에서는 문제가 없어 지금까지 눈에 안 띄었을
가능성이 높다.

## 참고

- 발견 경위: 프로젝트 생성 화면(#149) 작업 중 "참여 팀" Select 드롭다운 위치가
  이상하다는 제보로 조사, `/app/projects`(#134, 이미 병합)의 기존 Select에서도
  동일 재현 확인 → 화면 배율 기능(#142?, `features/appearance`) 쪽 원인으로 특정.
- 이 문서 작성 시점 기준 화면 배율 담당자가 별도라 수정은 보류하고 현상만 인계한다.
