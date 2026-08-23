import { execFileSync } from 'node:child_process';
import type { MetadataRoute } from 'next';
import { getRates, latestYear } from '@/lib/rates';
import {
  SALARY, NET, LEAVE_YEARS, GIFT, DIVIDEND, INHERIT, salaryComparePairs, familyPairs,
  allSalaryValues,
} from '@/lib/salaryPages';
import { PRICE } from '@/lib/propertyPages';
import { CC, PUBLIC_PRICE, carAgePairs } from '@/lib/localTaxPages';
import { CATEGORIES, allCalcHrefs } from '@/lib/catalog';

const BASE = 'https://ttakcalc.com';


/** 값 하나당 페이지 하나인 프로그래매틱 라우트 */
/** 값 하나당 페이지 하나인 프로그래매틱 라우트. src는 그 페이지를 만드는 소스 파일이다. */
const GENERATED: { base: string; values: number[]; src: string }[] = [
  { base: '/salary', values: allSalaryValues(), src: 'app/(site)/salary/[man]/page.tsx' },
  { base: '/acquisition-tax', values: PRICE.all(), src: 'app/(site)/acquisition-tax/[man]/page.tsx' },
  { base: '/brokerage-fee', values: PRICE.all(), src: 'app/(site)/brokerage-fee/[man]/page.tsx' },
  { base: '/car-tax', values: CC.all(), src: 'app/(site)/car-tax/[cc]/page.tsx' },
  { base: '/property-tax', values: PUBLIC_PRICE.all(), src: 'app/(site)/property-tax/[man]/page.tsx' },
  { base: '/net-salary', values: NET.all(), src: 'app/(site)/net-salary/[man]/page.tsx' },
  { base: '/annual-leave', values: LEAVE_YEARS.all(), src: 'app/(site)/annual-leave/[years]/page.tsx' },
  { base: '/gift-tax', values: GIFT.all(), src: 'app/(site)/gift-tax/[man]/page.tsx' },
  { base: '/dividend-tax', values: DIVIDEND.all(), src: 'app/(site)/dividend-tax/[man]/page.tsx' },
  { base: '/inheritance-tax', values: INHERIT.all(), src: 'app/(site)/inheritance-tax/[man]/page.tsx' },
];

/** 요율 데이터 전체에서 가장 최근 확인일을 찾는다.
 *
 *  이 값만으로 lastmod를 정하면 **페이지가 늘어난 경우를 놓친다.** 실제로 세 번 당했다:
 *  2026-08-06(계산기 3종 추가), 2026-08-12(/about 표시), 2026-08-13(롱테일 179장 추가).
 *  마지막 건은 699개 URL 전체가 2026-08-12 한 날짜로 나가고 있었다 — 하루 뒤에 생긴
 *  179장까지 "8월 12일에 마지막 수정"이라고 신고한 셈이다.
 *
 *  그래서 이제 데이터 확인일은 **하한**으로만 쓰고, 페이지별 실제 변경 시점은 아래
 *  routeModified()가 소스 파일에서 가져온다. */
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

/**
 * 그 페이지를 만드는 **소스 파일이 마지막으로 바뀐 날**.
 *
 *  빌드시각을 쓰지 않는 이유는 그대로다 — 내용이 안 바뀌었는데 매 배포마다 갱신됐다고 하면
 *  검색엔진이 lastmod 자체를 무시하게 된다. git 커밋일은 **실제로 그 페이지가 바뀐 날**이라
 *  그 함정에 빠지지 않으면서 새 페이지도 정확히 잡는다.
 *
 *  얕은 클론 등으로 git을 못 쓰면 null을 돌려주고, 호출부가 데이터 확인일로 폴백한다.
 *  사이트맵 하나 때문에 배포가 실패하는 것이 날짜가 조금 부정확한 것보다 나쁘다.
 */
