"use client";

import { type ReactElement, useMemo } from "react";

/**
 * ⚠️ 디자인 수정 지점 — 팔레트 교체 시 각 항목의 bg/text hex 값만 바꾼다.
 *    배열 순서·개수를 바꾸면 기존 인물들의 색 배정이 전부 밀려서 바뀐다.
 */
const AVATAR_PALETTE = [
  { bg: "#DCFCE7", text: "#166534" }, // 그린
  { bg: "#DBEAFE", text: "#1E40AF" }, // 블루
  { bg: "#FCE7F3", text: "#9D174D" }, // 핑크
  { bg: "#FEF3C7", text: "#92400E" }, // 앰버
  { bg: "#EDE9FE", text: "#5B21B6" }, // 바이올렛
  { bg: "#E0F2FE", text: "#075985" }, // 스카이
  { bg: "#FFEDD5", text: "#9A3412" }, // 오렌지
  { bg: "#F1F5F9", text: "#334155" }, // 슬레이트
  { bg: "#CCFBF1", text: "#115E59" }, // 틸
  { bg: "#FAE8FF", text: "#86198F" }, // 퍼플핑크
  { bg: "#FEF9C3", text: "#854D0E" }, // 옐로우
  { bg: "#E7E5E4", text: "#44403C" }, // 웜그레이
  { bg: "#D1FAE5", text: "#065F46" }, // 에메랄드
  { bg: "#DDD6FE", text: "#4C1D95" }, // 인디고
  { bg: "#FFE4E6", text: "#9F1239" }, // 로즈
  { bg: "#CFFAFE", text: "#155E75" }, // 시안
] as const;

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

interface ProfileAvatarColor {
  bgColor: string;
  textColor: string;
}

/**
 * 이름+직급을 해싱해 항상 같은 파스텔 색을 돌려준다(BE에 프로필 필드가 없어 FE에서 결정).
 * 동명이인은 role까지 키에 포함해 구분한다 — role이 바뀌면 색도 바뀐다(트레이드오프 감수).
 */
function getProfileAvatarColor(name: string, role: string): ProfileAvatarColor {
  const key = `${name}-${role}`;
  const index = hashString(key) % AVATAR_PALETTE.length;
  const palette = AVATAR_PALETTE[index] ?? AVATAR_PALETTE[0];
  return { bgColor: palette.bg, textColor: palette.text };
}

/** 원형 배경 안에 꽉 채워 그리는 사람 실루엣. 하단은 원 밖으로 잘리도록 slice 처리한다. */
function ProfileAvatarIcon({ color }: { color: string }) {
  return (
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 100 100"
      preserveAspectRatio="xMidYMax slice"
      style={{ display: "block" }}
      aria-hidden="true"
    >
      <circle cx="50" cy="38" r="18" fill={color} />
      <path d="M50 58c-22 0-34 14-34 34h68c0-20-12-34-34-34z" fill={color} />
    </svg>
  );
}

/**
 * 이름+직급만 넘기면 바로 렌더링 가능한 원형 프로필 아바타(JSX)를 돌려준다.
 * BE에 프로필 이미지 필드가 없어서, 같은 사람은 항상 같은 파스텔 색+실루엣이 나오도록 FE에서 생성한다.
 *
 * @param name 이름 — 표시 및 색상 해시 키에 사용
 * @param role 직급/역할 — 동명이인 구분용으로 색상 해시 키에 함께 포함(role이 바뀌면 색도 바뀜)
 * @param size 아바타 지름(px). 기본값 40
 * @returns 그대로 렌더링하면 되는 원형 아바타 JSX 엘리먼트 (배경색+실루엣 포함)
 *
 * @example
 * const avatar = useProfileAvatar(member.name, member.role);
 * return <div>{avatar}</div>;
 */
export function useProfileAvatar(name: string, role: string, size: number = 40): ReactElement {
  const { bgColor, textColor } = useMemo(() => getProfileAvatarColor(name, role), [name, role]);

  return useMemo(
    () => (
      <div
        style={{
          width: size,
          height: size,
          borderRadius: "9999px",
          overflow: "hidden",
          backgroundColor: bgColor,
          flexShrink: 0,
        }}
      >
        <ProfileAvatarIcon color={textColor} />
      </div>
    ),
    [size, bgColor, textColor],
  );
}
