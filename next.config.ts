import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /*
    개발 서버 표시등(왼쪽 아래 동그란 `N` 배지)을 끈다.

    ⚠️ **우리 코드가 아니다.** `next dev`가 `<nextjs-portal>`로 띄우는 것이라 배포된 화면에는
       원래 없다. 다만 개발 중에 **사이드바 계정 줄 위에 겹쳐 앉아**, 화면을 보거나 스크린샷으로
       디자인을 확인할 때 없는 요소가 있는 것처럼 읽힌다.
    ⚠️ 끄는 건 **배지뿐이다.** 오류 오버레이(빨간 화면)와 HMR은 그대로 동작한다 —
       빌드 실패를 조용히 넘기지 않는다(§정직성).
  */
  devIndicators: false,
};

export default nextConfig;