const gitDateCache = new Map<string, string | null>();
function routeModified(sourceFile: string): string | null {
  if (gitDateCache.has(sourceFile)) return gitDateCache.get(sourceFile)!;
  let out: string | null = null;
  try {
    const r = execFileSync('git', ['log', '-1', '--format=%cs', '--', sourceFile], {
      encoding: 'utf-8', stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    out = /^\d{4}-\d{2}-\d{2}$/.test(r) ? r : null;
  } catch {
    out = null;
  }
  gitDateCache.set(sourceFile, out);
  return out;
}

/** 데이터 확인일과 페이지 변경일 중 **나중 것**. 둘 다 그 페이지를 바꾸는 요인이다. */
function modifiedOf(sourceFile: string, dataDate: string): Date {
  const page = routeModified(sourceFile);
  return new Date(page && page > dataDate ? page : dataDate);
}

export default function sitemap(): MetadataRoute.Sitemap {
  // 데이터 확인일은 하한이다. 페이지가 그보다 나중에 바뀌었으면 그쪽이 맞다.
  const dataDate = latestVerifiedAt();

  /** src를 안 주면 데이터 확인일을 쓴다(내용이 요율에서만 나오는 페이지) */
  const at = (url: string, priority: number, src?: string): MetadataRoute.Sitemap[number] => ({
    url,
    lastModified: src ? modifiedOf(src, dataDate) : new Date(dataDate),
    changeFrequency: 'monthly',
    priority,
  });

  const S = 'app/(site)';

  return [
    at(BASE, 1, `${S}/page.tsx`),
    at(`${BASE}/changes`, 0.8, `${S}/changes/page.tsx`),
    at(`${BASE}/about`, 0.5, `${S}/about/page.tsx`),
    // 정정 이력은 신뢰 신호라 색인되는 편이 낫다 — 숨길 내용이면 애초에 안 적는다
    at(`${BASE}/corrections`, 0.5, `${S}/corrections/page.tsx`),
    // 임베드 안내는 사람이 찾아와 코드를 가져가는 페이지다. 개별 /embed/{계산기}는
    // noindex라 넣지 않는다 — 원본 계산기 페이지와 내용이 겹친다.
    at(`${BASE}/embed`, 0.5, `${S}/embed/page.tsx`),
    // 고지 페이지는 검색 유입을 노리는 페이지가 아니지만, 색인되어야 사이트가 정상적으로
    // 운영된다는 신호가 된다(애드센스 심사도 이 페이지들을 확인한다).
    at(`${BASE}/terms`, 0.3, `${S}/terms/page.tsx`),
    at(`${BASE}/privacy`, 0.3, `${S}/privacy/page.tsx`),
    ...CATEGORIES.map(c => at(`${BASE}/c/${c.slug}`, 0.9, `${S}/c/[slug]/page.tsx`)),
    ...allCalcHrefs().map(h => at(`${BASE}${h}`, 0.9, `${S}${h}/page.tsx`)),
    // 목록 페이지 — 상세 페이지로 가는 크롤링 경로다. 상세보다 우선순위를 높게 준다.
    ...GENERATED.map(g => at(`${BASE}${g.base}`, 0.7, `${S}${g.base}/page.tsx`)),
    ...GENERATED.flatMap(g => g.values.map(v => at(`${BASE}${g.base}/${v}`, 0.6, g.src))),
    // 배기량 × 차령 조합. 차령 경감 때문에 조합마다 세액이 달라 각각 다른 답을 준다.
    ...carAgePairs().map(({ cc, age }) =>
      at(`${BASE}/car-tax/${cc}/${age}`, 0.5, `${S}/car-tax/[cc]/[age]/page.tsx`)),
    // 연봉 비교. 개별 페이지와 다른 질문("올리면 얼마나 더 남나")에 답한다.
    ...salaryComparePairs().map(({ from, to }) =>
      at(`${BASE}/salary/compare/${from}-${to}`, 0.5, `${S}/salary/compare/[pair]/page.tsx`)),
    // 부양가족 조합. 인적공제 때문에 사람 수마다 실수령액이 실제로 달라진다.
    ...familyPairs().map(({ man, family }) =>
      at(`${BASE}/salary/${man}/family-${family}`, 0.4, `${S}/salary/[man]/[family]/page.tsx`)),
  ]
    // 카탈로그와 GENERATED에 같은 URL이 들어가는 경우가 있다(예: /salary는 목록 페이지이면서
    // 카탈로그 항목이기도 하다). 사이트맵에 같은 loc이 두 번 나오면 안 된다.
    .filter((e, i, all) => all.findIndex(x => x.url === e.url) === i);
}
