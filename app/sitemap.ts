import type { MetadataRoute } from 'next';
import { getRates, latestYear } from '@/lib/rates';
import { SALARY, NET } from '@/lib/salaryPages';
import { PRICE } from '@/lib/propertyPages';
import { CC, PUBLIC_PRICE } from '@/lib/localTaxPages';
import { CATEGORIES, allCalcHrefs } from '@/lib/catalog';

const BASE = 'https://ttakcalc.com';


/** 값 하나당 페이지 하나인 프로그래매틱 라우트 */
const GENERATED: { base: string; values: number[] }[] = [
  { base: '/salary', values: SALARY.all() },
  { base: '/acquisition-tax', values: PRICE.all() },
  { base: '/brokerage-fee', values: PRICE.all() },
  { base: '/car-tax', values: CC.all() },
  { base: '/property-tax', values: PUBLIC_PRICE.all() },
  { base: '/net-salary', values: NET.all() },
];

// lastmod에 빌드시각을 넣지 않는다 — 내용이 안 바뀌었는데 매 배포마다 갱신됐다고 하면
// 검색엔진이 lastmod를 무시하게 된다. 이 사이트의 내용은 요율 데이터가 바뀔 때만 바뀌므로
// 요율의 verifiedAt을 그대로 쓴다.
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date(getRates(latestYear()).verifiedAt);
  const at = (url: string, priority: number): MetadataRoute.Sitemap[number] =>
    ({ url, lastModified, changeFrequency: 'monthly', priority });

  return [
    at(BASE, 1),
    at(`${BASE}/changes`, 0.8),
    ...CATEGORIES.map(c => at(`${BASE}/c/${c.slug}`, 0.9)),
    ...allCalcHrefs().map(h => at(`${BASE}${h}`, 0.9)),
    ...GENERATED.flatMap(g => g.values.map(v => at(`${BASE}${g.base}/${v}`, 0.6))),
  ];
}
