// 소득세 계열 — 종합소득세 / 연말정산 환급금 / 육아휴직급여.
//
// 이 세 개는 "이미 낸 돈"과 "실제로 낼 돈"의 차이를 보여주는 계산이다. 그래서 결과를 하나의
// 숫자로 던지지 않고 **기납부세액 → 결정세액 → 차액**의 순서를 그대로 노출한다.
//
// 정확도 원칙: 개인별 공제(의료비·교육비·기부금·신용카드, 업종별 경비율)는 우리가 알 수 없다.
// 그래서 추정하지 않고 **입력받는다.** 모르는 값을 그럴듯하게 채워 넣는 게 가장 위험하다.
import { getRates, type YearRates } from '../rates';
import type { Step } from './labor';

const won = (n: number) => Math.floor(n / 10) * 10;
const fmt = (n: number) => Math.round(n).toLocaleString('ko-KR');

/** 과세표준 → 산출세액. 누진공제 방식(소득세법 제55조). */
export function progressiveTax(taxBase: number, rates: YearRates): number {
  if (taxBase <= 0) return 0;
  for (const b of rates.incomeTax.brackets) {
    if (b.upTo === null || taxBase <= b.upTo) return Math.max(0, taxBase * b.rate - b.deduction);
  }
  return 0;
}

/** 적용된 구간을 사람이 읽는 문자열로 — "왜 이 세금인지"를 보여주기 위해 */
export function bracketLabel(taxBase: number, rates: YearRates): string {
  for (const b of rates.incomeTax.brackets) {
    if (b.upTo === null || taxBase <= b.upTo) {
      const range = b.upTo === null ? '10억원 초과' : `${fmt(b.upTo)}원 이하`;
      return `${range} 구간 · 세율 ${(b.rate * 100).toFixed(0)}% · 누진공제 ${fmt(b.deduction)}원`;
    }
  }
  return '';
}

// ─────────────────────────────────────────────────────────────
// 종합소득세 (프리랜서·사업소득 중심)
// ─────────────────────────────────────────────────────────────
export interface ComprehensiveTaxInput {
  year: string;
  /** 연간 총수입금액(세전, 3.3% 떼기 전 금액의 합) */
  revenue: number;
  /** 필요경비율(%) — 업종별 단순경비율은 국세청 고시라 사이트가 추정하지 않는다. 사용자가 넣는다. */
  expenseRatePercent: number;
  /** 부양가족 수(본인 포함) */
  dependents: number;
  /** 그 밖의 소득공제 합계(국민연금 보험료 등) */
  otherDeduction: number;
  /** 이미 원천징수된 세액(3.3% 중 소득세분). 지방소득세는 따로 정산된다. */
  withheldTax: number;
}

export interface ComprehensiveTaxResult {
  revenue: number;
  expense: number;
  income: number;
  taxBase: number;
  calculatedTax: number;
  /** 결정세액(소득세) */
  finalTax: number;
  localTax: number;
  totalTax: number;
  withheldTax: number;
  /** 양수면 추가 납부, 음수면 환급 */
  balance: number;
  refund: boolean;
  steps: Step[];
  verifiedAt: string;
}

const PERSONAL_DEDUCTION_PER_HEAD = 1_500_000;   // 기본공제 1인 150만원(소득세법 제50조)

export function calcComprehensiveTax(i: ComprehensiveTaxInput): ComprehensiveTaxResult {
  const rates = getRates(i.year);
  const revenue = Math.max(0, i.revenue);

  // 경비율은 소수 한 자리까지 쓴다(예: 64.1%). 퍼센트를 그냥 100으로 나누면 부동소수점 때문에
  // 4천만 × 64.1% 가 25,639,999.99…가 돼 1원이 어긋난다. 천분율 정수로 바꿔서 곱한다.
  const permille = Math.round(Math.min(100, Math.max(0, i.expenseRatePercent)) * 10);
  const expense = Math.floor((revenue * permille) / 1000);
  const income = Math.max(0, revenue - expense);

  const personal = Math.max(1, i.dependents) * PERSONAL_DEDUCTION_PER_HEAD;
  const other = Math.max(0, i.otherDeduction);
  const taxBase = Math.max(0, income - personal - other);

  const calculatedTax = progressiveTax(taxBase, rates);
  // 사업소득자는 근로소득세액공제를 받지 못한다. 표준세액공제 7만원(소득세법 제59조의4 제9항).
  const standardCredit = taxBase > 0 ? 70_000 : 0;
  const finalTax = won(Math.max(0, calculatedTax - standardCredit));
  const localTax = won(finalTax * rates.incomeTax.localTaxRateOfIncomeTax);
  const totalTax = finalTax + localTax;

  const withheld = Math.max(0, i.withheldTax);
  const balance = finalTax - withheld;

  return {
    revenue, expense, income, taxBase, calculatedTax, finalTax, localTax, totalTax,
    withheldTax: withheld, balance, refund: balance < 0,
    verifiedAt: rates.verifiedAt,
    steps: [
      { label: '총수입금액', value: revenue, basis: '3.3% 떼기 전 계약금액의 합' },
      { label: '필요경비', value: expense, basis: `수입금액 × ${i.expenseRatePercent}% (업종별 경비율은 홈택스에서 확인)`, tone: 'minus' },
      { label: '소득금액', value: income, basis: '총수입금액 − 필요경비' },
      { label: '인적공제', value: personal, basis: `기본공제 ${Math.max(1, i.dependents)}명 × 150만원`, tone: 'minus' },
      ...(other > 0 ? [{ label: '그 밖의 소득공제', value: other, basis: '국민연금 보험료 등', tone: 'minus' as const }] : []),
      { label: '과세표준', value: taxBase, basis: bracketLabel(taxBase, rates) },
      { label: '산출세액', value: Math.round(calculatedTax), basis: '과세표준 × 세율 − 누진공제' },
      { label: '표준세액공제', value: standardCredit, basis: '소득세법 제59조의4 제9항(사업소득자 7만원)', tone: 'minus' },
      { label: '결정세액(소득세)', value: finalTax, basis: '산출세액 − 세액공제' },
      { label: '지방소득세', value: localTax, basis: `소득세의 ${rates.incomeTax.localTaxRateOfIncomeTax * 100}%` },
      { label: '기납부세액', value: withheld, basis: '원천징수된 소득세(3.3% 중 3%분)', tone: 'minus' },
      { label: balance < 0 ? '환급 예상액' : '추가 납부액', value: Math.abs(balance),
        basis: balance < 0 ? '결정세액보다 많이 냈다' : '결정세액에 못 미친다' },
    ],
  };
}

