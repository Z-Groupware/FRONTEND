"use client";

import { Check, MapPin, Search } from "lucide-react";
import Script from "next/script";
import { useEffect, useState } from "react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

import type { PickedPlace } from "../register-draft";
import { type KakaoPlace, readKakao } from "./kakao-sdk";

/**
 * 회사 위치 고르기 — 이름·주소로 찾아 지도에 핀을 꽂는다.
 *
 * ⚠️ 좌표를 직접 받지 않는다. 사람이 아는 건 "판교 우리 건물"이지 위경도가 아니다 —
 *    검색으로 고르게 하고 좌표는 뒤에서 챙긴다.
 * ⚠️ 키(`NEXT_PUBLIC_KAKAO_MAP_KEY`)가 없거나 SDK가 안 뜨면 **직접 입력 칸으로 내려간다.**
 *    조용히 빈 상자를 두지 않는다(§정직성) — 지도가 없어도 신청은 끝낼 수 있어야 한다.
 * ⚠️ 여기 쓰는 건 JavaScript 앱 키다. 브라우저에 노출되는 게 정상이고 보호는 도메인 등록이 한다.
 */
/** SDK 전역 — 타입을 통째로 들이지 않고 쓰는 만큼만 좁게 적는다 */
/** SDK가 이만큼 지나도 안 뜨면 못 쓰는 것으로 본다 — 느린 회선에서도 넉넉한 값 */
const SDK_TIMEOUT_MS = 8000;

interface AddressPickerProps {
  /** 이미 고른 곳. 아직 안 골랐으면 `null` */
  picked: PickedPlace | null;
  onPick: (place: PickedPlace) => void;
  hasError: boolean;
  /**
   * 지도 상자 크기.
   * ⚠️ 폭이 화면마다 다르다 — 좁은 카드(신청)에서 알맞은 높이가 전폭(기업 설정)에서는
   *    납작한 띠가 된다. 기본값은 신청 화면 기준이다.
   */
  mapClassName?: string;
}

