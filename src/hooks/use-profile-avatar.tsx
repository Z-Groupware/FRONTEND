"use client";

import { type ReactElement, useMemo } from "react";

import { type PaletteColor, pickPaletteColor } from "@/lib/palette";

/**
 * 이름+직급을 해싱해 항상 같은 파스텔 색을 돌려준다(BE에 프로필 필드가 없어 FE에서 결정).
 * 동명이인은 role까지 키에 포함해 구분한다 — role이 바뀌면 색도 바뀐다(트레이드오프 감수).
 *
 * ⚠️ 팔레트는 `lib/palette`가 정본이다. 프로젝트 태그도 같은 것을 쓴다 — 두 벌로 들고 있으면
 *    같은 화면에 두 가지 초록이 뜬다.
 */
function getProfileAvatarColor(name: string, role: string): PaletteColor {
  return pickPaletteColor(`${name}-${role}`);
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
