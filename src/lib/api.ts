import "server-only";

/**
 * BE 호출 창구 — **Next 서버에서만** 돈다(§핵심 4원칙 ②).
 *
 * 브라우저는 Next 서버(Server Action·Route Handler)에만 말을 걸고, BE와의 대화는 여기가 대신한다.
 * 토큰은 httpOnly 쿠키에서 읽어 헤더로 붙이므로 **브라우저 JS는 토큰을 못 본다.**
 *
 * ⚠️ **봉투를 벗기는 일은 여기 한 곳에서만 한다.** BE는 성공·실패 모두
 *    `{ httpStatus, message, data }`로 답한다(`global/response/ApiResponse.java`) —
 *    컴포넌트가 봉투를 알면 모양이 바뀔 때 전 화면을 고쳐야 한다(§연동 검증).
 * ⚠️ `message`는 **화면에 그대로 띄울 한국어 문장**이다. 코드로 문구를 조립하지 않는다.
 * ⚠️ 실패의 `data.code`(`AU-035` 등)는 **분기용**이다 — 사람에게 보여 주는 건 `message`다.
 */

/** BE 주소. 서버에서만 읽으므로 `NEXT_PUBLIC_`을 붙이지 않는다 — 브라우저에 나갈 값이 아니다. */
const BASE_URL = process.env.BACKEND_API_URL ?? "http://localhost:8080";

interface ApiEnvelope<T> {
  httpStatus: number;
  message: string;
  data: T;
}

/**
 * BE가 돌려준 실패.
 * ⚠️ `message`를 그대로 화면에 쓴다. `code`는 흐름을 가를 때만 본다(예: `ALREADY_ONBOARDED`).
 */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly code?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

interface ApiInit extends Omit<RequestInit, "body"> {
  /** JSON으로 직렬화해 보낼 본문 */
  json?: unknown;
  /** 붙일 액세스 토큰. 로그인 전 화면(코드 조회·등록 신청·로그인)은 넘기지 않는다. */
  accessToken?: string;
}

/**
 * BE 호출 + 봉투 벗기기.
 *
 * ⚠️ 조회 기본값은 `no-store`다. 사내 도구라 사람마다 보이는 값이 다른데, 기본 캐시에 걸리면
 *    남의 화면이 다른 사람에게 보인다. 캐시가 필요한 자리에서 호출부가 `cache`를 넘긴다.
 */
export async function serverApi<T>(path: string, init: ApiInit = {}): Promise<T> {
  const { json, accessToken, headers, ...rest } = init;

  const response = await fetch(`${BASE_URL}${path}`, {
    cache: "no-store",
    ...rest,
    headers: {
      ...(json === undefined ? {} : { "Content-Type": "application/json" }),
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...headers,
    },
    ...(json === undefined ? {} : { body: JSON.stringify(json) }),
  });

  /*
    ⚠️ 본문이 없는 응답(204·게이트웨이 오류)도 있다. `response.json()`을 그냥 부르면
       파싱 예외가 나서 **BE가 준 상태 코드가 사라진다** — 무슨 일이 났는지 알 수 없게 된다.
  */
  const raw: unknown = await response.text().then((text) => {
    if (!text) return null;
    try {
      return JSON.parse(text) as unknown;
    } catch {
      return null;
    }
  });

  if (!response.ok) throw toApiError(response.status, raw);

  return (raw as ApiEnvelope<T> | null)?.data as T;
}

/** 실패 봉투에서 사람에게 보여 줄 문장과 분기용 코드를 꺼낸다. */
function toApiError(status: number, raw: unknown): ApiError {
  if (typeof raw !== "object" || raw === null) {
    return new ApiError(status, "요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.");
  }

  const envelope = raw as { message?: unknown; data?: unknown };
  const message =
    typeof envelope.message === "string" && envelope.message.trim().length > 0
      ? envelope.message
      : "요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.";

  const data = envelope.data;
  const code =
    typeof data === "object" &&
    data !== null &&
    typeof (data as { code?: unknown }).code === "string"
      ? (data as { code: string }).code
      : undefined;

  return new ApiError(status, message, code);
}

/** 화면에 띄울 한 줄 — `ApiError`면 BE 문장을 그대로, 아니면 통신 실패로 본다. */
export function toUserMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  return "서버에 연결하지 못했습니다. 잠시 후 다시 시도해 주세요.";
}
