/** GA4 측정 ID. HTML에 그대로 나가는 공개 값이라 환경변수로 숨길 이유가 없다.
 *  오히려 환경변수로 두면 Vercel에 등록을 빠뜨렸을 때 조용히 수집이 멈춘다. */
const GA_ID = 'G-RS0PLXVBPQ';

/**
 * Google Analytics 4. **`<head>` 안에서 호출할 것.**
 *
 * ## next/script를 쓰지 않는 이유 — 태그 감지 실패 (2026-08-03)
 *
 * 처음엔 `next/script`의 `strategy="afterInteractive"`로 넣었다. 브라우저에서는 정상
 * 동작했지만(`/g/collect` 요청까지 확인) **구글이 태그를 감지하지 못했다.**
 *
 * App Router에서 afterInteractive는 HTML에 `<script>`를 넣지 않는다. 응답에는
 * `<link rel="preload">`와 RSC 페이로드 안의 데이터만 있고, 실제 스크립트는 하이드레이션
 * 후에 JS가 주입한다. 구글의 감지기는 HTML을 읽지 하이드레이션을 기다리지 않는다.
 * 같은 이유로 GTM·서치콘솔·애드센스 심사도 전부 못 본다.
 *
 * 그래서 구글이 준 스니펫 그대로 소스에 박는다. `async`라 렌더를 막지 않으므로
 * next/script를 쓸 이유가 애초에 크지 않았다.
 *
 * ## 운영 배포에서만 로드한다
 *
 * `VERCEL_ENV`는 Vercel이 넣어주는 값으로 운영 배포에서만 `'production'`이고, 프리뷰
 * 배포와 로컬에서는 비어 있다. `NODE_ENV`로 판단하면 `npm run build` 결과물이 전부
 * production이라 로컬 확인·프리뷰 배포의 클릭까지 지표에 섞인다.
 * 페이지가 전부 정적 생성이므로 이 판단은 빌드 시점에 확정돼 HTML에 박힌다.
 *
 * 라우트 이동 시 page_view는 GA4 향상된 측정의 "브라우저 기록 이벤트 기반 페이지 변경"이
 * 처리한다(Next 라우터가 pushState를 쓴다). 그래서 여기서 따로 추적하지 않는다.
 */
export function Analytics() {
  if (process.env.VERCEL_ENV !== 'production') return null;

  return (
    <>
      <script async src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} />
      <script
        dangerouslySetInnerHTML={{
          __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GA_ID}');`,
        }}
      />
    </>
  );
}
