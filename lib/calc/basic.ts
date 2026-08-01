// 계산·단위 — 평↔㎡ / 부가가치세 / 퍼센트 / 복리.
//
// 순수 수학 계산기(공학용·삼각함수)는 만들지 않는다. 포털이 검색 결과에서 직접 답을 주기 때문에
// 클릭이 오지 않고, 우리가 "근거"라고 보여줄 것도 없다.
// 여기 있는 넷은 다르다 — 전부 **본체 계산기로 이어지는 진입로**이고, 근거로 댈 법령이 있다.
//   · 평↔㎡  → 취득세·재산세 (85㎡ 경계가 세금을 가른다)
//   · 부가세  → 사업주·중개수수료
//   · 퍼센트  → 연봉 인상률
//   · 복리    → 이자소득세 15.4%
import { getRates } from '../rates';
import type { Step } from './labor';

const fmt = (n: number) => Math.round(n).toLocaleString('ko-KR');
const round2 = (n: number) => Math.round(n * 100) / 100;

// ─────────────────────────────────────────────────────────────
// 평 ↔ ㎡
// ─────────────────────────────────────────────────────────────
export interface AreaResult {
  sqm: number;
  pyeong: number;
  /** 85㎡(국민주택 규모) 초과 여부 — 취득세 농어촌특별세가 여기서 갈린다 */
  overNationalHousingSize: boolean;
  steps: Step[];
  note: string;
  source: string;
}

export function calcArea(value: number, from: 'sqm' | 'pyeong', year: string): AreaResult {
  const p = getRates(year).basic.pyeong;
  const v = Math.max(0, value);

  const sqm = from === 'sqm' ? v : v * p.sqmPerPyeong;
  const pyeong = from === 'sqm' ? v / p.sqmPerPyeong : v;

  return {
    sqm: round2(sqm),
    pyeong: round2(pyeong),
    overNationalHousingSize: sqm > 85,
    note: p.note,
    source: p.source,
    steps: from === 'sqm'
      ? [
          { label: '입력', value: `${round2(v)}㎡`, basis: '전용면적' },
          { label: '평', value: `${round2(pyeong)}평`, basis: `${round2(v)} ÷ 3.3058`, tone: 'result' },
        ]
      : [
          { label: '입력', value: `${round2(v)}평`, basis: '관습 단위' },
          { label: '제곱미터', value: `${round2(sqm)}㎡`, basis: `${round2(v)} × 3.3058`, tone: 'result' },
        ],
  };
}

// ─────────────────────────────────────────────────────────────
// 부가가치세
// ─────────────────────────────────────────────────────────────
export interface VatResult {
  supply: number;
  vat: number;
  total: number;
  steps: Step[];
  source: string;
}

/** mode: 'supply' = 입력이 공급가액(세전) / 'total' = 입력이 합계금액(세포함) */
export function calcVat(amount: number, mode: 'supply' | 'total', year: string): VatResult {
  const v = getRates(year).basic.vat;
  const a = Math.max(0, amount);

  const supply = mode === 'supply' ? a : Math.round(a / (1 + v.rate));
  const vat = mode === 'supply' ? Math.round(a * v.rate) : a - supply;
  const total = supply + vat;

  return {
    supply, vat, total,
    source: v.source,
    steps: mode === 'supply'
      ? [
          { label: '공급가액', value: supply, basis: '세전 금액' },
          { label: '부가가치세', value: vat, basis: `공급가액 × ${v.rate * 100}%` },
          { label: '합계금액', value: total, basis: '세금계산서에 찍히는 금액', tone: 'result' },
        ]
      : [
          { label: '합계금액', value: total, basis: '세포함 금액' },
          { label: '공급가액', value: supply, basis: `합계 ÷ 1.${v.rate * 10} (되짚기)` },
          { label: '부가가치세', value: vat, basis: '합계 − 공급가액', tone: 'result' },
        ],
  };
}

// ─────────────────────────────────────────────────────────────
// 퍼센트
// ─────────────────────────────────────────────────────────────
export type PercentMode = 'of' | 'change' | 'ratio';

export interface PercentResult {
  answer: number;
  label: string;
  steps: Step[];
}

/**
 * of     — A의 B%는? (예: 300만원의 15%)
 * change — A에서 B로 얼마나 변했나? (증감률)
 * ratio  — A는 B의 몇 %인가?
 */
