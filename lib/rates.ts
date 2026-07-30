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
export interface FeeTier { upTo: number | null; rate: number; maxFee: number | null }

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
  freelancer: {
    name: string; incomeTaxRate: number; localTaxRate: number; note: string; source: string;
  };
  unemployment: {
    name: string; wageReplacementRate: number; dailyMax: number;
    lowerBoundRateOfMinimumWage: number; dailyWorkHours: number; note: string;
    durationDays: {
      tiers: { underYears: number | null; under50: number; from50: number }[];
    };
    source: string;
  };
  severance: {
    name: string; daysPerYear: number; minimumMonths: number; weeklyHoursMin: number;
    note: string; source: string;
  };
  holidayPay: {
    name: string; weeklyHoursMin: number; standardWeeklyHours: number;
    standardHolidayHours: number; note: string; source: string;
  };
  acquisitionTax: {
    name: string; note: string;
    house: {
      'under6억': { rate: number; localEduRate: number };
      'from6to9억': { note: string; localEduRateOfAcquisition: number };
      'over9억': { rate: number; localEduRate: number };
    };
    multiHouse: { twoInRegulated: number; threeOrMore: number; note: string };
    ruralTax: { rate: number; areaThresholdSqm: number; note: string };
    source: string;
  };
  brokerageFee: {
    name: string; note: string;
    sale: FeeTier[]; lease: FeeTier[];
    vatRate: number; source: string;
  };
}

const YEARS = (ratesJson as unknown as { years: Record<string, YearRates> }).years;

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
