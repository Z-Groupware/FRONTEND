/**
 * 비대면 회의 2단계(녹음 파일 제출)의 **1차 클라이언트 검증** — BE가 받는 형식·용량 제한을
 * 그대로 화면에서도 미리 막는다(백엔드 담당자 확인, 2026-08-14). 서버가 최종 검증한다
 * (§권한: 화면 검증은 UX일 뿐 보안이 아니다) — 여기는 사용자가 잘못된 파일을 골랐을 때
 * 업로드를 기다리지 않고 바로 알려주는 자리일 뿐이다.
 */

export const RECORDING_FILE_ACCEPTED_EXTENSIONS = [
  "wav",
  "mp3",
  "mp4",
  "m4a",
  "flac",
  "ogg",
  "webm",
  "amr",
] as const;

/** 5GiB(2^30 바이트 기준) — 파일 하나당 상한(백엔드 담당자 확인). */
export const RECORDING_FILE_MAX_BYTES = 5 * 1024 * 1024 * 1024;

const ACCEPTED_EXTENSIONS_LABEL = RECORDING_FILE_ACCEPTED_EXTENSIONS.join(", ");

function extensionOf(fileName: string): string {
  const dotIndex = fileName.lastIndexOf(".");
  return dotIndex === -1 ? "" : fileName.slice(dotIndex + 1).toLowerCase();
}

/** 통과하면 `null`, 막을 사유가 있으면 화면에 보여줄 문구를 돌려준다. */
export function validateRecordingFile(file: File): string | null {
  if (!RECORDING_FILE_ACCEPTED_EXTENSIONS.includes(extensionOf(file.name) as never)) {
    return `지원하지 않는 형식입니다 (${ACCEPTED_EXTENSIONS_LABEL}만 가능)`;
  }
  if (file.size > RECORDING_FILE_MAX_BYTES) {
    return "파일 용량이 5GiB를 넘었습니다";
  }
  return null;
}
