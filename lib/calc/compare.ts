// 형태가 다른 계산 — 역산 / 사업주 부담 / 비교.
//
// 기존 계산 함수를 새로 만들지 않고 "뒤집거나 나란히 놓는" 것만으로 다른 질문에 답한다.
// 사람들은 "연봉 5천만원 실수령액"만큼이나 "월 300 받으려면 연봉 얼마"를 궁금해한다.
import { getRates } from '../rates';
import { calcSalary, type SalaryResult } from './salary';
import { calcFreelancer } from './labor';
import type { Step } from './labor';

const won = (n: number) => Math.floor(n / 10) * 10;
const fmt = (n: number) => Math.round(n).toLocaleString('ko-KR');

// ─────────────────────────────────────────────────────────────
// 역산 — 월 실수령액에서 연봉 되짚기
// ─────────────────────────────────────────────────────────────
export interface ReverseSalaryInput {
  year: string;
  /** 목표 월 실수령액 */
  targetNet: number;
  dependents: number;
  childrenUnder20: number;
  monthlyNonTaxable: number;
}

export interface ReverseSalaryResult {
  annualSalary: number;
  /** 그 연봉으로 실제 계산했을 때의 결과 — 오차를 숨기지 않고 같이 보여준다 */
  actual: SalaryResult;
  /** 목표와 실제의 차이(원). 연봉을 만원 단위로 반올림하므로 0이 아닐 수 있다. */
  gap: number;
  steps: Step[];
  verifiedAt: string;
}

/**
 * 실수령액은 연봉에 대해 단조증가라서 이분 탐색으로 안전하게 뒤집을 수 있다.
 * (누진세라 닫힌 역함수가 없다. 구간마다 식이 달라 대수적으로 풀면 구간 판정이 지저분해진다.)
 * 연봉은 만원 단위로 맞춘다 — 실제 연봉 협상 단위가 그렇고, 원 단위로 주면 정밀해 보이지만 무의미하다.
 */
export function calcReverseSalary(i: ReverseSalaryInput): ReverseSalaryResult {
  const rates = getRates(i.year);
  const target = Math.max(0, i.targetNet);
  const at = (annual: number) =>
    calcSalary({
      annualSalary: annual,
      year: i.year,
      dependents: i.dependents,
      childrenUnder20: i.childrenUnder20,
      monthlyNonTaxable: i.monthlyNonTaxable,
    });

  const STEP = 10_000;                 // 만원 단위
  let lo = 0;
  let hi = 1_000_000_000;              // 연봉 10억 — 실수령 상한을 넉넉히 덮는다
  // 40회면 10억 범위가 1원 미만으로 좁혀진다(2^40 ≫ 1e9)
  for (let n = 0; n < 40 && hi - lo > STEP; n++) {
    const mid = Math.floor((lo + hi) / 2);
    if (at(mid).monthlyNet < target) lo = mid; else hi = mid;
  }
  // 만원 단위로 올림 — 목표에 "모자라지 않는" 쪽을 고른다
  const annualSalary = Math.ceil(hi / STEP) * STEP;
  const actual = at(annualSalary);
  const gap = actual.monthlyNet - target;

  return {
    annualSalary, actual, gap,
    verifiedAt: rates.verifiedAt,
    steps: [
      { label: '목표 월 실수령액', value: target, basis: '입력값' },
      { label: '필요 연봉 (세전)', value: annualSalary, basis: '만원 단위로 올림', tone: 'result' },
      { label: '월 급여 (세전)', value: actual.monthlyGross, basis: `연봉 ${fmt(annualSalary)}원 ÷ 12` },
      { label: '공제 합계', value: actual.totalDeduction, basis: `공제율 ${(actual.deductionRate * 100).toFixed(1)}%`, tone: 'minus' },
      { label: '실제 월 실수령액', value: actual.monthlyNet,
        basis: gap === 0 ? '목표와 일치' : `목표보다 ${fmt(Math.abs(gap))}원 ${gap > 0 ? '많음' : '적음'}(만원 단위 반올림)` },
    ],
  };
}

