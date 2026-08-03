import type { MetadataRoute } from 'next';
import { getRates, latestYear } from '@/lib/rates';
import { SALARY, NET, LEAVE_YEARS, GIFT, DIVIDEND } from '@/lib/salaryPages';
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
  { base: '/annual-leave', values: LEAVE_YEARS.all() },
  { base: '/gift-tax', values: GIFT.all() },
  { base: '/dividend-tax', values: DIVIDEND.all() },
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
    at(`${BASE}/about`, 0.5),
    // 고지 페이지는 검색 유입을 노리는 페이지가 아니지만, 색인되어야 사이트가 정상적으로
    // 운영된다는 신호가 된다(애드센스 심사도 이 페이지들을 확인한다).
    at(`${BASE}/terms`, 0.3),
    at(`${BASE}/privacy`, 0.3),
    ...CATEGORIES.map(c => at(`${BASE}/c/${c.slug}`, 0.9)),
    ...allCalcHrefs().map(h => at(`${BASE}${h}`, 0.9)),
    ...GENERATED.flatMap(g => g.values.map(v => at(`${BASE}${g.base}/${v}`, 0.6))),
  ];
}
