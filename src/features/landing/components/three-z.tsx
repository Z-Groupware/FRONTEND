"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

import { burstAt, finaleAt, heroProgress, scatterAt, shardMixAt } from "../hero-progress";

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

/**
 * 로고를 **작은 조각으로 쪼갠다** — 격자를 깔고 로고 안에 들어오는 칸만 남긴다.
 *
 * ⚠️ 세 덩이로는 "분해"가 아니라 "세 조각이 움직인다"로 보인다(2026-08-12 피드백). 칸을 잘게
 *    나눠야 흩어지는 게 읽힌다.
 * ⚠️ 칸 수를 키우면 그리는 양이 그만큼 는다 — 22면 로고 안에 200개 안팎이 남는다. 그 이상은
 *    저사양 노트북에서 프레임이 떨어진다.
 * ⚠️ 무작위를 쓰지 않는다. 같은 자리에 늘 같은 조각이 있어야 새로고침해도 같은 화면이다.
 */
const GRID = 22;

function isInsidePolygon(x: number, y: number, polygon: [number, number][]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i]!;
    const [xj, yj] = polygon[j]!;
    /* 반직선이 변을 몇 번 지나는가 — 홀수면 안이다(ray casting) */
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

/** 조각 하나 — 제자리와, 흩어질 때 날아갈 방향 */
interface Shard {
  home: [number, number];
  direction: [number, number, number];
  spin: number;
}

function buildShards(): Shard[] {
  const shards: Shard[] = [];
  const step = 100 / GRID;

  for (let row = 0; row < GRID; row++) {
    for (let column = 0; column < GRID; column++) {
      const cx = (column + 0.5) * step;
      const cy = (row + 0.5) * step;
      if (!PIECES.some((polygon) => isInsidePolygon(cx, cy, polygon))) continue;

      /* three 좌표로: x는 왼→오, y는 아래→위로 뒤집는다 */
      const x = cx / 100 - 0.5;
      const y = 0.5 - cy / 100;

      /*
        ⚠️ **자기 자리에서 바깥으로** 날아간다. 중심에서 먼 조각일수록 멀리 — 그래야 다시
           모일 때 "원래 모양으로 돌아왔다"가 읽힌다. 앞뒤(z)는 자리마다 갈라 층을 만든다.
      */
      const spread = 1.6;
      shards.push({
        home: [x, y],
        direction: [x * spread, y * spread, ((column % 3) - 1) * 0.5],
        spin: ((row * GRID + column) % 7) - 3,
      });
    }
  }

  return shards;
}

type Tone = "dark" | "light";

/**
 * 로고 본체 — **격자로 쪼갠 조각들**이 흩어졌다 모인다.
 *
 * ⚠️ 조각 하나하나를 mesh로 두지 않고 `instancedMesh` 하나로 그린다. 200개를 따로 그리면
 *    그리기 명령이 200번 나가 저사양 기기에서 프레임이 떨어진다 — 인스턴스는 한 번이다.
 * ⚠️ 위치·회전은 **프레임 루프에서 행렬로만** 바꾼다. 상태로 두면 초당 60번 리렌더가 돈다.
 */