// ─────────────────────────────────────────────────────────────
// 4대보험 사업주 부담 — 직원 1명의 실제 인건비
// ─────────────────────────────────────────────────────────────
export interface EmployerCostInput {
  year: string;
  /** 월 급여(세전, 비과세 포함) */
  monthlySalary: number;
  monthlyNonTaxable: number;
  /** 고용안정·직업능력개발사업 요율 구간 인덱스 */
  stabilityTierIndex: number;
  /** 산재보험료율(%) — 업종별 고시라 입력받는다 */
  accidentRatePercent: number;
}

export interface EmployerCostResult {
  taxableBase: number;
  items: { key: string; name: string; amount: number; basis: string }[];
  insuranceTotal: number;
  /** 급여 + 사업주 부담 보험료 */
  totalCost: number;
  /** 급여 대비 추가 부담률 */
  overheadRate: number;
  /** 근로자가 실제로 받는 실수령액 — 같은 화면에서 대조하면 격차가 보인다 */
  employeeNet: number;
  steps: Step[];
  verifiedAt: string;
  note: string;
}

export function calcEmployerCost(i: EmployerCostInput): EmployerCostResult {
  const r = getRates(i.year);
  const ins = r.insurance;
  const emp = r.employer;

  const gross = Math.max(0, i.monthlySalary);
  const nonTaxable = Math.min(Math.max(0, i.monthlyNonTaxable), r.nonTaxable.mealAllowanceMonthlyMax);
  const base = Math.max(0, gross - nonTaxable);

  const pensionBase = Math.min(
    Math.max(base, ins.nationalPension.monthlyIncomeMin),
    ins.nationalPension.monthlyIncomeMax,
  );
  const pension = won(pensionBase * ins.nationalPension.employeeRate);
  const health = won(base * ins.healthInsurance.employeeRate);
  const care = won(health * ins.longTermCare.rateOfHealthInsurance);
  const unemployment = won(base * ins.employmentInsurance.employeeRate);

  const tier = emp.employmentStability[
    Math.min(emp.employmentStability.length - 1, Math.max(0, i.stabilityTierIndex))
  ];
  const stability = won(base * tier.rate);
  const accidentRate = Math.max(0, i.accidentRatePercent) / 100;
  const accident = won(base * accidentRate);

  const items = [
    { key: 'nationalPension', name: '국민연금', amount: pension,
      basis: `과세 급여 × ${(ins.nationalPension.employeeRate * 100).toFixed(3)}% (근로자와 같은 요율)` },
    { key: 'healthInsurance', name: '건강보험', amount: health,
      basis: `과세 급여 × ${(ins.healthInsurance.employeeRate * 100).toFixed(3)}% (근로자와 같은 요율)` },
    { key: 'longTermCare', name: '장기요양보험', amount: care,
      basis: `건강보험료 × ${(ins.longTermCare.rateOfHealthInsurance * 100).toFixed(2)}%` },
    { key: 'unemployment', name: '고용보험 (실업급여)', amount: unemployment,
      basis: `과세 급여 × ${(ins.employmentInsurance.employeeRate * 100).toFixed(1)}% (노사 각 절반)` },
    { key: 'stability', name: '고용보험 (고용안정·직업능력개발)', amount: stability,
      basis: `과세 급여 × ${(tier.rate * 100).toFixed(2)}% — ${tier.label}, 사업주 전액 부담` },
    { key: 'accident', name: '산재보험', amount: accident,
      basis: `과세 급여 × ${i.accidentRatePercent}% — 업종별 고시, 사업주 전액 부담` },
  ];

  const insuranceTotal = items.reduce((a, it) => a + it.amount, 0);
  const totalCost = gross + insuranceTotal;

  // 같은 급여로 근로자가 실제로 받는 금액 — 사업주가 쓰는 돈과의 격차를 한 화면에서 보여준다
  const employeeNet = calcSalary({
    annualSalary: gross * 12, year: i.year,
    dependents: 1, childrenUnder20: 0, monthlyNonTaxable: nonTaxable,
  }).monthlyNet;

  return {
    taxableBase: base, items, insuranceTotal, totalCost,
    overheadRate: gross > 0 ? insuranceTotal / gross : 0,
    employeeNet,
    verifiedAt: r.verifiedAt,
    note: emp.note,
    steps: [
      { label: '월 급여 (세전)', value: gross, basis: '계약상 급여' },
      { label: '과세 대상 급여', value: base, basis: `비과세 ${fmt(nonTaxable)}원 제외`, tone: 'info' },
      ...items.map(it => ({ label: it.name, value: it.amount, basis: it.basis })),
      { label: '사업주 부담 합계', value: insuranceTotal,
        basis: `급여의 ${(insuranceTotal / (gross || 1) * 100).toFixed(1)}%`, tone: 'total' },
      { label: '실제 인건비', value: totalCost, basis: '급여 + 사업주 부담 보험료', tone: 'result' },
    ],
  };
}

