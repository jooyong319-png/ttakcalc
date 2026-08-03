/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  async redirects() {
    return [
      // 같은 내용이 두 도메인에서 열리면 중복 콘텐츠가 된다.
      // canonical 태그로도 신호는 주지만, 301로 아예 한 곳에 모으는 게 확실하다.
      // (Vercel 대시보드 설정으로도 되지만 코드에 있어야 "왜 있는지"가 같이 남는다)
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'ttakcalc.vercel.app' }],
        destination: 'https://ttakcalc.com/:path*',
        permanent: true,
      },
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'www.ttakcalc.com' }],
        destination: 'https://ttakcalc.com/:path*',
        permanent: true,
      },
      // 2026-08-03: 잠깐 autokca.com으로 옮겼다가 되돌렸다. 그 도메인이 살아 있는 동안
      // 같은 내용이 두 곳에서 열리면 검색이 갈린다. 경로를 유지한 채 정규 도메인으로 넘긴다.
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'autokca.com' }],
        destination: 'https://ttakcalc.com/:path*',
        permanent: true,
      },
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'www.autokca.com' }],
        destination: 'https://ttakcalc.com/:path*',
        permanent: true,
      },
    ];
  },

  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          // 클릭재킹 차단. X-Frame-Options: SAMEORIGIN 을 쓰다가 CSP로 바꿨다.
          //
          // 이유(2026-08-03): SAMEORIGIN은 예외를 둘 수 없어서 구글 태그 어시스턴트까지
          // 막힌다. 어시스턴트는 사이트를 tagassistant.google.com 안에 iframe으로 띄워
          // 검사하는데, 그게 차단되니 "태그가 감지되지 않음"으로 나온다. GA 태그 자체는
          // HTML에 정상적으로 들어 있고 Googlebot도 읽어간다 — 프레임만 막힌 것이다.
          //
          // frame-ancestors는 허용 목록을 쓸 수 있다(X-Frame-Options의 ALLOW-FROM은
          // 폐기됐다). 두 헤더가 같이 있으면 브라우저 동작이 갈리므로 XFO는 제거한다.
          // 나열한 구글 도메인 외에는 여전히 전부 차단이라 방어 수준은 그대로다.
          {
            key: 'Content-Security-Policy',
            value:
              "frame-ancestors 'self' https://tagassistant.google.com https://tagmanager.google.com",
          },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
      {
        // 폰트는 내용이 바뀌면 파일명이 바뀌므로 영구 캐시해도 안전하다
        source: '/fonts/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
    ];
  },
};
export default nextConfig;
