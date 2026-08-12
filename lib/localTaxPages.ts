// 자동차세·재산세 프로그래매틱 페이지의 범위와 가정.
//
// 둘 다 비선형이라 페이지를 나눌 값이 있다.
//  · 자동차세 — 1,000cc / 1,600cc 경계에서 cc당 세액이 80 → 140 → 200원으로 뛴다.
//    게다가 차령 경감(3년째부터 5%씩)이 있어 한 페이지 안에 표가 하나 더 생긴다.
//  · 재산세 — 과세표준 구간(6천만·1.5억·3억)과 1세대 1주택 특례(9억) 경계가 있다.
import { makeRange } from './format';
import { latestYear } from './rates';

/** 배기량(cc). 800~3,000cc, 100cc 간격 = 23개. 실제로 검색되는 범위만. */
export const CC = makeRange(800, 3000, 100);

/** 자주 찾는 배기량 — 국내 승용차 주력 구간 */
export function popularCc(): number[] {
  return [1000, 1300, 1600, 2000, 2500, 3000];
}

/** 주택 공시가격(만원 단위). 1억~15억, 5,000만원 간격 = 29개. */
export const PUBLIC_PRICE = makeRange(10_000, 150_000, 5_000);

export function popularPublicPrice(): number[] {
  return PUBLIC_PRICE.all().filter(m => m % 20_000 === 0);
}

/** 자동차세 페이지의 고정 가정 — 화면에 그대로 표시한다 */
export const CAR_ASSUMPTION = { ageYears: 3, business: false } as const;

/** 차령별 비교표에 쓸 연차 — 경감이 시작·끝나는 지점을 포함한다 */
export const CAR_AGE_ROWS = [1, 3, 5, 7, 10, 12];

/**
 * 연식별 페이지를 만들 조합.
 *
 * "2018년식 2000cc 자동차세"처럼 **배기량과 연식을 함께** 검색하는 사람이 많다.
 * 그리고 이 조합은 실제로 답이 다르다 — 차령 경감(지방세법 제127조 ②)이 3년째부터
 * 매년 5%씩 붙어 12년째에 50%가 되므로, 같은 2000cc라도 연식마다 세액이 갈린다.
 * 답이 같은 조합으로 페이지를 늘리면 그건 도어웨이지만, 여기는 답이 다르다.
 *
 * 전 배기량 23종을 다 펼치면 276장이라 한 번에 깔기엔 많다. **주력 배기량 6종만**
 * 먼저 낸다. 반응을 보고 늘리는 편이, 색인이 밀린 상태에서 크롤 예산을 나눠 먹는
 * 것보다 낫다.
 */
export const CAR_AGE_PAGES = { min: 1, max: 12 } as const;

export function carAgePairs(): { cc: number; age: number }[] {
  const ages = Array.from(
    { length: CAR_AGE_PAGES.max - CAR_AGE_PAGES.min + 1 },
    (_, i) => CAR_AGE_PAGES.min + i,
  );
  return popularCc().flatMap(cc => ages.map(age => ({ cc, age })));
}

/** 차령 → 등록 연도. "3년째"보다 "2023년식"이 검색어에 가깝다. */
export function modelYearOf(age: number, baseYear: string): number {
  return Number(baseYear) - age;
}

/** 이 배기량·차령 조합에 페이지가 있는가. 없는 곳으로 링크하지 않기 위해 쓴다. */
export function hasAgePage(cc: number, age: number): boolean {
  return popularCc().includes(cc)
    && Number.isInteger(age) && age >= CAR_AGE_PAGES.min && age <= CAR_AGE_PAGES.max;
}

export function parseAge(param: string): number | null {
  const n = Number(param);
  return Number.isInteger(n) && n >= CAR_AGE_PAGES.min && n <= CAR_AGE_PAGES.max ? n : null;
}

/** 재산세 페이지의 고정 가정 */
export const PROPERTY_ASSUMPTION = { oneHouse: true, urbanArea: true } as const;

/** 재산세 조건별 비교 — 1주택 여부로 공정시장가액비율과 세율이 둘 다 달라진다 */
export const PROPERTY_CASES = [
  { key: 'one', label: '1세대 1주택', oneHouse: true },
  { key: 'multi', label: '그 밖의 주택', oneHouse: false },
];

export const DEFAULT_YEAR = latestYear();
