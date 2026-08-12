import type { MetadataRoute } from 'next';
import { getRates, latestYear } from '@/lib/rates';
import { SALARY, NET, LEAVE_YEARS, GIFT, DIVIDEND, INHERIT } from '@/lib/salaryPages';
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
  { base: '/inheritance-tax', values: INHERIT.all() },
];

/** 요율 데이터 전체에서 가장 최근 확인일을 찾는다.
 *
 *  처음엔 연도 블록의 verifiedAt 하나만 썼는데, **계산기를 추가하는 경우를 빠뜨렸다**(2026-08-06).
 *  상속세·국민연금·가산수당을 넣으면서 34개 URL이 새로 생겼는데도 lastmod는 사흘 전 날짜
 *  그대로 나갔다. 구글이 lastmod를 믿으면 재크롤을 미루므로 새 페이지가 늦게 잡힌다.
 *
 *  섹션마다 붙은 verifiedAt 중 최댓값을 쓰면 새 데이터를 넣을 때 자동으로 올라간다.
 *  빌드시각을 쓰지 않는 이유는 그대로다 — 내용이 안 바뀌었는데 매 배포마다 갱신됐다고 하면
 *  검색엔진이 lastmod 자체를 무시하게 된다. */
function latestVerifiedAt(): string {
  const seen: string[] = [];
  const walk = (node: unknown) => {
    if (Array.isArray(node)) return node.forEach(walk);
    if (!node || typeof node !== 'object') return;
    for (const [k, v] of Object.entries(node as Record<string, unknown>)) {
      if (k === 'verifiedAt' && typeof v === 'string') seen.push(v);
      else walk(v);
    }
  };
  walk(getRates(latestYear()));
  return seen.sort().pop() ?? new Date().toISOString().slice(0, 10);
}

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date(latestVerifiedAt());
  const at = (url: string, priority: number): MetadataRoute.Sitemap[number] =>
    ({ url, lastModified, changeFrequency: 'monthly', priority });

  return [
    at(BASE, 1),
    at(`${BASE}/changes`, 0.8),
    at(`${BASE}/about`, 0.5),
    // 정정 이력은 신뢰 신호라 색인되는 편이 낫다 — 숨길 내용이면 애초에 안 적는다
    at(`${BASE}/corrections`, 0.5),
    // 임베드 안내는 사람이 찾아와 코드를 가져가는 페이지다. 개별 /embed/{계산기}는
    // noindex라 넣지 않는다 — 원본 계산기 페이지와 내용이 겹친다.
    at(`${BASE}/embed`, 0.5),
    // 고지 페이지는 검색 유입을 노리는 페이지가 아니지만, 색인되어야 사이트가 정상적으로
    // 운영된다는 신호가 된다(애드센스 심사도 이 페이지들을 확인한다).
    at(`${BASE}/terms`, 0.3),
    at(`${BASE}/privacy`, 0.3),
    ...CATEGORIES.map(c => at(`${BASE}/c/${c.slug}`, 0.9)),
    ...allCalcHrefs().map(h => at(`${BASE}${h}`, 0.9)),
    // 목록 페이지 — 상세 페이지로 가는 크롤링 경로다. 상세보다 우선순위를 높게 준다.
    ...GENERATED.map(g => at(`${BASE}${g.base}`, 0.7)),
    ...GENERATED.flatMap(g => g.values.map(v => at(`${BASE}${g.base}/${v}`, 0.6))),
  ]
    // 카탈로그와 GENERATED에 같은 URL이 들어가는 경우가 있다(예: /salary는 목록 페이지이면서
    // 카탈로그 항목이기도 하다). 사이트맵에 같은 loc이 두 번 나오면 안 된다.
    .filter((e, i, all) => all.findIndex(x => x.url === e.url) === i);
}
