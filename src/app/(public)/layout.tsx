import type { ReactNode } from "react";

const STORAGE_KEY = "z:landing-theme";

/*
  ⚠️ **첫 페인트 전에** 저장해 둔 밝기를 `<html>`에 붙인다.
     서버는 방문자의 선택을 모르므로 늘 어두운 기본값으로 그려 보낸다. 하이드레이션까지
     기다리면 밝게 쓰던 사람은 새로고침마다 검은 화면이 번쩍였다가 흰 화면으로 바뀐다 —
     무대 마크업보다 **먼저** 도는 동기 스크립트가 스킨을 정해 그 번쩍임을 없앤다.
  ⚠️ 스킨 클래스는 `<html>`이 들지만 **토큰은 `#landing-stage`에만** 선언한다(globals.css).
     토큰까지 html에 두면 로그인 뒤 앱 화면도 따라 어두워진다.
  ⚠️ 스크립트가 막히거나(CSP) 저장소를 못 읽어도 화면은 산다 — 기본값(어두움)으로 남을 뿐이다.
*/
const THEME_BOOT = `try{var d=localStorage.getItem("${STORAGE_KEY}")!=="light";document.documentElement.classList.add(d?"landing-night":"landing-day")}catch(e){document.documentElement.classList.add("landing-night")}`;

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: THEME_BOOT }} />
      {children}
    </>
  );
}
