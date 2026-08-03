import type { MetadataRoute } from 'next';

/** robots.txt — 사이트맵 위치를 알려주는 게 주 목적이다.
 *  막을 게 없는 사이트라 전체 허용하되, 검색엔진이 색인해도 의미 없는 것만 뺀다. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Next 내부 빌드 산출물. 색인돼도 쓸모없고 크롤 예산만 먹는다.
      disallow: ['/_next/'],
    },
    sitemap: 'https://ttakcalc.com/sitemap.xml',
    host: 'https://ttakcalc.com',
  };
}
