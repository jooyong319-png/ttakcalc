import { CATEGORIES } from './catalog';
import { getRates, latestYear } from './rates';
import { SITE } from './site';

/**
 * 구조화 데이터(JSON-LD) 조립기.
 *
 * 왜 필요한가 — 우리가 화면에 써 둔 사실을 기계가 읽을 수 있는 형태로 한 번 더 말해 주는 것이다.
 * "이 페이지는 계산 도구다", "이 사이트를 운영하는 주체가 있다", "이 표는 데이터셋이다",
 * "이 값을 마지막으로 대조한 날은 언제다" — 전부 이미 화면에 있는 내용이라 새로 지어내는 게 없다.
 *
 * ## 원칙: 화면에 없는 것은 마크업하지 않는다
 *
 * 구조화 데이터로 순위를 조작하려는 시도(화면에 없는 평점, 가짜 리뷰, 없는 저자)는
 * 스팸 정책 위반이고 수동 조치 대상이다. 여기서 만드는 것은 전부 페이지에 실제로 있는
 * 정보의 기계 판독 사본이다. 화면 표기와 어긋나면 그건 버그다.
 *
 * ## breadcrumb의 마지막 항목에 URL을 넣지 않는 이유
 *
 * 스키마상 마지막(현재 페이지) 항목은 `item`을 생략할 수 있다. 생략하면 이 컴포넌트들이
 * 자기 URL을 알 필요가 없어져서, 33개 계산기 페이지에 href를 일일이 넘기지 않아도 된다.
 * 넘기게 하면 언젠가 누군가 라우트를 옮기고 prop을 안 고쳐서 틀린 URL이 남는다.
 * 알 필요가 없는 정보는 애초에 받지 않는 편이 안전하다.
 */

/** JSON-LD를 `<script>`에 넣을 때 `</script>` 조기 종료를 막는다 */
export const ldJson = (data: unknown) => JSON.stringify(data).replace(/</g, '\\u003c');

/** 데이터에 남은 가장 최근 대조 날짜. 페이지의 dateModified로 쓴다. */
export function latestVerifiedAt(): string {
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
  return seen.sort().pop() ?? SITE.effectiveDate;
}

/** 카테고리 이름 → 허브 경로. 화면의 눈썹줄 링크와 breadcrumb이 같은 곳을 가리키게 한다. */
export function categoryHrefByName(name: string): string {
  const hit = CATEGORIES.find(c => c.name === name);
  return hit ? `/c/${hit.slug}` : '/';
}

export interface Crumb {
  name: string;
  /** 마지막(현재 페이지) 항목은 생략한다 */
  href?: string;
}

/** 홈은 항상 첫 칸이므로 호출부에서 넣지 않는다 */
export function breadcrumbLd(trail: Crumb[]) {
  const all: Crumb[] = [{ name: '홈', href: '/' }, ...trail];
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: all.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.name,
      ...(c.href ? { item: `${SITE.url}${c.href}` } : {}),
    })),
  };
}

/** 사이트 운영 주체. YMYL에서 "누가 만들었나"는 중요한 신호다. */
export function organizationLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE.name,
    url: SITE.url,
    logo: `${SITE.url}/icon.png`,
    email: SITE.email,
    description:
      '연봉 실수령액·세금·부동산 계산기. 모든 계산의 요율과 근거 조문을 함께 표시하고, '
      + '공식 고시 원문을 대조해 관리합니다.',
  };
}

export function websiteLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE.name,
    url: SITE.url,
    inLanguage: 'ko-KR',
    publisher: { '@type': 'Organization', name: SITE.name, url: SITE.url },
  };
}

/**
 * 계산기 한 대. 브라우저에서 바로 돌아가는 무료 도구라는 사실을 명시한다.
 * price 0은 실제로 무료이고 로그인·결제가 없기 때문에 적는 것이다.
 */
export function webApplicationLd({
  name, description, dateModified,
}: { name: string; description: string; dateModified: string }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name,
    description,
    applicationCategory: 'FinanceApplication',
    operatingSystem: 'Web',
    browserRequirements: '자바스크립트를 켠 최신 브라우저',
    inLanguage: 'ko-KR',
    isAccessibleForFree: true,
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'KRW' },
    provider: { '@type': 'Organization', name: SITE.name, url: SITE.url },
    dateModified,
  };
}

/** 값별 페이지의 목록 표 — 실제로 데이터셋이라 그렇게 말해 준다. */
export function datasetLd({
  name, description, dateModified, rowCount,
}: { name: string; description: string; dateModified: string; rowCount: number }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    name,
    description,
    inLanguage: 'ko-KR',
    isAccessibleForFree: true,
    license: `${SITE.url}/terms`,
    creator: { '@type': 'Organization', name: SITE.name, url: SITE.url },
    dateModified,
    variableMeasured: `${rowCount}개 구간`,
  };
}
