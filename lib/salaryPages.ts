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

/**
 * 연봉이 몰려 있는 구간만 50만원 단위로 더 쪼갠다.
 *
 * 전 구간을 50만원으로 쪼개면 161장이 되는데, 그중 상당수는 **아무도 검색하지 않으면서
 * 내용은 옆 페이지와 거의 같은** 페이지가 된다. 그게 정확히 도어웨이 페이지의 정의라
 * 사이트 전체가 평가절하될 수 있다.
 *
 * 그래서 실제 급여가 몰려 있는 구간(2,500~5,000만원)에만 중간값을 넣는다. 이 구간은
 * "연봉 3350 실수령액"처럼 자기 연봉을 그대로 치는 사람이 실제로 있는 대역이고,
 * 소득세 구간 경계(과세표준 1,400만·5,000만)도 이 안에 있어 페이지마다 할 말이 다르다.
 *
 * 여기 추가된 값도 반드시 고유 문장을 갖는지는 test/insights.test.ts가 지킨다.
 */
export const SALARY_FINE = { from: 2500, to: 5000, step: 50 } as const;

/** 페이지가 존재하는 모든 연봉 값(정렬). 100만원 단위 + 밀집 구간의 50만원 지점. */
export function allSalaryValues(): number[] {
  const fine: number[] = [];
  for (let m = SALARY_FINE.from + SALARY_FINE.step; m < SALARY_FINE.to; m += 100) fine.push(m);
  return [...SALARY.all(), ...fine].sort((a, b) => a - b);
}

export function parseSalaryMan(param: string): number | null {
  const n = Number(param);
  return Number.isInteger(n) && allSalaryValues().includes(n) ? n : null;
}

/** 실제로 페이지가 있는 값 중에서 이웃을 찾는다 — 없는 페이지를 가리키지 않기 위해. */
export function salaryNeighbors(man: number): { prev: number | null; next: number | null } {
  const all = allSalaryValues();
  const i = all.indexOf(man);
  if (i < 0) return { prev: null, next: null };
  return { prev: i > 0 ? all[i - 1] : null, next: i < all.length - 1 ? all[i + 1] : null };
}

/** 월 실수령액(만원). 150만~700만, 10만원 간격 = 56개. 역산 페이지가 쓴다. */
export const NET = makeRange(150, 700, 10);

/** 근속연수 1~30년 — 연차 페이지 */
export const LEAVE_YEARS = makeRange(1, 30, 1);

/** 증여 금액(만원). 1,000만~10억, 1,000만원 간격 = 100개. */
export const GIFT = makeRange(1_000, 100_000, 1_000);

/** 상속재산(만원). 1억~30억, 1억 간격 = 30개.
 *  공제가 5억~10억에 몰려 있어 그 구간을 반드시 지나도록 잡았다 — 세금이 0에서 생기는 지점이다. */
export const INHERIT = makeRange(10_000, 300_000, 10_000);

/** 연간 배당금(만원). 500만~2억, 500만원 간격 = 40개.
 *  2천만원(=2,000만) 경계를 반드시 포함하도록 간격을 잡았다 — 그 지점이 이 계산의 전부다. */
export const DIVIDEND = makeRange(500, 20_000, 500);

/**
 * 연봉 비교 페이지가 다룰 쌍.
 *
 * "연봉 4000 vs 4500 실수령 차이"는 연봉 협상·이직 때 실제로 치는 검색어다. 그리고
 * 이 페이지는 값 하나짜리 페이지가 못 하는 답을 준다 — **올린 만큼 손에 남지 않는다는
 * 사실과 그 비율**이다. 두 페이지를 오가며 뺄셈하게 만드는 대신 한 화면에서 끝낸다.
 *
 * 라운드 넘버끼리만 잇는다. "3,100 vs 3,200"은 아무도 검색하지 않고, 그런 쌍까지
 * 만들면 80장이 800장이 되면서 도어웨이로 가는 지름길이 된다.
 */
export function salaryComparePairs(): { from: number; to: number }[] {
  const rounds = popularMan();
  return [
    // 바로 옆 칸 (500만원 차이) — "한 단계 올리면 얼마 더 받나"
    ...rounds.slice(0, -1).map((from, i) => ({ from, to: rounds[i + 1] })),
    // 한 칸 건너 (1,000만원 차이) — 이직·연봉협상에서 더 흔한 폭이다
    ...rounds.slice(0, -2).map((from, i) => ({ from, to: rounds[i + 2] })),
  ];
}

export function parseComparePair(param: string): { from: number; to: number } | null {
  const m = param.match(/^(\d+)-(\d+)$/);
  if (!m) return null;
  const from = Number(m[1]);
  const to = Number(m[2]);
  // 정의된 쌍만 받는다. 임의 조합을 열어 두면 얇은 페이지가 무한히 생긴다.
  return salaryComparePairs().some(p => p.from === from && p.to === to) ? { from, to } : null;
}

/** 목록·본문에 쓰는 "많이 찾는 연봉" — 500만원 간격의 라운드 넘버 */
export function popularMan(): number[] {
  return SALARY.all().filter(m => m % 500 === 0);
}

/**
 * 부양가족 조합 페이지.
 *
 * 기본 페이지는 "본인 1인"으로 계산하는데, 실제로 그 조건인 사람은 많지 않다. 부양가족이
 * 늘면 인적공제(1인당 150만원)만큼 과세표준이 내려가 **실수령액이 실제로 달라진다.**
 * 답이 다르므로 페이지를 나눌 근거가 있다.
 *
 * 다만 검색 수요는 값 하나짜리 페이지보다 훨씬 얕다. "연봉 3200 부양가족 2명"까지 치는
 * 사람은 드물다. 그래서 **라운드 넘버 연봉에만** 붙인다 — 전 구간에 펼치면 324장이
 * 되는데, 그 대부분은 아무도 찾지 않는 페이지가 된다.
 */
export const FAMILY_SIZES = [2, 3, 4] as const;

export function familyPairs(): { man: number; family: number }[] {
  return popularMan().flatMap(man => FAMILY_SIZES.map(family => ({ man, family })));
}

export function parseFamily(param: string): number | null {
  const m = param.match(/^family-(\d+)$/);
  if (!m) return null;
  const n = Number(m[1]);
  return (FAMILY_SIZES as readonly number[]).includes(n) ? n : null;
}

/** 이 조합에 페이지가 있는가 — 없는 곳으로 링크하지 않기 위해 */
export function hasFamilyPage(man: number): boolean {
  return popularMan().includes(man);
}

/**
 * 부양가족 n명일 때의 결과.
 *
 * 20세 이하 자녀 수는 **모른다.** 부양가족 3명이 배우자+자녀 1명일 수도, 부모 2명일
 * 수도 있고 자녀세액공제가 달라진다. 모르는 값을 그럴듯하게 가정하지 않고 0으로 두되,
 * 화면에 그 사실을 그대로 밝힌다.
 */
export function resultForFamily(man: number, family: number, year: string): SalaryResult {
  return calcSalary({
    annualSalary: manToWon(man),
    year,
    dependents: family,
    childrenUnder20: 0,
    monthlyNonTaxable: nonTaxableFor(year),
  });
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
