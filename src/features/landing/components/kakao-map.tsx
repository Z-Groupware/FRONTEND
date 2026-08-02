"use client";

import { ExternalLink, MapPin } from "lucide-react";
import Script from "next/script";
import { useCallback, useRef, useState } from "react";

/**
 * 카카오맵 실지도.
 *
 * ⚠️ **JavaScript 앱 키가 있어야 뜬다**(`NEXT_PUBLIC_KAKAO_MAP_KEY`). 카카오 개발자 콘솔에서
 *    앱을 만들고 [플랫폼 > Web]에 배포 도메인과 `http://localhost:3000`을 등록해야 한다.
 *    키가 없거나 SDK를 못 불러오면 **조용히 빈 상자를 두지 않고** 주소 카드로 대체한다(§정직성).
 * ⚠️ 키는 `NEXT_PUBLIC_`이라 브라우저에 노출된다 — 카카오 JS 키는 원래 그런 키이고,
 *    보호는 위의 **도메인 등록**이 한다. REST 키를 여기 넣으면 안 된다.
 */
interface KakaoMapProps {
  /** 지도 중심 위도 */
  lat: number;
  /** 지도 중심 경도 */
  lng: number;
  /** 마커 위에 띄울 이름 */
  label: string;
  /** 지도가 못 뜰 때 보여줄 주소 */
  address: string;
  /** 카카오맵으로 나가는 주소 */
  mapUrl: string;
}

/** SDK가 붙여 놓는 전역. 타입 정의를 통째로 들이지 않고 쓰는 만큼만 좁게 적는다 */
interface KakaoNamespace {
  maps: {
    load: (callback: () => void) => void;
    LatLng: new (lat: number, lng: number) => unknown;
    Map: new (container: HTMLElement, options: { center: unknown; level: number }) => unknown;
    Marker: new (options: { position: unknown }) => { setMap: (map: unknown) => void };
    InfoWindow: new (options: { content: string }) => {
      open: (map: unknown, marker: unknown) => void;
    };
  };
}

function readKakao(): KakaoNamespace | undefined {
  return (window as unknown as { kakao?: KakaoNamespace }).kakao;
}

export function KakaoMap({ lat, lng, label, address, mapUrl }: KakaoMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hasFailed, setHasFailed] = useState(false);
  const appKey = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY;

  const draw = useCallback(() => {
    const kakao = readKakao();
    const container = containerRef.current;
    if (!kakao || !container) {
      setHasFailed(true);
      return;
    }

    // `autoload=false`로 불렀으니 여기서 직접 로드한다 — 안 하면 `kakao.maps.Map`이 없다
    kakao.maps.load(() => {
      const center = new kakao.maps.LatLng(lat, lng);
      const map = new kakao.maps.Map(container, { center, level: 3 });
      const marker = new kakao.maps.Marker({ position: center });
      marker.setMap(map);
      new kakao.maps.InfoWindow({
        content: `<div style="padding:6px 10px;font-size:12px;white-space:nowrap;color:#1a1715">${label}</div>`,
      }).open(map, marker);
    });
  }, [lat, lng, label]);

  // 키가 없으면 스크립트를 부르지도 않는다 — 401을 콘솔에 흘리는 대신 대체 화면으로 간다
  const isDisabled = !appKey || hasFailed;

  return (
    <div className="border-border relative h-[320px] overflow-hidden rounded-xl border">
      {!isDisabled && (
        <Script
          src={`https://dapi.kakao.com/v2/maps/sdk.js?appkey=${appKey}&autoload=false`}
          strategy="afterInteractive"
          onReady={draw}
          onError={() => setHasFailed(true)}
        />
      )}

      {isDisabled ? (
        <div className="bg-secondary flex h-full items-center justify-center">
          <div className="bg-dot-grid absolute inset-0" aria-hidden />
          <div className="relative flex flex-col items-center gap-2 text-center">
            <MapPin className="text-foreground size-7" aria-hidden />
            <p className="text-[14px] leading-[21px] font-medium break-keep">{address}</p>
            <a
              href={mapUrl}
              target="_blank"
              rel="noreferrer"
              className="text-primary flex items-center gap-1 text-[13px] leading-5 hover:underline"
            >
              카카오맵에서 열기
              <ExternalLink className="size-3.5" aria-hidden />
            </a>
          </div>
        </div>
      ) : (
        <>
          <div ref={containerRef} className="size-full" />
          {/* 지도 위에 바로가기 하나 — 길찾기는 결국 카카오맵 앱에서 한다 */}
          <a
            href={mapUrl}
            target="_blank"
            rel="noreferrer"
            className="border-border bg-card text-foreground focus-visible:ring-ring absolute right-3 bottom-3 flex items-center gap-1.5 rounded-lg border px-3 py-2 text-[12px] leading-4 font-medium shadow-md focus-visible:ring-2 focus-visible:outline-hidden"
          >
            카카오맵에서 열기
            <ExternalLink className="size-3.5" aria-hidden />
          </a>
        </>
      )}
    </div>
  );
}