export function AddressPicker({
  picked,
  onPick,
  hasError,
  mapClassName = "h-[160px]",
}: AddressPickerProps) {
  const appKey = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY;
  const [keyword, setKeyword] = useState("");
  const [results, setResults] = useState<KakaoPlace[]>([]);
  /*
    ⚠️ 상태가 셋이다 — 기다리는 중 · 쓸 수 있음 · 못 씀.
       `onError`만 믿으면 안 된다. 스크립트가 차단되거나 `maps.load` 콜백이 영영 안 오면
       오류도 안 나고 입력칸이 잠긴 채로 남아 **신청을 아예 끝낼 수 없다**.
  */
  const [loadState, setLoadState] = useState<"loading" | "ready" | "failed">("loading");
  const isReady = loadState === "ready";

  /*
    ⚠️ 정해진 시간 안에 SDK가 안 뜨면 **직접 입력으로 내려간다.** `onError`만으로는 부족하다 —
       스크립트가 차단되면 오류 없이 조용히 멈추고, 그러면 신청을 끝낼 방법이 없다.
    ⚠️ 상태를 바꾸는 건 효과 본문이 아니라 **타이머 콜백**이라 렌더가 한 번 더 돌지 않는다.
  */
  useEffect(() => {
    if (loadState !== "loading") return;
    const timer = setTimeout(
      () => setLoadState((current) => (current === "loading" ? "failed" : current)),
      SDK_TIMEOUT_MS,
    );
    return () => clearTimeout(timer);
  }, [loadState]);

  /*
    고른 곳에 핀을 꽂는다.
    ⚠️ 고르는 **그 자리에서** 그릴 수 없다. 지도 상자는 `picked`가 생겨야 렌더되므로
       그 시점엔 아직 DOM에 없다 — 상자가 붙을 때(**ref 콜백**) 그린다.
    ⚠️ `useEffect` 대신 ref 콜백인 이유는 같다. 아래 `key`가 좌표라 다시 고르면 상자가
       새로 붙고 콜백이 한 번 더 돈다 — 지도를 갱신하는 별도 코드가 필요 없다.
  */
  const drawPin = (container: HTMLDivElement | null) => {
    const kakao = readKakao();
    if (!kakao || !container || !picked) return;

    const center = new kakao.maps.LatLng(picked.lat, picked.lng);
    const map = new kakao.maps.Map(container, { center, level: 4 });
    new kakao.maps.Marker({ position: center }).setMap(map);
  };

  const handleSearch = () => {
    const kakao = readKakao();
    if (!kakao || !keyword.trim()) return;

    new kakao.maps.services.Places().keywordSearch(keyword, (data, status) => {
      setResults(status === kakao.maps.services.Status.OK ? data.slice(0, 5) : []);
    });
  };

  const handleChoose = (place: KakaoPlace) => {
    const lat = Number(place.y);
    const lng = Number(place.x);
    /*
      ⚠️ 좌표가 숫자가 아니면 **고르지 않는다.** `0`으로 저장하면 아프리카 앞바다를 회사 위치로
         적어 보내는 셈이다 — 틀린 값을 넘기느니 다시 고르게 한다.
    */
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      setLoadState("failed");
      return;
    }
    onPick({ address: place.road_address_name || place.address_name, lat, lng });
    setResults([]);
  };

  /* 키가 없거나 SDK가 죽으면 — 직접 입력. 신청 자체는 막지 않는다 */
  if (!appKey || loadState === "failed") {
    return (
      <Input
        id="company-address"
        value={picked?.address ?? ""}
        onChange={(event) => onPick({ address: event.target.value, lat: 0, lng: 0 })}
        placeholder="회사 주소를 입력하세요"
        autoComplete="street-address"
        aria-invalid={hasError}
        aria-describedby="company-address-error"
      />
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <Script
        src={`//dapi.kakao.com/v2/maps/sdk.js?appkey=${appKey}&libraries=services&autoload=false`}
        onReady={() => readKakao()?.maps.load(() => setLoadState("ready"))}
        onError={() => setLoadState("failed")}
      />

      {/*
        ⚠️ `form` 안에 `form`을 넣을 수 없다 — 여기서 Enter는 바깥 폼 제출로 새어 나간다.
           `keydown`에서 막고 검색으로 돌린다.
      */}
      <div className="relative">
        <Input
          id="company-address"
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
          onKeyDown={(event) => {
            if (event.key !== "Enter") return;
            event.preventDefault();
            handleSearch();
          }}
          placeholder="건물명이나 주소로 찾아보세요"
          disabled={!isReady}
          aria-invalid={hasError}
          aria-describedby="company-address-error"
          className="pr-10"
        />
        <button
          type="button"
          onClick={handleSearch}
          disabled={!isReady}
          aria-label="주소 검색"
          className="text-muted-foreground hover:text-foreground focus-visible:ring-ring absolute top-1/2 right-2 -translate-y-1/2 rounded p-1 focus-visible:ring-2 focus-visible:outline-hidden disabled:opacity-40"
        >
          <Search className="size-4" aria-hidden />
        </button>

        {/*
          ⚠️ 결과는 **띄운다**(absolute). 줄 사이에 끼워 넣으면 검색할 때마다 아래 지도와
             카드 전체가 밀렸다 돌아와 화면이 출렁인다 — 고르는 동안 뒤가 안 움직여야
             무엇을 고르는지 눈이 따라간다.
          ⚠️ 지도 위에 떠야 하므로 `z-20`이다. 지도(카카오 SDK)가 자기 요소에 z-index를 매긴다.
        */}
        {results.length > 0 && (
          <ul className="border-border bg-card absolute top-full right-0 left-0 z-20 mt-1 overflow-hidden rounded-lg border shadow-lg">
            {results.map((place) => (
              <li key={`${place.x},${place.y}`}>
                <button
                  type="button"
                  onClick={() => handleChoose(place)}
                  className="hover:bg-secondary focus-visible:ring-ring flex w-full flex-col gap-0.5 px-3.5 py-2.5 text-left focus-visible:ring-2 focus-visible:outline-hidden"
                >
                  <span className="text-[13px] leading-5 font-medium">{place.place_name}</span>
                  <span className="text-muted-foreground text-[12px] leading-4">
                    {place.road_address_name || place.address_name}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {picked && (
        <>
          <p className="text-muted-foreground flex items-center gap-1.5 text-[12px] leading-4">
            <Check className="text-success size-3.5 shrink-0" aria-hidden />
            <span className="translate-y-px">{picked.address}</span>
          </p>
          {/*
            ⚠️ `key`에 **SDK 상태를 함께 넣는다.** 이미 고른 곳을 들고 시작하는 화면
               (기업 설정)에서는 지도 상자가 SDK보다 먼저 붙어서, ref 콜백이 도는 시점에
               `readKakao()`가 아직 `null`이다 — 그대로 두면 **빈 상자가 영영 남는다.**
               상태가 `ready`로 바뀌면 상자가 새로 붙으면서 콜백이 한 번 더 돈다.
          */}
          <div
            key={`${loadState}:${picked.lat},${picked.lng}`}
            ref={drawPin}
            aria-hidden
            className={cn("border-border w-full overflow-hidden rounded-lg border", mapClassName)}
          />
        </>
      )}

      {!picked && (
        <p className="text-muted-foreground/70 flex items-center gap-1.5 text-[12px] leading-4">
          <MapPin className="size-3.5 shrink-0" aria-hidden />
          <span className="translate-y-px">찾은 곳을 고르면 지도에 표시됩니다</span>
        </p>
      )}
    </div>
  );
}