// ─────────────────────────────────────────────────────────────
// 연말정산 환급금
// ─────────────────────────────────────────────────────────────
export interface YearEndInput {
  year: string;
  /** 총급여(비과세 제외) */
  grossSalary: number;
  dependents: number;
  childrenUnder20: number;
  /** 1년간 납부한 4대보험료 합계(근로자 부담분) — 전액 소득공제 */
  insurancePaid: number;
  /** 이미 원천징수된 소득세 합계(간이세액표 기준) */
  withheldTax: number;
  /** 특별소득공제·특별세액공제 합계. 0이면 표준세액공제 13만원을 적용한다. */
  specialDeduction: number;
}

export interface YearEndResult {
  earnedIncomeDeduction: number;
  taxBase: number;
  calculatedTax: number;
  credits: number;
  finalTax: number;
  localTax: number;
  withheldTax: number;
  /** 음수면 환급 */
  balance: number;
  refund: boolean;
  usedStandardCredit: boolean;
  steps: Step[];
  verifiedAt: string;
}

/** 근로소득공제 — 소득세법 제47조. 총급여 구간별 누진. */
export function earnedIncomeDeduction(gross: number): number {
  if (gross <= 5_000_000) return gross * 0.7;
  if (gross <= 15_000_000) return 3_500_000 + (gross - 5_000_000) * 0.4;
  if (gross <= 45_000_000) return 7_500_000 + (gross - 15_000_000) * 0.15;
  if (gross <= 100_000_000) return 12_000_000 + (gross - 45_000_000) * 0.05;
  return 14_750_000 + (gross - 100_000_000) * 0.02;
}

/** 근로소득 세액공제 — 산출세액 구간별 공제율 + 총급여별 한도. */
export function earnedIncomeTaxCredit(calculatedTax: number, gross: number): number {
  const credit = calculatedTax <= 1_300_000
    ? calculatedTax * 0.55
    : 715_000 + (calculatedTax - 1_300_000) * 0.30;
  const limit = gross <= 33_000_000
    ? 740_000
    : gross <= 70_000_000
      ? Math.max(660_000, 740_000 - (gross - 33_000_000) * 0.008)
      : Math.max(500_000, 660_000 - (gross - 70_000_000) * 0.5 / 100);
  return Math.min(credit, limit);
}

/** 자녀 세액공제 — 8세 이상 자녀 기준. */
export function childTaxCredit(children: number): number {
  if (children <= 0) return 0;
  if (children === 1) return 250_000;
  if (children === 2) return 550_000;
  return 550_000 + (children - 2) * 400_000;
}

export const STANDARD_TAX_CREDIT = 130_000;