function ZModel({
  tone,
  isFeature,
  reactsToScroll,
}: {
  tone: Tone;
  isFeature: boolean;
  reactsToScroll: boolean;
}) {
  const group = useRef<THREE.Group>(null!);
  const mesh = useRef<THREE.InstancedMesh>(null!);
  /** 매끈한 원본 Z — 모여 있을 때 보이는 쪽 */
  const solid = useRef<THREE.Group>(null!);
  const solidMaterial = useRef<THREE.MeshStandardMaterial>(null!);
  const shardMaterial = useRef<THREE.MeshStandardMaterial>(null!);
  const rim = useRef<[THREE.PointLight | null, THREE.PointLight | null]>([null, null]);
  /** 자전 속도 — 배경이라 아주 느리게 돈다 */
  const velocity = useRef(0.003);
  // 정면 정자세는 간판처럼 밋밋하다 — 처음부터 비스듬히
  const initialRotation: [number, number, number] = [-0.15, 0.4, 0];

  const shards = useMemo(() => buildShards(), []);

  /*
    ⚠️ **모여 있을 때는 매끈한 원본을 보여준다**(2026-08-12 피드백). 격자 조각만 두면 붙어 있어도
       계단처럼 각져서 로고가 거칠어진다 — 원본과 조각을 겹쳐 두고, 흩어지기 시작할 때만
       조각으로 넘긴다. 사람 눈에는 **매끈한 Z가 부서졌다가 다시 매끈해지는** 것으로 보인다.
  */
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

  /* ⚠️ 떠날 때 GPU 자원을 돌려준다 — 안 치우면 오갈 때마다 쌓여 컨텍스트가 날아간다 */
  useEffect(() => () => geometries.forEach((geometry) => geometry.dispose()), [geometries]);
  /** 행렬을 매 프레임 새로 만들지 않는다 — 하나를 돌려 쓴다 */
  const scratch = useMemo(() => new THREE.Object3D(), []);

  /*
    ⚠️ 칸을 **거의 붙여 놓는다**(0.99). 벌려 두면 모여 있을 때도 픽셀처럼 보여 로고가 거칠어진다 —
       조각임은 흩어질 때만 드러나면 된다(2026-08-12).
  */
  const cell = (1 / GRID) * 0.99;

  useFrame(() => {
    if (!group.current || !mesh.current) return;

    /* ⚠️ 짧은 페이지에서는 연출을 끈다 — 스크롤 몇 칸에 다 지나가면 정신없다(§hero-progress) */
    const isChoreographed = reactsToScroll && heroProgress.active;
    const progress = isChoreographed ? heroProgress.current : 0;

    if (isChoreographed) {
      /*
        ⚠️ 두 바퀴까지만 돈다. 더 돌리면 스크롤 몇 칸에 팽이처럼 보여 뒤 글자를 못 읽는다.
        ⚠️ 내려갈수록 작아졌다가, **맨 밑에서 다시 커지며 완성**된다(§hero-progress `finaleAt`).
      */
      const finale = finaleAt(progress);
      group.current.rotation.y = 0.4 + progress * Math.PI * 2;
      group.current.rotation.x = -0.15 + progress * 0.3 - finale * 0.15;
      group.current.scale.setScalar(1 - progress * 0.3 + finale * 0.22);
    } else {
      group.current.rotation.y += velocity.current;
    }

    const burst = burstAt(progress);
    const finale = finaleAt(progress);

    /*
      ⚠️ 바꿔치기 구간은 `shardMixAt`이 정한다 — **한창 흩어져 있을 때** 섞어야 격자 실루엣과
         매끈한 원본이 나란히 비교되지 않는다(§hero-progress).
      ⚠️ 다 사라진 쪽은 **아예 안 그린다**(`visible`). 투명도 0짜리도 그리기 비용은 그대로다.
    */
    /* ⚠️ 벌어진 정도로 판단한다 — 흩어짐 그대로 쓰면 계단 모양일 때 바뀐다(§hero-progress) */
    const scatter = scatterAt(burst);
    const shardMix = shardMixAt(scatter);
    if (solidMaterial.current) solidMaterial.current.opacity = 1 - shardMix;
    if (shardMaterial.current) shardMaterial.current.opacity = shardMix;
    if (solid.current) solid.current.visible = shardMix < 0.99;
    mesh.current.visible = shardMix > 0.01;

    if (shardMix < 0.01) return;

    /*
      ⚠️ **빛이 흩어짐을 따라간다**(2026-08-12). 어두운 금속이 어두운 배경에서 흩어지면
         "검은 조각이 좀 움직이네"로 끝난다 — 벌어질수록 파랑·보라 림라이트를 올리고,
         맨 밑에서 완성될 때 한 번 더 세게 준다. 빛이 있어야 조각이 눈에 잡힌다.
    */
    /*
      ⚠️ **밝은 무대에서는 빛을 훨씬 아낀다.** 몸체가 흰색이라 같은 세기를 주면 하얗게 타서
         형태가 사라진다 — 어두운 무대는 빛으로 조각을 드러내고, 밝은 무대는 음영으로 드러낸다.
    */
    /*
      ⚠️ 빛을 **덜 올린다**(90 → 48). 조각이 정육면체라 같은 세기에도 원본보다 훨씬 밝게 뜨는데,
         거기에 빛까지 세게 주니 흩어지는 순간 색이 바뀐 것처럼 보였다.
    */
    const boost = tone === "dark" ? burst * 48 + finale * 44 : burst * 16 + finale * 12;
    rim.current.forEach((light) => {
      if (light) light.intensity = isFeature ? 32 : 34 + boost;
    });

    shards.forEach((shard, index) => {
      const [hx, hy] = shard.home;
      const [dx, dy, dz] = shard.direction;

      scratch.position.set(hx + dx * scatter, hy + dy * scatter, -0.07 + dz * scatter);
      scratch.rotation.set(
        scatter * shard.spin * 0.5,
        scatter * shard.spin * 0.4,
        scatter * shard.spin,
      );
      /* 흩어질수록 조각이 조금 작아진다 — 멀어지는 느낌을 거리 없이 만든다 */
      scratch.scale.setScalar(1 - scatter * 0.25);
      scratch.updateMatrix();
      mesh.current.setMatrixAt(index, scratch.matrix);
    });

    mesh.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <group ref={group} rotation={initialRotation}>
      {/*
        ⚠️ 배경이다 — 글보다 밝으면 안 된다.
        **어두운 무대(dark):** 몸체는 검정에 가깝게 두고 파랑·보라 림라이트만 모서리에
        감돌게 한다(어두운 금속).
        **밝은 무대(light):** 회색으로 칠하지 않는다 — 흰 바탕 위 회색 덩어리는 얼룩처럼
        보인다. 몸체를 **흰 종이처럼** 두고(무광·낮은 금속기) 형태는 **음영으로만** 읽히게 한다.
      */}
      {/* 매끈한 원본 — 모여 있을 때 이쪽이 보인다 */}
      <group ref={solid}>
        {geometries.map((geometry, index) => (
          <mesh key={index} geometry={geometry} position={[0, 0, -0.07]}>
            <meshStandardMaterial
              ref={index === 0 ? solidMaterial : undefined}
              transparent
              color={isFeature ? "#78716c" : tone === "dark" ? "#232326" : "#ffffff"}
              metalness={isFeature ? 0.55 : tone === "dark" ? 0.85 : 0.4}
              roughness={isFeature ? 0.35 : tone === "dark" ? 0.28 : 0.3}
            />
          </mesh>
        ))}
      </group>

      <instancedMesh ref={mesh} args={[undefined, undefined, shards.length]}>
        <boxGeometry args={[cell, cell, 0.14]} />
        {/*
          ⚠️ **조각은 원본보다 덜 번들거려야 한다**(2026-08-12 피드백). 원본은 판판해서 빛을
             거의 안 받는데, 정육면체는 **옆면·모서리가 빛을 정면으로 받아** 하얗게 뜬다 —
             같은 색을 줘도 딴 물건으로 보인다.
          ⚠️ 그래서 금속기를 낮추고(0.85 → 0.3) 거칠기를 올린다(0.28 → 0.6). 거울처럼 비추지
             않으니 조각도 원본과 같은 톤으로 앉는다.
        */}
        <meshStandardMaterial
          ref={shardMaterial}
          transparent
          opacity={0}
          color={isFeature ? "#78716c" : tone === "dark" ? "#232326" : "#ffffff"}
          metalness={isFeature ? 0.55 : tone === "dark" ? 0.3 : 0.15}
          roughness={isFeature ? 0.35 : tone === "dark" ? 0.6 : 0.72}
        />
      </instancedMesh>

      {/* 액센트 축 — 파랑·보라가 모서리를 물들인다. 세기는 위 루프가 흩어짐에 맞춰 올린다 */}
      <pointLight
        ref={(light) => {
          rim.current[0] = light;
        }}
        position={[-3, 1, 3]}
        intensity={34}
        color="#60a5fa"
      />
      <pointLight
        ref={(light) => {
          rim.current[1] = light;
        }}
        position={[3, -1, 3]}
        intensity={34}
        color="#a78bfa"
      />
    </group>
  );
}

export default function ThreeZ({
  size = 420,
  tone = "dark",
  /** 배경이 아니라 **보여주는** 자리라면 켠다 — 몸체가 밝아지고 금속기를 낮춰 형태가 또렷해진다 */
  isFeature = false,
  reactsToScroll = false,
}: {
  size?: number;
  tone?: Tone;
  isFeature?: boolean;
  /** 첫 화면 배경일 때만 켠다 — 스크롤에 따라 돌고 흩어졌다 모인다 */
  reactsToScroll?: boolean;
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
      <ZModel tone={tone} isFeature={isFeature} reactsToScroll={reactsToScroll} />
    </Canvas>
  );
}