// ─────────────────────────────────────────────────────────────
// 정규직 vs 프리랜서 3.3% — 같은 계약금액일 때
// ─────────────────────────────────────────────────────────────
export interface EmploymentCompareResult {
  monthlyAmount: number;
  employee: { net: number; deduction: number; deductionRate: number };
  freelancer: { net: number; deduction: number; deductionRate: number };
  /** 프리랜서 실수령 − 정규직 실수령 */
  monthlyDiff: number;
  annualDiff: number;
  steps: Step[];
  verifiedAt: string;
}

/**
 * 계약금액이 같을 때 손에 쥐는 돈만 비교한다.
 * 프리랜서가 당장 더 많이 받는 건 맞지만 4대보험·퇴직금·연차가 없다는 점을 화면에 반드시 적는다 —
 * 숫자만 보고 판단하면 틀린 결론이 나오는 대표적인 경우다.
 */
export function calcEmploymentCompare(
  monthlyAmount: number, year: string, monthlyNonTaxable: number,
): EmploymentCompareResult {
  const rates = getRates(year);
  const amount = Math.max(0, monthlyAmount);

  const salary = calcSalary({
    annualSalary: amount * 12, year,
    dependents: 1, childrenUnder20: 0, monthlyNonTaxable,
  });
  const free = calcFreelancer(amount, year, 'gross');

  const empDeduction = salary.totalDeduction;
  const freeDeduction = free.incomeTax + free.localTax;
  const monthlyDiff = free.net - salary.monthlyNet;

  return {
    monthlyAmount: amount,
    employee: { net: salary.monthlyNet, deduction: empDeduction, deductionRate: salary.deductionRate },
    freelancer: {
      net: free.net, deduction: freeDeduction,
      deductionRate: amount > 0 ? freeDeduction / amount : 0,
    },
    monthlyDiff,
    annualDiff: monthlyDiff * 12,
    verifiedAt: rates.verifiedAt,
    steps: [
      { label: '월 계약금액', value: amount, basis: '두 경우 모두 같은 금액으로 가정' },
      { label: '정규직 공제', value: empDeduction,
        basis: `4대보험 + 소득세 · 공제율 ${(salary.deductionRate * 100).toFixed(1)}%`, tone: 'minus' },
      { label: '정규직 실수령', value: salary.monthlyNet, basis: '4대보험 가입·퇴직금·연차 있음' },
      { label: '프리랜서 공제', value: freeDeduction,
        basis: '원천징수 3.3%(소득세 3% + 지방소득세 0.3%)', tone: 'minus' },
      { label: '프리랜서 실수령', value: free.net, basis: '4대보험·퇴직금·연차 없음' },
      { label: '월 차액', value: Math.abs(monthlyDiff),
        basis: monthlyDiff > 0 ? '프리랜서가 더 많이 받음' : '정규직이 더 많이 받음', tone: 'result' },
    ],
  };
}
