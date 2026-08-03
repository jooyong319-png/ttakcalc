// "연봉 4000만원 실수령액" 같은 검색을 받는 정적 페이지의 정의.
//
// 페이지를 손으로 쓰지 않고 계산 함수로 생성한다 — 요율이 바뀌면 81개 페이지가 한꺼번에 갱신된다.
// 이게 성립하는 이유는 각 페이지가 실제로 서로 다른 계산 결과(공제 8줄 + 연도별 비교)를 담기 때문이다.
// 숫자만 바뀌는 껍데기를 수천 개 찍어내면 그건 그냥 스팸이라, 범위는 실제로 검색되는 구간으로 끊는다.
import { makeRange, manToWon } from './format';
import { getRates, availableYears, latestYear } from './rates';
import { calcSalary, type SalaryResult } from './calc/salary';

/** 만원 단위. 연봉 2,000만 ~ 1억, 100만원 간격 = 81개. */
export const SALARY = makeRange(2000, 10_000, 100);

/** 월 실수령액(만원). 150만~700만, 10만원 간격 = 56개. 역산 페이지가 쓴다. */
export const NET = makeRange(150, 700, 10);

/** 근속연수 1~30년 — 연차 페이지 */
export const LEAVE_YEARS = makeRange(1, 30, 1);

/** 증여 금액(만원). 1,000만~10억, 1,000만원 간격 = 100개. */
export const GIFT = makeRange(1_000, 100_000, 1_000);

/** 연간 배당금(만원). 500만~2억, 500만원 간격 = 40개.
 *  2천만원(=2,000만) 경계를 반드시 포함하도록 간격을 잡았다 — 그 지점이 이 계산의 전부다. */
export const DIVIDEND = makeRange(500, 20_000, 500);

/** 목록·본문에 쓰는 "많이 찾는 연봉" — 500만원 간격의 라운드 넘버 */
export function popularMan(): number[] {
  return SALARY.all().filter(m => m % 500 === 0);
}

/** 이 페이지들이 쓰는 고정 가정. 화면에 반드시 그대로 표시한다 — 안 밝히면 틀린 숫자가 된다. */
export const ASSUMPTION = {
  dependents: 1,
  childrenUnder20: 0,
} as const;

/** 비과세액은 연도별 식대 한도를 그대로 쓴다(가장 흔한 경우). */
export function nonTaxableFor(year: string): number {
  return getRates(year).nonTaxable.mealAllowanceMonthlyMax;
}

export function resultFor(man: number, year: string): SalaryResult {
  return calcSalary({
    annualSalary: manToWon(man),
    year,
    dependents: ASSUMPTION.dependents,
    childrenUnder20: ASSUMPTION.childrenUnder20,
    monthlyNonTaxable: nonTaxableFor(year),
  });
}

export interface YearRow {
  year: string;
  label: string;
  monthlyNet: number;
  /** 직전 연도 대비 증감(원). 가장 오래된 연도는 null. */
  delta: number | null;
}

/** 이 사이트만 줄 수 있는 표 — 같은 연봉의 실수령액이 해마다 어떻게 달라졌는지. */
export function byYear(man: number): YearRow[] {
  const years = availableYears().slice().reverse(); // 시간순
  return years
    .map((y, i) => {
      const net = resultFor(man, y).monthlyNet;
      const prev = i > 0 ? resultFor(man, years[i - 1]).monthlyNet : null;
      return {
        year: y,
        label: getRates(y).label,
        monthlyNet: net,
        delta: prev === null ? null : net - prev,
      };
    })
    .reverse(); // 최신이 위
}

export const DEFAULT_YEAR = latestYear();
