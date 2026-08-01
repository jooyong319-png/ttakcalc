// 부동산 프로그래매틱 페이지의 범위·가정.
//
// 취득세와 중개보수를 고른 이유: 둘 다 금액에 대해 **강하게 비선형**이라 페이지마다 결론이 다르다.
//  · 취득세 — 6억/9억 누진 구간, 다주택 중과, 85㎡ 농특세
//  · 중개보수 — 구간별 상한요율 + 한도액(적용되면 금액이 올라도 보수가 그대로)
// 반대로 퇴직금은 급여에 정비례해서 페이지를 나눠도 같은 얘기만 반복된다 — 그래서 만들지 않았다.
import { makeRange } from './format';
import { latestYear } from './rates';

/** 만원 단위. 1억 ~ 20억, 5,000만원 간격 = 39개. 취득세 6억·9억, 중개보수 5천만·2억·9억·12억·15억
 *  경계를 모두 지나도록 잡았다. */
export const PRICE = makeRange(10_000, 200_000, 5_000);

/** 본문·목록에 쓰는 대표 금액 — 1억 단위 */
export function popularPrice(): number[] {
  return PRICE.all().filter(m => m % 10_000 === 0);
}

/** 취득세 고정 가정 — 화면에 그대로 표시한다 */
export const ACQ_ASSUMPTION = {
  houseCount: 1 as const,
  regulated: false,
  areaSqm: 84,          // 전용 84㎡ — 국민주택 규모(85㎡) 이하라 농어촌특별세 비과세
} as const;

/** 취득세 조건별 비교 - 이 표가 페이지의 존재 이유(가격은 같은데 조건에 따라 세금이 몇 배로 갈린다).
 *  다주택 중과 시 지방교육세(0.4%)와 농어촌특별세(0.6%/1.0%)는 2026-07-31에 조문으로 확인해
 *  rates.json에 넣었다. 경위는 wiki/rates-log.md. */
export const ACQ_CASES = [
  { key: 'std', label: '1주택 · 전용 85㎡ 이하', houseCount: 1 as const, regulated: false, areaSqm: 84 },
  { key: 'big', label: '1주택 · 전용 85㎡ 초과', houseCount: 1 as const, regulated: false, areaSqm: 110 },
  { key: 'two', label: '조정대상지역 2주택 · 85㎡ 초과', houseCount: 2 as const, regulated: true, areaSqm: 110 },
  { key: 'three', label: '3주택 이상 · 85㎡ 초과', houseCount: 3 as const, regulated: false, areaSqm: 110 },
];

export const DEFAULT_YEAR = latestYear();
