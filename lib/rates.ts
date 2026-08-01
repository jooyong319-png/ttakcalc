// 연도별 제도 데이터 로더 — 계산 로직은 반드시 이걸 통해 요율을 얻는다(코드에 숫자 하드코딩 금지).
// 제도가 바뀌면 data/rates.json에 새 연도를 추가하는 것만으로 계산기 전체가 갱신된다.
import ratesJson from '../data/rates.json';  // 상대경로 — 번들러 없이 tsc로 컴파일해 테스트할 수 있게

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
export interface CcTier { upToCc: number | null; perCc: number }
/** 재산세식 구간 — "기본세액 + (과세표준 − 구간시작)×세율" 형태(누진공제와 다르다) */
export interface PropertyTaxBracket { upTo: number | null; base: number; over: number; rate: number }

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
      'under6억': { rate: number; localEduRate: number; localEduBasis: string };
      'from6to9억': { note: string; localEduRateOfAcquisition: number };
      'over9억': { rate: number; localEduRate: number };
    };
    /** 중과세율이 걸리면 지방교육세·농어촌특별세도 표준세율과 다른 산식을 쓴다(조문 근거는 basis 필드) */
    multiHouse: {
      twoInRegulated: number; threeOrMore: number; note: string;
      localEduRate: number; localEduBasis: string;
      ruralTaxRateTwo: number; ruralTaxRateThree: number; ruralTaxBasis: string;
    };
    ruralTax: { rate: number; areaThresholdSqm: number; note: string };
    source: string;
  };
  brokerageFee: {
    name: string; note: string;
    sale: FeeTier[]; lease: FeeTier[];
    vatRate: number; source: string;
  };
  carTax: {
    name: string; note: string;
    private: CcTier[]; business: CcTier[];
    localEduRateOfCarTax: number;
    ageReduction: { startYear: number; perYearRate: number; maxYear: number; note: string };
    prepayment: { rate: number; note: string; source: string };
    source: string;
  };
  propertyTax: {
    name: string; note: string;
    fairMarketRatio: {
      standard: number;
      oneHouse: { upTo: number | null; rate: number }[];
      note: string;
    };
    brackets: PropertyTaxBracket[];
    oneHouseBrackets: PropertyTaxBracket[];
    oneHouseMaxValue: number; oneHouseNote: string;
    urbanAreaRate: number; urbanAreaNote: string;
    localEduRateOfPropertyTax: number;
    source: string;
  };
  /** 계산·단위 카테고리 — 본체 계산기로 이어지는 진입로들이 쓰는 상수 */
  basic: {
    name: string;
    vat: { rate: number; note: string; source: string };
    interestIncomeTax: {
      incomeTaxRate: number; localTaxRateOfIncomeTax: number; note: string; source: string;
    };
    pyeong: { sqmPerPyeong: number; note: string; source: string };
    source: string;
  };
  employer: {
    name: string; note: string;
    employmentStability: { label: string; rate: number }[];
    employmentStabilitySource: string;
    industrialAccidentNote: string;
    industrialAccidentSource: string;
    source: string;
  };
  /** 제도가 특정 연도부터 생긴 항목은 선택적으로 둔다.
   *  없는 연도를 계산하려 하면 조용히 넘어가지 않고 명시적으로 실패시킨다(제1원칙). */
  parentalLeave?: {
    name: string; note: string;
    tiers: { untilMonth: number | null; rate: number; max: number; min: number; label: string }[];
    maxMonths: number;
    source: string;
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
