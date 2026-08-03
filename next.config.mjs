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
      // ⚠️ www ↔ apex 리다이렉트를 여기에 두지 말 것 (2026-08-03 사고)
      //
      // 'www.ttakcalc.com → ttakcalc.com'을 코드에 넣어 뒀는데, Vercel 쪽에서는 반대로
      // apex를 www로 보내고 있었다. 서로를 가리켜 무한 루프가 났고 사이트가 통째로 죽었다.
      //
      //   ttakcalc.com     → 308 → www.ttakcalc.com   (Vercel 도메인 설정)
      //   www.ttakcalc.com → 308 → ttakcalc.com       (여기 있던 규칙)
      //
      // apex/www 중 무엇을 정본으로 할지는 **Vercel 도메인 설정 한 곳에서만** 정한다.
      // 코드가 같은 판단을 중복으로 하면 언젠가 서로 어긋난다. 위의 vercel.app 규칙은
      // Vercel이 관리하지 않는 호스트라 코드에 남겨 둔다.
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
