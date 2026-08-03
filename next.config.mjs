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
    ];
  },

  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          // 계산기 사이트라 남의 프레임에 끼워 넣을 이유가 없다 — 클릭재킹 차단
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
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
