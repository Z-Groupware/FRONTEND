"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
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

function ZModel({ tone }: { tone: Tone }) {
  const group = useRef<THREE.Group>(null!);
  const velocity = useRef(0.003); // 처음부터 천천히 돈다
  // 정면 정자세는 간판처럼 밋밋하다 — 처음부터 비스듬히
  const initialRotation: [number, number, number] = [-0.15, 0.4, 0];
  const isDragging = useRef(false);
  const lastX = useRef(0);

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

  useFrame(() => {
    if (!group.current) return;
    if (!isDragging.current) {
      group.current.rotation.y += velocity.current;
      // 관성 감속 — 자전 속도(0.003) 아래로는 내려가지 않는다
      if (Math.abs(velocity.current) > 0.003) velocity.current *= 0.95;
    }
  });

  return (
    <group
      ref={group}
      rotation={initialRotation}
      onPointerDown={(event) => {
        isDragging.current = true;
        lastX.current = event.clientX;
        (event.target as Element).setPointerCapture?.(event.pointerId);
      }}
      onPointerMove={(event) => {
        if (!isDragging.current || !group.current) return;
        const delta = (event.clientX - lastX.current) * 0.01;
        group.current.rotation.y += delta;
        velocity.current = delta;
        lastX.current = event.clientX;
      }}
      onPointerUp={() => {
        isDragging.current = false;
      }}
    >
      {geometries.map((geometry, index) => (
        <mesh key={index} geometry={geometry} position={[0, 0, -0.07]}>
          {/*
            ⚠️ 배경이다 — 글보다 밝으면 안 된다. 몸체는 검정에 가깝게 두고
            파랑·보라 림라이트만 모서리에 감돌게 한다(어두운 금속 느낌).
          */}
          <meshStandardMaterial
            color={tone === "dark" ? "#232326" : "#d6d3d1"}
            metalness={0.85}
            roughness={0.28}
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
export default function ThreeZ({ size = 420, tone = "dark" }: { size?: number; tone?: Tone }) {
  return (
    <Canvas
      // 성능: 픽셀 밀도 상한 1.5, 카메라는 정면 고정
      dpr={[1, 1.5]}
      camera={{ position: [0, 0, 2.1], fov: 45 }}
      className="cursor-grab active:cursor-grabbing"
      style={{ width: size, height: size, touchAction: "none" }}
    >
      <ambientLight intensity={tone === "dark" ? 0.5 : 0.6} />
      <directionalLight
        position={[2, 3, 4]}
        intensity={tone === "dark" ? 1 : 1.2}
        color="#ffffff"
      />
      {/* 액센트 축 그대로 — 파랑·보라 림라이트가 모서리만 물들인다 */}
      <pointLight position={[-3, 1, 3]} intensity={34} color="#3b82f6" />
      <pointLight position={[3, -1, 3]} intensity={34} color="#8b5cf6" />
      <ZModel tone={tone} />
    </Canvas>
  );
}
