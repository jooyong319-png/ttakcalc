/**
 * 계산기가 실제로 쓰였는지 세는 곳.
 *
 * 왜 필요한가 — 지금은 어떤 계산기가 열렸는지(페이지뷰)만 알고, **열고 나서 실제로
 * 계산까지 했는지**를 모른다. 33종 중 무엇을 더 다듬고 무엇을 접을지 판단할 근거가 없다.
 * 검색 유입이 많아도 아무도 계산을 안 하는 계산기는 제목만 맞고 내용이 틀린 것이다.
 *
 * ## 무엇을 보내지 않는가 (여기가 핵심이다)
 *
 * **입력한 금액은 절대 보내지 않는다.** 연봉, 상속재산, 대출금, 집값은 그 사람의
 * 재산 상태 그 자체다. 통계로 보면 흥미롭겠지만, 우리가 알 이유가 없는 정보를
 * 남의 서버에 쌓아 두는 것이고 개인정보처리방침에 적어 둔 수집 범위와도 어긋난다.
 * 보내는 것은 "어떤 계산기에서 계산이 한 번 일어났다"는 사실 하나뿐이다.
 *
 * 계산기 이름도 화면 경로에서 가져온다 — 경로는 이미 서버 로그에 남는 공개 정보다.
 */

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

/** 경로에서 계산기 이름을 뽑는다. /calc/salary → salary, /embed/salary → salary */
export function calculatorFromPath(pathname: string): string | null {
  const m = pathname.match(/^\/(?:calc|embed)\/([a-z0-9-]+)/);
  return m ? m[1] : null;
}

/**
 * 계산이 한 번 일어났다고 알린다.
 *
 * gtag가 없으면(개발 환경, 광고 차단기, 임베드) 조용히 아무것도 하지 않는다 —
 * 분석 도구가 없다고 계산기가 깨지면 안 된다.
 */
export function trackCalculate(calculator: string): void {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return;
  window.gtag('event', 'calculate', { calculator });
}