export function calcPercent(a: number, b: number, mode: PercentMode): PercentResult {
  if (mode === 'of') {
    const answer = (a * b) / 100;
    return {
      answer: round2(answer), label: `${fmt(a)}의 ${b}%`,
      steps: [
        { label: '기준값', value: a },
        { label: '비율', value: `${b}%` },
        { label: '결과', value: round2(answer), basis: `${fmt(a)} × ${b} ÷ 100`, tone: 'result' },
      ],
    };
  }
  if (mode === 'change') {
    // 기준이 0이면 증감률은 정의되지 않는다 — 0으로 나눠 Infinity를 내놓지 않는다
    const answer = a === 0 ? 0 : ((b - a) / a) * 100;
    const up = b >= a;
    return {
      answer: round2(answer), label: `${fmt(a)} → ${fmt(b)}`,
      steps: [
        { label: '이전', value: a },
        { label: '이후', value: b },
        { label: '차이', value: round2(b - a), basis: up ? '증가' : '감소', tone: up ? undefined : 'minus' },
        {
          label: '증감률',
          value: a === 0 ? '계산 불가' : `${round2(answer)}%`,
          basis: a === 0 ? '기준값이 0이면 증감률을 정의할 수 없다' : `(${fmt(b)} − ${fmt(a)}) ÷ ${fmt(a)} × 100`,
          tone: 'result',
        },
      ],
    };
  }
  const answer = b === 0 ? 0 : (a / b) * 100;
  return {
    answer: round2(answer), label: `${fmt(a)} / ${fmt(b)}`,
    steps: [
      { label: '부분', value: a },
      { label: '전체', value: b },
      {
        label: '비율',
        value: b === 0 ? '계산 불가' : `${round2(answer)}%`,
        basis: b === 0 ? '전체가 0이면 비율을 정의할 수 없다' : `${fmt(a)} ÷ ${fmt(b)} × 100`,
        tone: 'result',
      },
    ],
  };
}

// ─────────────────────────────────────────────────────────────
// 복리 (예·적금)
// ─────────────────────────────────────────────────────────────
export interface CompoundInput {
  year: string;
  principal: number;
  annualRatePercent: number;
  months: number;
  /** 'simple' = 단리(만기일시), 'monthly' = 월복리 */
  method: 'simple' | 'monthly';
  /** 이자소득세 15.4% 적용 여부. 비과세종합저축 등은 끈다. */
  taxed: boolean;
}

export interface CompoundResult {
  interest: number;
  tax: number;
  netInterest: number;
  total: number;
  /** 세후 실효 연수익률 */
  effectiveAnnualRate: number;
  steps: Step[];
  source: string;
}

export function calcCompound(i: CompoundInput): CompoundResult {
  const t = getRates(i.year).basic.interestIncomeTax;
  const P = Math.max(0, i.principal);
  const n = Math.max(1, Math.round(i.months));
  const annual = Math.max(0, i.annualRatePercent) / 100;

  const gross = i.method === 'monthly'
    ? P * (Math.pow(1 + annual / 12, n) - 1)
    : P * annual * (n / 12);

  const interest = Math.floor(gross);
  // 이자소득세 = 소득세 14% + 지방소득세(소득세의 10%)
  const incomeTax = i.taxed ? Math.floor(interest * t.incomeTaxRate) : 0;
  const localTax = i.taxed ? Math.floor(incomeTax * t.localTaxRateOfIncomeTax) : 0;
  const tax = incomeTax + localTax;
  const netInterest = interest - tax;
  const total = P + netInterest;

  const totalTaxRate = t.incomeTaxRate * (1 + t.localTaxRateOfIncomeTax);

  return {
    interest, tax, netInterest, total,
    effectiveAnnualRate: P > 0 && n > 0 ? (netInterest / P) * (12 / n) : 0,
    source: t.source,
    steps: [
      { label: '원금', value: P, basis: `연 ${i.annualRatePercent}% · ${n}개월 · ${i.method === 'monthly' ? '월복리' : '단리'}` },
      { label: '세전 이자', value: interest,
        basis: i.method === 'monthly'
          ? `P × ((1 + 연이율÷12)^${n} − 1)`
          : `P × 연이율 × ${n}÷12` },
      { label: '이자소득세', value: incomeTax,
        basis: i.taxed ? `세전 이자 × ${t.incomeTaxRate * 100}%` : '비과세', tone: 'minus' },
      { label: '지방소득세', value: localTax,
        basis: i.taxed ? `소득세 × ${t.localTaxRateOfIncomeTax * 100}%` : '비과세', tone: 'minus' },
      { label: '세후 이자', value: netInterest,
        basis: i.taxed ? `총 ${(totalTaxRate * 100).toFixed(1)}% 과세` : '세금 없음', tone: 'total' },
      { label: '만기 수령액', value: total, basis: '원금 + 세후 이자', tone: 'result' },
    ],
  };
}
