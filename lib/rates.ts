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
/** 한계세율 구간 — 구간마다 그 구간에 걸친 금액에만 세율을 곱해 더한다(종부세 방식) */
export interface MarginalBracket { upTo: number | null; rate: number }

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
  annualLeave: {
    name: string;
    baseDays: number; under1YearMonthlyDay: number; under1YearMaxDays: number;
    bonusStartYear: number; bonusEveryYears: number; maxDays: number;
    attendanceRate: number; monthlyStandardHours: number; dailyStandardHours: number;
    note: string; source: string;
  };
  giftTax: {
    name: string;
    deductions: { key: string; label: string; amount: number }[];
    deductionNote: string;
    brackets: TaxBracket[];
    filingCreditRate: number; filingCreditNote: string;
    note: string; source: string;
  };
  carAcquisitionTax: {
    name: string;
    rates: { key: string; label: string; rate: number }[];
    lightCarExemptionMax: number; lightCarNote: string;
    note: string; source: string;
  };
  rentConversion: {
    name: string;
    /** 상한 ① 연 10% */
    ceilingRate: number;
    /** 상한 ② 기준금리 + 이 값 */
    baseRateSpread: number;
    bokBaseRate: number; bokBaseRateAsOf: string;
    note: string; note2: string; source: string;
  };
  comprehensivePropertyTax: {
    name: string;
    deductionOneHouse: number; deductionOther: number;
    fairMarketRatio: number;
    /** 한계세율 구간 — 누진공제 없이 구간별로 쪼개 더한다(누진공제는 구간에서 유도되는 값이라 따로 두지 않는다) */
    brackets: { under3: MarginalBracket[]; from3: MarginalBracket[] };
    ruralTaxRate: number;
    note: string; note2: string; source: string;
  };
  transferTax: {
    name: string;
    basicDeduction: number; oneHouseExemptLimit: number;
    longTermGeneral: {
      startYear: number; perYearRate: number; baseRate: number; maxRate: number; note: string;
    };
    longTermOneHouse: {
      holdPerYearRate: number; holdMaxRate: number;
      livePerYearRate: number; liveMaxRate: number;
      minHoldYears: number; minLiveYears: number; note: string;
    };
    shortTermRates: { underYears: number; rate: number; label: string }[];
    heavySurcharge: { twoHouse: number; threeOrMore: number; note: string };
    localTaxRateOfIncomeTax: number;
    note: string; note2: string; source: string;
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
  /** 상속세. 세율·신고세액공제는 giftTax의 것을 함께 쓴다(제26조·제69조가 같은 표를 가리킨다). */
  inheritanceTax?: {
    name: string;
    /** 기초공제(제18조) */
    basicDeduction: number;
    /** 일괄공제(제21조) — 기초+인적 합계와 비교해 큰 쪽을 쓴다 */
    lumpSumDeduction: number;
    childDeduction: number;
    minorPerYear: number;
    minorUntilAge: number;
    elderlyDeduction: number;
    elderlyFromAge: number;
    /** 배우자공제 최소액(제19조 ④) */
    spouseMin: number;
    /** 배우자공제 상한(제19조 ①2) */
    spouseMax: number;
    /** 배우자 법정상속분 가산율 — 직계비속의 1.5배(민법 제1009조 ②) */
    spouseShareBonus: number;
    financial: { smallThreshold: number; rate: number; floor: number; cap: number };
    note: string;
    source: string;
    verifiedAt: string;
  };
  /** 국민연금 노령연금. A값은 매년 바뀌므로 연도별로 둔다. */
  pension?: {
    name: string;
    /** 전체 가입자 3년 평균소득월액의 평균(A값) */
    aValue: number;
    aValueNote: string;
    /** 기본연금액 계수 — 제51조 ① 1천분의 1290 */
    multiplier: number;
    /** 20년 초과 1년당 가산율 — 제51조 ① 단서 */
    over20BonusPerYear: number;
    /** 노령연금 최소 가입기간(년) */
    minYears: number;
    /** 10~20년 구간의 기본 지급률과 1년당 가산 — 제63조 ①2 */
    under20BaseRate: number;
    under20PerYear: number;
    /** 조기수령 지급률 — 제63조 ② */
    earlyRates: { yearsEarly: number; rate: number }[];
    /** 연기 1개월당 가산 — 제62조 ② */
    deferPerMonth: number;
    deferMaxMonths: number;
    dependentSpouseAnnual: number;
    dependentChildAnnual: number;
    note: string;
    source: string;
    verifiedAt: string;
  };
  /** 연장·야간·휴일 가산수당 — 근로기준법 제56조 */
  overtime?: {
    name: string;
    overtimeRate: number; nightRate: number;
    holidayWithin8Rate: number; holidayOver8Rate: number;
    holidayBaseHours: number;
    nightFromHour: number; nightToHour: number;
    /** 이 인원 미만이면 제56조가 적용되지 않는다(제11조 ①) */
    minEmployees: number;
    note: string; source: string; verifiedAt: string;
  };
  /** 배당소득. Gross-up률은 개정 이력이 있어(2023·2024년 개정) 원문으로 확인한 2026년만 넣었다. */
  dividend?: {
    /** 배당소득 원천징수세율(소득세법 제129조①2나) */
    withholdingRate: number;
    /** 이 금액을 넘으면 초과분이 종합과세된다(제14조③6) */
    comprehensiveThreshold: number;
    /** 내국법인 배당 귀속법인세 가산율(제17조③ 단서) */
    grossUpRate: number;
    note: string;
    source: string;
    verifiedAt: string;
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
