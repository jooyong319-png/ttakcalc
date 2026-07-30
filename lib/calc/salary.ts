// 연봉 실수령액 계산 — 순수 함수(입력→출력만, 부수효과 없음). 요율은 전부 lib/rates에서 온다.
//
// 정확성 원칙: 실제 매월 원천징수는 국세청 "근로소득 간이세액표"를 따르는데, 그 표는 소득·부양가족
// 조합별 고정값 목록이라 여기서는 연말정산과 같은 방식(근로소득공제 → 과세표준 → 산출세액 →
// 근로소득세액공제)으로 연간 세액을 구해 12로 나눈 근사치를 쓴다. 간이세액표와 몇 천 원 차이가
// 날 수 있고, 어차피 연말정산으로 정산되는 금액이다 — 이 사실을 화면에도 반드시 표기한다.
import { getRates, type YearRates } from '../rates';

export interface SalaryInput {
  /** 연봉(원). 세전, 비과세 포함 금액. */
  annualSalary: number;
  /** 적용 연도(예: '2026'). */
  year: string;
  /** 부양가족 수(본인 포함). 최소 1. */
  dependents: number;
  /** 20세 이하 자녀 수(세액공제용). */
  childrenUnder20: number;
  /** 월 비과세액(식대 등). 한도를 넘으면 한도로 자른다. */
  monthlyNonTaxable: number;
}

export interface Deduction {
  key: string;
  name: string;
  amount: number;
  /** 이 금액이 어떻게 나왔는지 사람이 읽는 근거 — 화면에 그대로 노출한다. */
  basis: string;
}

export interface SalaryResult {
  year: string;
  /** 계산에 쓴 제도 데이터의 최종 확인일. */
  verifiedAt: string;
  monthlyGross: number;
  monthlyNonTaxable: number;
  /** 과세 대상 월 급여(비과세 제외). 4대보험·소득세의 기준. */
  monthlyTaxable: number;
  deductions: Deduction[];
  totalDeduction: number;
  monthlyNet: number;
  annualNet: number;
  /** 세전 대비 공제 비율(0~1). */
  deductionRate: number;
}

const won = (n: number) => Math.floor(n / 10) * 10; // 원 단위 절사(급여 실무 관행)

/** 근로소득공제 — 소득세법 제47조. 총급여 구간별 누진 공제. */
function earnedIncomeDeduction(grossAnnual: number): number {
  if (grossAnnual <= 5_000_000) return grossAnnual * 0.7;
  if (grossAnnual <= 15_000_000) return 3_500_000 + (grossAnnual - 5_000_000) * 0.4;
  if (grossAnnual <= 45_000_000) return 7_500_000 + (grossAnnual - 15_000_000) * 0.15;
  if (grossAnnual <= 100_000_000) return 12_000_000 + (grossAnnual - 45_000_000) * 0.05;
  return 14_750_000 + (grossAnnual - 100_000_000) * 0.02;
}

/** 과세표준에 세율 적용 — 누진공제 방식. */
function progressiveTax(taxBase: number, rates: YearRates): number {
  if (taxBase <= 0) return 0;
  for (const b of rates.incomeTax.brackets) {
    if (b.upTo === null || taxBase <= b.upTo) return taxBase * b.rate - b.deduction;
  }
  return 0;
}

/** 근로소득 세액공제 — 산출세액 구간별 공제율에 총급여별 한도. */
function earnedIncomeTaxCredit(calculatedTax: number, grossAnnual: number): number {
  const credit = calculatedTax <= 1_300_000
    ? calculatedTax * 0.55
    : 715_000 + (calculatedTax - 1_300_000) * 0.30;

  const limit = grossAnnual <= 33_000_000
    ? 740_000
    : grossAnnual <= 70_000_000
      ? Math.max(660_000, 740_000 - (grossAnnual - 33_000_000) * 0.008)
      : Math.max(500_000, 660_000 - (grossAnnual - 70_000_000) * 0.5 / 100);

  return Math.min(credit, limit);
}

/** 자녀 세액공제 — 8세 이상 자녀 기준(1명 25만, 2명 55만, 3명부터 1명당 40만 추가). */
function childTaxCredit(children: number): number {
  if (children <= 0) return 0;
  if (children === 1) return 250_000;
  if (children === 2) return 550_000;
  return 550_000 + (children - 2) * 400_000;
}

