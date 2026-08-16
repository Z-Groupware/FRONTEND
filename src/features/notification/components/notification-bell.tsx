"use client";

import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import {
  Bell,
  CalendarPlus,
  CalendarX,
  Clock,
  FileText,
  Info,
  KeyRound,
  type LucideIcon,
  X,
} from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { NOTIFICATION_TYPE } from "@/constants/notification";

import { NOTIFICATION_DESTINATION } from "../destinations";
import { useNotificationCenter } from "../notification-provider";
import { LOCAL_NOTIFICATION_KIND, type NotificationItem } from "../types";

const NOTIFICATION_ICON: Record<string, LucideIcon> = {
  [NOTIFICATION_TYPE.MEETING_CREATED]: CalendarPlus,
  [NOTIFICATION_TYPE.MEETING_REMINDER]: Clock,
  [NOTIFICATION_TYPE.MEETING_CANCELED]: CalendarX,
  [NOTIFICATION_TYPE.NOTICE_CREATED]: FileText,
  [LOCAL_NOTIFICATION_KIND.PASSWORD_TEMP]: KeyRound,
};

/**
 * 헤더 종 아이콘 — 누르면 펼쳐지는 알림 목록(회의 개설·리마인더·취소·공지·임시 비밀번호 안내).
 *
 * ⚠️ **상단을 덮던 배너를 대신한다**(2026-08-16, #602 후속). 이전엔 오는 즉시 본문 위에
 *    얹혀 화면을 가렸다 — 지금은 종에 표식만 켜고, 목록은 눌러야 나온다.
 * ⚠️ **"전체보기"가 없다.** 알림 화면은 팀이 안 만들기로 했다(CLAUDE.md §렌더링·데이터) —
 *    이 팝오버가 알림이 뜨는 유일한 자리다.
 * ⚠️ **읽음·삭제 둘 다 로컬뿐이다**(`../types.ts`의 `NotificationItem` 주석). 서버에 그 API가
 *    없어 새로고침하면 다시 뜬다 — 생기면 `markNotificationRead`·`removeNotification`을
 *    액션 호출로 바꾸면 된다(컴포넌트는 그대로 둔다, §Mock → Live 격리막과 같은 이유).
 */
export function NotificationBell() {
  const { notifications, unreadCount, markNotificationRead, removeNotification } =
    useNotificationCenter();

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            aria-label={unreadCount > 0 ? `알림, 읽지 않은 알림 ${unreadCount}개` : "알림"}
            className="relative"
          >
            <Bell />
            {/* ⚠️ 색으로 알리는 건 안 읽음뿐(사이드바 공지 점과 같은 표식, DESIGN §5) */}
            {unreadCount > 0 && (
              <span
                aria-hidden
                className="bg-destructive absolute top-1.5 right-1.5 size-[7px] rounded-full"
              />
            )}
          </Button>
        }
      />
      <PopoverContent align="end" sideOffset={8} className="w-80 gap-0 p-0">
        <div className="px-3.5 pt-3 pb-2.5">
          <p className="text-[14px] leading-5 font-semibold">알림</p>
          <p className="text-muted-foreground pt-0.5 text-[12px] leading-4">
            {unreadCount > 0 ? `읽지 않은 알림 ${unreadCount}개` : "새 알림이 없습니다"}
          </p>
        </div>

        {notifications.length === 0 ? (
          <p className="text-muted-foreground border-border border-t px-3.5 py-6 text-center text-[12px] leading-4">
            아직 온 알림이 없습니다.
          </p>
        ) : (
          <ul className="border-border max-h-80 overflow-y-auto border-t">
            {notifications.map((item) => (
              <NotificationRow
                key={item.id}
                item={item}
                onRead={markNotificationRead}
                onRemove={removeNotification}
              />
            ))}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  );
}

function NotificationRow({
  item,
  onRead,
  onRemove,
}: {
  item: NotificationItem;
  onRead: (id: string) => void;
  onRemove: (id: string) => void;
}) {
  const Icon = NOTIFICATION_ICON[item.type] ?? Info;
  const destination = NOTIFICATION_DESTINATION[item.type] ?? null;
  const relativeTime = formatDistanceToNow(item.receivedAt, { addSuffix: true, locale: ko });

  /* 이미 읽은 뒤 또 눌러도 그만이다 — 링크·버튼 둘 다 "다시 읽음"은 아무 일도 안 한다 */
  const rowContent = (
    <>
      <span className="bg-secondary flex size-8 shrink-0 items-center justify-center rounded-full">
        <Icon className="text-muted-foreground size-4" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[13px] leading-5 break-keep">{item.message}</span>
        <span className="text-muted-foreground/70 text-[11px] leading-4">{relativeTime}</span>
      </span>
      {!item.read && (
        <>
          <span className="bg-destructive mt-1.5 size-[6px] shrink-0 rounded-full" aria-hidden />
          <span className="sr-only">안 읽음</span>
        </>
      )}
    </>
  );

  /*
    ⚠️ **지우기 버튼은 클릭 영역 밖 형제다.** `<Link>`/`<button>` 안에 또 `<button>`을 넣으면
       중첩 인터랙티브 엘리먼트라 접근성 트리·클릭 판정이 깨진다 — `<li>`를 기준으로 절대
       배치해 나란히 둔다. 그만큼 본문 오른쪽에 여백(`pr-9`)을 비워 텍스트가 안 깔린다.
  */
  const rowClassName =
    "border-border not-first:border-t hover:bg-foreground/[0.04] flex w-full items-start gap-2.5 py-3 pr-9 pl-3.5 text-left transition-colors";

  return (
    <li className="relative">
      {destination ? (
        <Link href={destination} onClick={() => onRead(item.id)} className={rowClassName}>
          {rowContent}
        </Link>
      ) : (
        <button type="button" onClick={() => onRead(item.id)} className={rowClassName}>
          {rowContent}
        </button>
      )}

      <Button
        variant="ghost"
        size="icon-xs"
        aria-label="알림 지우기"
        onClick={() => onRemove(item.id)}
        className="text-muted-foreground absolute top-2.5 right-2 shrink-0"
      >
        <X aria-hidden />
      </Button>
    </li>
  );
}
