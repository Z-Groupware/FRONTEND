"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

/**
 * 진짜 3D Z — 로고 세 조각(윗줄·사선·아랫줄)을 **코드로 압출**해 만든다.
 *
 * ⚠️ GLB 같은 모델 자산을 쓰지 않는다 — 수십 MB 모델은 로딩·배포(LFS)만 힘들어진다.
 *    좌표는 `ZLogo` SVG(viewBox 0 0 100 100)와 같은 값이라 로고가 바뀌면 같이 바꾼다.
 * ⚠️ 이 파일은 반드시 `next/dynamic(ssr:false)`로만 불러온다(§성능 — three는 무겁다).
 * ⚠️ **드래그로 돌릴 수 없다.** 이 캔버스는 배경(`LandingBackdrop`)에 있고 그 층이
 *    `pointer-events-none`이라 포인터 이벤트가 닿지 않는다 — 아래 핸들러는 그래서 죽어 있다.
 *    배경이 스크롤을 뺏지 않는 편이 더 중요해서 그대로 둔다. 지금 도는 건 **자전뿐**이다.
 */
const PIECES: [number, number][][] = [
  // SVG 좌표(y 아래로) → three 좌표(y 위로): x/100-0.5, 0.5-y/100
  [
    [0, 0],
    [63, 0],
    [45.5, 25],
    [0, 25],
  ],
  [
    [70, 0],
    [100, 0],
    [30, 100],
    [0, 100],
  ],
  [
    [54.5, 75],
    [100, 75],
    [100, 100],
    [37, 100],
  ],
];

type Tone = "dark" | "light";

function ZModel({ tone, isFeature }: { tone: Tone; isFeature: boolean }) {
  const group = useRef<THREE.Group>(null!);
  /** 자전 속도 — 배경이라 아주 느리게 돈다 */
  const velocity = useRef(0.003);
  // 정면 정자세는 간판처럼 밋밋하다 — 처음부터 비스듬히
  const initialRotation: [number, number, number] = [-0.15, 0.4, 0];

  const geometries = useMemo(
    () =>
      PIECES.map((points) => {
        const shape = new THREE.Shape();
        points.forEach(([x, y], index) => {
          const px = x / 100 - 0.5;
          const py = 0.5 - y / 100;
          if (index === 0) shape.moveTo(px, py);
          else shape.lineTo(px, py);
        });
        shape.closePath();
        return new THREE.ExtrudeGeometry(shape, { depth: 0.14, bevelEnabled: false });
      }),
    [],
  );

  /*
    ⚠️ **떠날 때 GPU 자원을 돌려준다.** `ExtrudeGeometry`는 브라우저가 알아서 안 치운다 —
       화면을 오갈 때마다 쌓이면 컨텍스트가 통째로 날아간다(`WebGLRenderer: Context Lost`).
  */
  useEffect(() => () => geometries.forEach((geometry) => geometry.dispose()), [geometries]);

  useFrame(() => {
    if (!group.current) return;
    group.current.rotation.y += velocity.current;
  });

  return (
    <group ref={group} rotation={initialRotation}>
      {geometries.map((geometry, index) => (
        <mesh key={index} geometry={geometry} position={[0, 0, -0.07]}>
          {/*
            ⚠️ 배경이다 — 글보다 밝으면 안 된다.
            **어두운 무대(dark):** 몸체는 검정에 가깝게 두고 파랑·보라 림라이트만 모서리에
            감돌게 한다(어두운 금속).
            **밝은 무대(light):** 회색으로 칠하지 않는다 — 흰 바탕 위 회색 덩어리는 얼룩처럼
            보인다. 몸체를 **흰 종이처럼** 두고(무광·낮은 금속기) 형태는 **음영으로만** 읽히게
            한다. 눌러 찍은 자국에 가깝다.
          */}
          <meshStandardMaterial
            color={isFeature ? "#78716c" : tone === "dark" ? "#232326" : "#ffffff"}
            metalness={isFeature ? 0.55 : tone === "dark" ? 0.85 : 0.4}
            roughness={isFeature ? 0.35 : tone === "dark" ? 0.28 : 0.3}
          />
        </mesh>
      ))}
    </group>
  );
}

/**
 * tone: 어두운 섹션(dark)은 검정 금속에 림라이트, 밝은 섹션(light)은 밝은 금속에 같은 색 조명.
 * 같은 모델·같은 빛 축이라 어디에 두어도 한 몸으로 읽힌다.
 */
export default function ThreeZ({
  size = 420,
  tone = "dark",
  /** 배경이 아니라 **보여주는** 자리라면 켠다 — 몸체가 밝아지고 금속기를 낮춰 형태가 또렷해진다 */
  isFeature = false,
}: {
  size?: number;
  tone?: Tone;
  isFeature?: boolean;
}) {
  /*
    ⚠️ **컨텍스트가 날아갈 수 있다.** 브라우저는 WebGL 컨텍스트를 몇 개까지만 들고 있어서,
       탭을 많이 열어 두거나 GPU가 눌리면 조용히 뺏어 간다 — 배포 콘솔의
       `THREE.WebGLRenderer: Context Lost`가 그것이다(2026-08-12).
    ⚠️ **막지 않으면 영영 안 돌아온다.** 기본 동작은 그대로 잃는 것이라, 기본 동작을 멈춰야
       (`preventDefault`) 브라우저가 복구를 시도한다. 복구되면 다시 그린다.
    ⚠️ 그래도 못 살아나면 **배경 하나 없는 것뿐**이다 — 로고는 글자로 이미 있고, 이 캔버스는
       장식이라 화면이 깨지지 않는다(§정직성: 조용히 망가진 척은 안 하되, 본문은 지킨다).
  */
  const [isLost, setIsLost] = useState(false);

  if (isLost) return <div style={{ width: size, height: size }} aria-hidden />;

  return (
    <Canvas
      // 성능: 픽셀 밀도 상한 1.5, 카메라는 정면 고정
      dpr={[1, 1.5]}
      onCreated={({ gl }) => {
        const canvas = gl.domElement;
        canvas.addEventListener("webglcontextlost", (event) => {
          event.preventDefault();
          setIsLost(true);
        });
        canvas.addEventListener("webglcontextrestored", () => setIsLost(false));
      }}
      camera={{ position: [0, 0, 2.1], fov: 45 }}
      className="cursor-grab active:cursor-grabbing"
      style={{ width: size, height: size, touchAction: "none" }}
    >
      {/*
        ⚠️ 밝은 무대에서는 주변광을 **크게 낮춘다.** 높이면 흰 몸체가 평평해져 형태가 사라진다 —
           흰 바탕 위 흰 물체는 **면끼리 밝기 차**로만 읽힌다. 그늘이 있어야 모서리가 보인다.
      */}
      <ambientLight intensity={isFeature ? 0.5 : tone === "dark" ? 0.5 : 0.55} />
      <directionalLight
        position={[2, 3, 4]}
        intensity={isFeature ? 1.1 : tone === "dark" ? 1 : 1.05}
        color="#ffffff"
      />
      {/* 액센트 축 그대로 — 파랑·보라 림라이트가 모서리만 물들인다 */}
      <pointLight position={[-3, 1, 3]} intensity={isFeature ? 32 : 34} color="#60a5fa" />
      <pointLight position={[3, -1, 3]} intensity={isFeature ? 32 : 34} color="#a78bfa" />
      <ZModel tone={tone} isFeature={isFeature} />
    </Canvas>
  );
}
