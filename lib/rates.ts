// 연도별 제도 데이터 로더 — 계산 로직은 반드시 이걸 통해 요율을 얻는다(코드에 숫자 하드코딩 금지).
// 제도가 바뀌면 data/rates.json에 새 연도를 추가하는 것만으로 계산기 전체가 갱신된다.
import ratesJson from '@/data/rates.json';

export interface InsuranceRates {
  nationalPension: {
    name: string; employeeRate: number; note: string;
    monthlyIncomeMin: number; monthlyIncomeMax: number; source: string;
  };
  healthInsurance: { name: string; employeeRate: number; note: string; source: string };
  longTermCare: { name: string; rateOfHealthInsurance: number; note: string; source: string };
  employmentInsurance: { name: string; employeeRate: number; note: string; source: string };
}

export interface TaxBracket { upTo: number | null; rate: number; deduction: number }

export interface YearRates {
  label: string;
  verifiedAt: string;
  insurance: InsuranceRates;
  incomeTax: {
    name: string; method: string; note: string;
    localTaxRateOfIncomeTax: number;
    brackets: TaxBracket[];
    source: string;
  };
  nonTaxable: { mealAllowanceMonthlyMax: number; note: string; source: string };
  minimumWage: { hourly: number; note: string; source: string };
}

const YEARS = (ratesJson as { years: Record<string, YearRates> }).years;

/** 데이터가 있는 연도 목록(내림차순). 계산기 UI의 연도 선택에 쓴다. */
export function availableYears(): string[] {
  return Object.keys(YEARS).sort((a, b) => Number(b) - Number(a));
}

/** 가장 최신 연도 — 기본 선택값. */
export function latestYear(): string {
  return availableYears()[0];
}

/** 해당 연도 제도 데이터. 없는 연도를 요청하면 명시적으로 실패시킨다(조용히 틀린 계산 금지). */
export function getRates(year: string): YearRates {
  const r = YEARS[year];
  if (!r) throw new Error(`요율 데이터가 없는 연도입니다: ${year}`);
  return r;
}