export function calcSalary(input: SalaryInput): SalaryResult {
  const rates = getRates(input.year);
  const ins = rates.insurance;

  const monthlyGross = Math.max(0, Math.round(input.annualSalary / 12));
  const nonTaxable = Math.min(
    Math.max(0, input.monthlyNonTaxable),
    rates.nonTaxable.mealAllowanceMonthlyMax,
  );
  const monthlyTaxable = Math.max(0, monthlyGross - nonTaxable);

  // ── 4대보험 (과세 대상 급여 기준) ──
  const pensionBase = Math.min(
    Math.max(monthlyTaxable, ins.nationalPension.monthlyIncomeMin),
    ins.nationalPension.monthlyIncomeMax,
  );
  const pension = won(pensionBase * ins.nationalPension.employeeRate);
  const health = won(monthlyTaxable * ins.healthInsurance.employeeRate);
  const care = won(health * ins.longTermCare.rateOfHealthInsurance);
  const employment = won(monthlyTaxable * ins.employmentInsurance.employeeRate);

  // ── 소득세 (연간 기준으로 구해 12분할) ──
  const grossAnnualTaxable = monthlyTaxable * 12;
  const afterEarnedDeduction = Math.max(0, grossAnnualTaxable - earnedIncomeDeduction(grossAnnualTaxable));
  const personalDeduction = Math.max(1, input.dependents) * 1_500_000;
  const insuranceDeduction = (pension + health + care + employment) * 12;
  const taxBase = Math.max(0, afterEarnedDeduction - personalDeduction - insuranceDeduction);

  const calculatedTax = Math.max(0, progressiveTax(taxBase, rates));
  const credits = earnedIncomeTaxCredit(calculatedTax, grossAnnualTaxable) + childTaxCredit(input.childrenUnder20);
  const annualIncomeTax = Math.max(0, calculatedTax - credits);

  const incomeTax = won(annualIncomeTax / 12);
  const localTax = won(incomeTax * rates.incomeTax.localTaxRateOfIncomeTax);

  const deductions: Deduction[] = [
    { key: 'nationalPension', name: ins.nationalPension.name, amount: pension,
      basis: `과세 급여 ${pensionBase.toLocaleString()}원 × ${(ins.nationalPension.employeeRate * 100).toFixed(3)}%` },
    { key: 'healthInsurance', name: ins.healthInsurance.name, amount: health,
      basis: `과세 급여 ${monthlyTaxable.toLocaleString()}원 × ${(ins.healthInsurance.employeeRate * 100).toFixed(3)}%` },
    { key: 'longTermCare', name: ins.longTermCare.name, amount: care,
      basis: `건강보험료 ${health.toLocaleString()}원 × ${(ins.longTermCare.rateOfHealthInsurance * 100).toFixed(2)}%` },
    { key: 'employmentInsurance', name: ins.employmentInsurance.name, amount: employment,
      basis: `과세 급여 ${monthlyTaxable.toLocaleString()}원 × ${(ins.employmentInsurance.employeeRate * 100).toFixed(1)}%` },
    { key: 'incomeTax', name: '소득세', amount: incomeTax,
      basis: `연 결정세액 ${Math.round(annualIncomeTax).toLocaleString()}원 ÷ 12 (근로소득공제·인적공제·세액공제 반영)` },
    { key: 'localTax', name: '지방소득세', amount: localTax,
      basis: `소득세 ${incomeTax.toLocaleString()}원 × ${rates.incomeTax.localTaxRateOfIncomeTax * 100}%` },
  ];

  const totalDeduction = deductions.reduce((s, d) => s + d.amount, 0);
  const monthlyNet = monthlyGross - totalDeduction;

  return {
    year: input.year,
    verifiedAt: rates.verifiedAt,
    monthlyGross,
    monthlyNonTaxable: nonTaxable,
    monthlyTaxable,
    deductions,
    totalDeduction,
    monthlyNet,
    annualNet: monthlyNet * 12,
    deductionRate: monthlyGross > 0 ? totalDeduction / monthlyGross : 0,
  };
}