export function calcYearEnd(i: YearEndInput): YearEndResult {
  const rates = getRates(i.year);
  const gross = Math.max(0, i.grossSalary);

  const eid = Math.floor(earnedIncomeDeduction(gross));
  const personal = Math.max(1, i.dependents) * PERSONAL_DEDUCTION_PER_HEAD;
  const insurance = Math.max(0, i.insurancePaid);
  const special = Math.max(0, i.specialDeduction);

  const taxBase = Math.max(0, gross - eid - personal - insurance - special);
  const calculatedTax = progressiveTax(taxBase, rates);

  // 특별공제를 신청하지 않으면 표준세액공제 13만원을 대신 받는다(소득세법 제59조의4)
  const usedStandardCredit = special === 0;
  const credits = earnedIncomeTaxCredit(calculatedTax, gross)
    + childTaxCredit(i.childrenUnder20)
    + (usedStandardCredit ? STANDARD_TAX_CREDIT : 0);

  const finalTax = won(Math.max(0, calculatedTax - credits));
  const localTax = won(finalTax * rates.incomeTax.localTaxRateOfIncomeTax);
  const withheld = Math.max(0, i.withheldTax);
  const balance = finalTax - withheld;

  return {
    earnedIncomeDeduction: eid, taxBase, calculatedTax: Math.round(calculatedTax),
    credits: Math.round(credits), finalTax, localTax,
    withheldTax: withheld, balance, refund: balance < 0, usedStandardCredit,
    verifiedAt: rates.verifiedAt,
    steps: [
      { label: '총급여', value: gross, basis: '비과세 제외' },
      { label: '근로소득공제', value: eid, basis: '소득세법 제47조 구간별 누진', tone: 'minus' },
      { label: '인적공제', value: personal, basis: `기본공제 ${Math.max(1, i.dependents)}명 × 150만원`, tone: 'minus' },
      { label: '4대보험료 공제', value: insurance, basis: '근로자 부담분 전액', tone: 'minus' },
      ...(special > 0 ? [{ label: '특별소득공제 등', value: special, basis: '의료비·교육비·기부금 등 직접 입력', tone: 'minus' as const }] : []),
      { label: '과세표준', value: taxBase, basis: bracketLabel(taxBase, rates) },
      { label: '산출세액', value: Math.round(calculatedTax), basis: '과세표준 × 세율 − 누진공제' },
      { label: '세액공제', value: Math.round(credits),
        basis: usedStandardCredit
          ? '근로소득세액공제 + 자녀세액공제 + 표준세액공제 13만원'
          : '근로소득세액공제 + 자녀세액공제', tone: 'minus' },
      { label: '결정세액', value: finalTax, basis: '올해 실제로 낼 소득세' },
      { label: '기납부세액', value: withheld, basis: '매달 원천징수된 소득세 합계(간이세액표 기준)', tone: 'minus' },
      { label: balance < 0 ? '환급 예상액' : '추가 납부액', value: Math.abs(balance),
        basis: balance < 0 ? '많이 뗀 만큼 돌려받는다' : '덜 뗀 만큼 더 낸다' },
    ],
  };
}

// ─────────────────────────────────────────────────────────────
// 육아휴직급여
// ─────────────────────────────────────────────────────────────
export interface ParentalLeaveResult {
  months: { month: number; label: string; rate: number; raw: number; benefit: number; capped: 'max' | 'min' | null }[];
  total: number;
  monthlyAverage: number;
  steps: Step[];
  verifiedAt: string;
  note: string;
}

export function calcParentalLeave(
  monthlyOrdinaryWage: number, months: number, year: string,
): ParentalLeaveResult {
  const r = getRates(year);
  const pl = r.parentalLeave;
  // 제도가 없는 연도를 조용히 0으로 계산하지 않는다 — 명시적으로 실패시킨다
  if (!pl) throw new Error(`육아휴직급여 데이터가 없는 연도입니다: ${year}`);

  const wage = Math.max(0, monthlyOrdinaryWage);
  const n = Math.min(pl.maxMonths, Math.max(1, Math.round(months)));

  const rows = Array.from({ length: n }, (_, idx) => {
    const month = idx + 1;
    const tier = pl.tiers.find(t => t.untilMonth === null || month <= t.untilMonth) ?? pl.tiers[pl.tiers.length - 1];
    const raw = Math.floor(wage * tier.rate);
    let benefit = raw;
    let capped: 'max' | 'min' | null = null;
    if (raw > tier.max) { benefit = tier.max; capped = 'max'; }
    else if (raw < tier.min) { benefit = tier.min; capped = 'min'; }
    return { month, label: tier.label, rate: tier.rate, raw, benefit, capped };
  });

  const total = rows.reduce((a, m) => a + m.benefit, 0);

  return {
    months: rows, total,
    monthlyAverage: Math.round(total / n),
    verifiedAt: r.verifiedAt,
    note: pl.note,
    steps: [
      { label: '월 통상임금', value: wage, basis: '육아휴직 시작일 기준' },
      ...pl.tiers.map(t => {
        const inTier = rows.filter(m => m.label === t.label);
        return {
          label: t.label,
          value: inTier.reduce((a, m) => a + m.benefit, 0),
          basis: inTier.length === 0
            ? '해당 기간 없음'
            : `통상임금의 ${t.rate * 100}% · 월 ${fmt(inTier[0].benefit)}원 × ${inTier.length}개월`
              + (inTier[0].capped === 'max' ? ` (상한 ${fmt(t.max)}원 적용)`
                : inTier[0].capped === 'min' ? ` (하한 ${fmt(t.min)}원 적용)` : ''),
        };
      }),
      { label: `${n}개월 총액`, value: total, basis: `월 평균 ${fmt(Math.round(total / n))}원` },
    ],
  };
}
