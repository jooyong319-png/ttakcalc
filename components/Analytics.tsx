import Script from 'next/script';

/** GA4 측정 ID. HTML에 그대로 나가는 공개 값이라 환경변수로 숨길 이유가 없다.
 *  오히려 환경변수로 두면 Vercel에 등록을 빠뜨렸을 때 조용히 수집이 멈춘다. */
const GA_ID = 'G-RS0PLXVBPQ';

/**
 * Google Analytics 4.
 *
 * **운영 배포에서만 로드한다.** `VERCEL_ENV`는 Vercel이 넣어주는 값으로 운영 배포에서만
 * `'production'`이고, 프리뷰 배포와 로컬에서는 비어 있다. `NODE_ENV`로 판단하면
 * `npm run build` 결과물이 전부 production이라 로컬 확인·프리뷰 배포의 클릭까지 지표에 섞인다.
 * 페이지가 전부 정적 생성이므로 이 판단은 빌드 시점에 확정돼 번들에 박힌다.
 *
 * 라우트 이동 시 page_view는 GA4 향상된 측정의 "브라우저 기록 이벤트 기반 페이지 변경"이
 * 처리한다(Next 라우터가 pushState를 쓴다). 그래서 여기서 따로 추적하지 않는다.
 * GA4 관리 > 데이터 스트림에서 이 항목이 꺼지면 첫 진입만 잡히므로 켜져 있어야 한다.
 */
export function Analytics() {
  if (process.env.VERCEL_ENV !== 'production') return null;

  return (
    <>
      {/* afterInteractive — 첫 화면 렌더를 막지 않으면서 이탈 전에는 실행된다.
          계산기는 값을 입력해야 쓸모가 생기는 사이트라 lazyOnload면 놓치는 세션이 생긴다. */}
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GA_ID}');`}
      </Script>
    </>
  );
}
