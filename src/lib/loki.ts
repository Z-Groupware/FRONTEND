import "server-only";

/**
 * Loki push 창구 — 모니터링 서버(z-loki)로 로그를 직접 올린다.
 *
 * ⚠️ **로그 전송 실패가 요청을 깨면 안 된다.** 모니터링 서버가 잠깐 죽어도 사용자가 보는 화면은
 *    멀쩡해야 한다 — 그래서 실패를 던지지 않고 콘솔에만 남긴다(§정직성: 로그는 부가 기능이지
 *    핵심 경로가 아니다).
 * ⚠️ **프라이빗 IP로 붙는다.** 같은 VPC 안이라 퍼블릭 IP로 나갔다 들어오면 보안그룹의
 *    SG 참조 규칙이 매칭 안 될 수 있다(2026-08-13 실측 확인) — 반드시 프라이빗 IP를 쓴다.
 * ⚠️ `LOKI_URL`은 서버 전용이라 `NEXT_PUBLIC_`을 안 붙인다 — 브라우저에 나갈 값이 아니다.
 */
const LOKI_URL = process.env.LOKI_URL ?? "http://172.31.41.26:3100";

type LogLevel = "info" | "warn" | "error";

/**
 * 로그 한 줄을 Loki push API 포맷으로 감싸 보낸다.
 *
 * ⚠️ **타임스탬프는 나노초 문자열이다.** Loki push API 스펙이 그렇게 정해져 있다 — 밀리초를
 *    그대로 보내면 Loki가 1970년대 로그로 착각한다.
 * ⚠️ **`meta`는 JSON으로 직렬화해 한 줄에 욱여넣는다.** 라벨(`stream`)에 자유 필드를 넣으면
 *    값마다 라벨 카디널리티가 늘어 Loki가 무거워진다 — 검색 가능한 축(`job`·`level`)만
 *    라벨로 두고, 나머지는 로그 본문 안에 둔다.
 */
export function pushLokiLog(
  level: LogLevel,
  message: string,
  meta?: Record<string, unknown>,
): void {
  const nowNs = `${Date.now()}000000`;
  const line = meta ? `${message} ${JSON.stringify(meta)}` : message;

  const body = {
    streams: [
      {
        stream: { job: "z-frontend", level },
        values: [[nowNs, line]],
      },
    ],
  };

  /*
    ⚠️ **짧은 타임아웃을 건다**(2초). Loki가 죽으면 fetch는 커넥션 단계에서 오래 매달릴 수 있고,
       그 사이 요청이 쌓이면 5xx 폭주 때 노드 소켓을 다 먹는다 — 로그는 부가 기능이라 못 보내는
       편이 낫다.
    ⚠️ **실패를 삼키되 콘솔에 안 남긴다.** 서버 로그가 Loki push 실패 스택으로 뒤덮이면 정작
       원인을 못 찾는다 — 실패 자체가 이미 5xx 처리 경로에서 일어난 부수 효과다.
  */
  fetch(`${LOKI_URL}/loki/api/v1/push`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(2_000),
  }).catch(() => {
    /* 로그 전송 실패는 무시한다 — 요청 흐름은 이미 5xx로 끝났다. */
  });
}
