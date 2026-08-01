// 연차수당 / 증여세 / 자동차 취득세 / 전월세 전환율 / 종합부동산세 / 양도소득세.
//
// 앞의 넷은 조문이 명확해 그대로 옮기면 되지만, 뒤의 둘(종부세·양도세)은
// **개인별 사정이 결과를 크게 바꾸는 계산**이다. 그래서 우리가 모르는 부분은 계산에서 빼고
// 화면에 "이건 반영하지 않았다"를 명시한다. 어설프게 넣어 그럴듯하게 틀리는 것보다 낫다.
import { getRates, type TaxBracket, type MarginalBracket } from '../rates';
import type { Step } from './labor';

const won = (n: number) => Math.floor(n / 10) * 10;
const fmt = (n: number) => Math.round(n).toLocaleString('ko-KR');
const pctText = (r: number) => `${(r * 100).toFixed(2).replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '')}%`;

/** 누진공제 방식: 과세표준 × 세율 − 누진공제 */
function progressive(base: number, brackets: TaxBracket[]): { tax: number; bracket: TaxBracket } {
  const b = brackets.find(x => x.upTo === null || base <= x.upTo) ?? brackets[brackets.length - 1];
  return { tax: Math.max(0, base * b.rate - b.deduction), bracket: b };
}

/** 한계세율 방식: 구간마다 그 구간에 걸친 금액에만 세율을 곱해 더한다 */
function marginal(base: number, brackets: MarginalBracket[]): { tax: number; topRate: number } {
  let rest = Math.max(0, base);
  let prev = 0;
  let tax = 0;
  let topRate = brackets[0].rate;
  for (const b of brackets) {
    if (rest <= 0) break;
    const cap = b.upTo === null ? Infinity : b.upTo;
    const slice = Math.min(rest, cap - prev);
    tax += slice * b.rate;
    topRate = b.rate;
    rest -= slice;
    prev = cap;
  }
  return { tax, topRate };
}

// ─────────────────────────────────────────────────────────────
// 연차 유급휴가 / 연차수당
// ─────────────────────────────────────────────────────────────
export interface AnnualLeaveResult {
  /** 그 해에 발생하는 연차 일수 */
  days: number;
  bonusDays: number;
  cappedByMax: boolean;
  /** 1일 통상임금 */
  dailyWage: number;
  /** 미사용 연차수당 */
  unusedPay: number;
  steps: Step[];
  note: string;
  source: string;
}

/**
 * @param years 계속근로 연수(1년 미만은 0)
 * @param monthsIfUnder1Year 1년 미만일 때 개근한 개월 수
 */
export function calcAnnualLeave(
  years: number, monthlyWage: number, unusedDays: number, year: string, monthsIfUnder1Year = 0,
): AnnualLeaveResult {
  const r = getRates(year);
  const a = r.annualLeave;
  const n = Math.max(0, Math.floor(years));

  let days: number;
  let bonusDays = 0;
  let cappedByMax = false;

  if (n < 1) {
    // 1개월 개근마다 1일, 최대 11일
    days = Math.min(a.under1YearMaxDays, Math.max(0, Math.floor(monthsIfUnder1Year)) * a.under1YearMonthlyDay);
  } else {
    // 3년 이상부터 "최초 1년을 초과하는 계속근로 매 2년"에 1일씩
    bonusDays = n >= a.bonusStartYear ? Math.floor((n - 1) / a.bonusEveryYears) : 0;
    const raw = a.baseDays + bonusDays;
    days = Math.min(a.maxDays, raw);
    cappedByMax = raw > a.maxDays;
    if (cappedByMax) bonusDays = a.maxDays - a.baseDays;
  }

  // 1일 통상임금 = 월 통상임금 ÷ 209시간 × 8시간
  const hourly = monthlyWage / a.monthlyStandardHours;
  const dailyWage = won(hourly * a.dailyStandardHours);
  const used = Math.min(Math.max(0, unusedDays), days);
  const unusedPay = won(dailyWage * used);

  return {
    days, bonusDays, cappedByMax, dailyWage, unusedPay,
    note: a.note, source: a.source,
    steps: [
      { label: '계속근로', value: n < 1 ? `1년 미만 (${monthsIfUnder1Year}개월 개근)` : `${n}년` },
      { label: '발생 연차', value: `${days}일`,
        basis: n < 1
          ? `1개월 개근당 1일 (최대 ${a.under1YearMaxDays}일)`
          : `기본 ${a.baseDays}일${bonusDays > 0 ? ` + 가산 ${bonusDays}일` : ''}`
            + (cappedByMax ? ` (${a.maxDays}일 한도 적용)` : '') },
      { label: '시간당 통상임금', value: won(hourly),
        basis: `월 통상임금 ÷ ${a.monthlyStandardHours}시간` },
      { label: '1일 통상임금', value: dailyWage, basis: `시간당 × ${a.dailyStandardHours}시간` },
      { label: '미사용 연차', value: `${used}일`,
        basis: used < unusedDays ? `발생 연차 ${days}일을 넘을 수 없다` : '입력값' },
      { label: '연차수당', value: unusedPay, basis: `1일 통상임금 × ${used}일`, tone: 'result' },
    ],
  };
}

// ─────────────────────────────────────────────────────────────
// 증여세
// ─────────────────────────────────────────────────────────────
export interface GiftTaxResult {
  giftAmount: number;
  deduction: number;
  /** 10년 내 이미 쓴 공제 때문에 깎인 금액 */
  deductionUsed: number;
  taxBase: number;
  calculatedTax: number;
  filingCredit: number;
  finalTax: number;
  effectiveRate: number;
  steps: Step[];
  note: string;
  source: string;
}

export function calcGiftTax(
  giftAmount: number, relationKey: string, priorGifts: number, filedInTime: boolean, year: string,
): GiftTaxResult {
  const r = getRates(year);
  const g = r.giftTax;
  const amount = Math.max(0, giftAmount);
  const prior = Math.max(0, priorGifts);

  const rel = g.deductions.find(d => d.key === relationKey) ?? g.deductions[g.deductions.length - 1];
  // 10년 이내에 이미 공제받은 만큼은 한도에서 뺀다
  const deductionUsed = Math.min(prior, rel.amount);
  const deduction = Math.max(0, rel.amount - deductionUsed);

  const taxBase = Math.max(0, amount - deduction);
  const { tax, bracket } = progressive(taxBase, g.brackets);
  const calculatedTax = Math.floor(tax);
  const filingCredit = filedInTime ? Math.floor(calculatedTax * g.filingCreditRate) : 0;
  const finalTax = won(calculatedTax - filingCredit);

  const bandLabel = bracket.upTo === null ? '30억원 초과' : `${fmt(bracket.upTo)}원 이하`;

  return {
    giftAmount: amount, deduction, deductionUsed, taxBase,
    calculatedTax, filingCredit, finalTax,
    effectiveRate: amount > 0 ? finalTax / amount : 0,
    note: g.note, source: g.source,
    steps: [
      { label: '증여재산', value: amount, basis: `${rel.label}에게서 받음` },
      { label: '증여재산공제', value: deduction,
        basis: deductionUsed > 0
          ? `한도 ${fmt(rel.amount)}원 − 10년 내 사용 ${fmt(deductionUsed)}원`
          : `${rel.label} 한도 ${fmt(rel.amount)}원`, tone: 'minus' },
      { label: '과세표준', value: taxBase,
        basis: `${bandLabel} 구간 · 세율 ${pctText(bracket.rate)} · 누진공제 ${fmt(bracket.deduction)}원` },
      { label: '산출세액', value: calculatedTax, basis: '과세표준 × 세율 − 누진공제' },
      { label: '신고세액공제', value: filingCredit,
        basis: filedInTime ? `산출세액 × ${g.filingCreditRate * 100}%` : '기한 내 신고 안 함', tone: 'minus' },
      { label: '납부할 증여세', value: finalTax,
        basis: `실효세율 ${pctText(amount > 0 ? finalTax / amount : 0)}`, tone: 'result' },
    ],
  };
}

// ─────────────────────────────────────────────────────────────
// 자동차 취득세
// ─────────────────────────────────────────────────────────────
export interface CarAcquisitionResult {
  price: number;
  rate: number;
  tax: number;
  steps: Step[];
  note: string;
  source: string;
}

export function calcCarAcquisitionTax(price: number, typeKey: string, year: string): CarAcquisitionResult {
  const r = getRates(year);
  const c = r.carAcquisitionTax;
  const p = Math.max(0, price);
  const t = c.rates.find(x => x.key === typeKey) ?? c.rates[0];
  const tax = won(p * t.rate);

  return {
    price: p, rate: t.rate, tax,
    note: c.note, source: c.source,
    steps: [
      { label: '취득가액', value: p, basis: t.label },
      { label: '취득세율', value: pctText(t.rate), basis: c.source },
      { label: '취득세', value: tax, basis: `${fmt(p)}원 × ${pctText(t.rate)}`, tone: 'result' },
    ],
  };
}

// ─────────────────────────────────────────────────────────────
// 전월세 전환율
// ─────────────────────────────────────────────────────────────
export interface RentConversionResult {
  /** 법정 상한 전환율 */
  legalRate: number;
  /** 둘 중 어느 쪽이 적용됐는지 */
  appliedBy: 'ceiling' | 'base-rate';
  convertedDeposit: number;
  /** 상한을 적용했을 때의 월세 */
  maxMonthlyRent: number;
  remainingDeposit: number;
  steps: Step[];
  note: string;
  note2: string;
  source: string;
}

/**
 * 보증금 일부를 월세로 돌릴 때의 법정 상한 월세.
 * @param deposit 현재 보증금
 * @param convert 월세로 돌릴 금액
 */
export function calcRentConversion(deposit: number, convert: number, year: string): RentConversionResult {
  const r = getRates(year);
  const c = r.rentConversion;
  const d = Math.max(0, deposit);
  const amount = Math.min(Math.max(0, convert), d);

  const byBaseRate = c.bokBaseRate + c.baseRateSpread;
  const legalRate = Math.min(c.ceilingRate, byBaseRate);
  const appliedBy = legalRate === c.ceilingRate && c.ceilingRate < byBaseRate ? 'ceiling' : 'base-rate';

  const maxMonthlyRent = won((amount * legalRate) / 12);

  return {
    legalRate, appliedBy,
    convertedDeposit: amount,
    maxMonthlyRent,
    remainingDeposit: d - amount,
    note: c.note, note2: c.note2, source: c.source,
    steps: [
      { label: '현재 보증금', value: d },
      { label: '월세로 전환할 금액', value: amount, basis: `남는 보증금 ${fmt(d - amount)}원` },
      { label: '상한 ① 연 10%', value: pctText(c.ceilingRate), basis: '시행령 제9조 제1항', tone: 'info' },
      { label: '상한 ② 기준금리 + 2%', value: pctText(byBaseRate),
        basis: `한국은행 기준금리 ${pctText(c.bokBaseRate)} (${c.bokBaseRateAsOf} 기준)`, tone: 'info' },
      { label: '적용 전환율', value: pctText(legalRate), basis: '둘 중 낮은 쪽' },
      { label: '월세 상한', value: maxMonthlyRent,
        basis: `${fmt(amount)}원 × ${pctText(legalRate)} ÷ 12개월`, tone: 'result' },
    ],
  };
}

// ─────────────────────────────────────────────────────────────
// 종합부동산세
// ─────────────────────────────────────────────────────────────
export interface ComprehensivePropertyResult {
  publicPrice: number;
  deduction: number;
  taxBase: number;
  /** 공제금액 이하라 과세 대상이 아님 */
  exempt: boolean;
  tax: number;
  ruralTax: number;
  total: number;
  topRate: number;
  steps: Step[];
  note: string;
  note2: string;
  source: string;
}

export function calcComprehensivePropertyTax(
  publicPrice: number, oneHouse: boolean, threeOrMore: boolean, year: string,
): ComprehensivePropertyResult {
  const r = getRates(year);
  const c = r.comprehensivePropertyTax;
  const p = Math.max(0, publicPrice);

  const deduction = oneHouse ? c.deductionOneHouse : c.deductionOther;
  const overDeduction = Math.max(0, p - deduction);
  const taxBase = Math.floor(overDeduction * c.fairMarketRatio);
  const exempt = overDeduction <= 0;

  const brackets = threeOrMore ? c.brackets.from3 : c.brackets.under3;
  const { tax: raw, topRate } = marginal(taxBase, brackets);
  const tax = won(raw);
  const ruralTax = won(tax * c.ruralTaxRate);

  return {
    publicPrice: p, deduction, taxBase, exempt,
    tax, ruralTax, total: tax + ruralTax, topRate,
    note: c.note, note2: c.note2, source: c.source,
    steps: [
      { label: '공시가격 합계', value: p, basis: '매년 6월 1일 기준 보유 주택' },
      { label: '공제금액', value: deduction,
        basis: oneHouse ? '1세대 1주택' : '그 밖의 경우', tone: 'minus' },
      { label: '공제 후 금액', value: overDeduction,
        basis: exempt ? '공제금액 이하 → 종부세 없음' : undefined },
      { label: '과세표준', value: taxBase,
        basis: `공제 후 금액 × 공정시장가액비율 ${pctText(c.fairMarketRatio)}` },
      { label: '종합부동산세', value: tax,
        basis: exempt ? '과세 대상 아님' : `구간별 누진 (최고 ${pctText(topRate)})` },
      { label: '농어촌특별세', value: ruralTax, basis: `종부세의 ${c.ruralTaxRate * 100}%` },
      { label: '합계', value: tax + ruralTax, tone: 'result' },
    ],
  };
}

// ─────────────────────────────────────────────────────────────
// 양도소득세
// ─────────────────────────────────────────────────────────────
export interface TransferTaxInput {
  year: string;
  salePrice: number;
  buyPrice: number;
  /** 취득세·중개보수·리모델링 등 인정되는 비용 */
  expenses: number;
  holdYears: number;
  liveYears: number;
  oneHouse: boolean;
  /** 조정대상지역 다주택 — 0이면 해당 없음, 2/3은 주택 수 */
  heavyHouseCount: 0 | 2 | 3;
}

export interface TransferTaxResult {
  gain: number;
  /** 1세대 1주택 12억 초과분에만 과세되는 비율 */
  taxableRatio: number;
  taxableGain: number;
  longTermDeduction: number;
  longTermRate: number;
  income: number;
  taxBase: number;
  rate: number;
  rateLabel: string;
  incomeTax: number;
  localTax: number;
  total: number;
  /** 1세대 1주택 12억 이하라 전액 비과세 */
  fullyExempt: boolean;
  steps: Step[];
  note: string;
  note2: string;
  source: string;
}

export function calcTransferTax(i: TransferTaxInput): TransferTaxResult {
  const r = getRates(i.year);
  const t = r.transferTax;

  const sale = Math.max(0, i.salePrice);
  const gain = Math.max(0, sale - Math.max(0, i.buyPrice) - Math.max(0, i.expenses));
  const hold = Math.max(0, i.holdYears);
  const live = Math.max(0, i.liveYears);

  // 1세대 1주택은 12억까지 비과세 — 초과분에 해당하는 양도차익만 과세한다
  const fullyExempt = i.oneHouse && sale <= t.oneHouseExemptLimit;
  const taxableRatio = i.oneHouse && sale > 0
    ? Math.max(0, Math.min(1, (sale - t.oneHouseExemptLimit) / sale))
    : 1;
  const taxableGain = Math.floor(gain * taxableRatio);

  // 장기보유특별공제
  let longTermRate = 0;
  let longTermBasis = '3년 미만이라 해당 없음';
  const lo = t.longTermOneHouse;
  const lg = t.longTermGeneral;
  if (i.oneHouse && hold >= lo.minHoldYears && live >= lo.minLiveYears) {
    const holdRate = Math.min(lo.holdMaxRate, Math.floor(hold) * lo.holdPerYearRate);
    const liveRate = Math.min(lo.liveMaxRate, Math.floor(live) * lo.livePerYearRate);
    longTermRate = holdRate + liveRate;
    longTermBasis = `1세대 1주택 표2 — 보유 ${pctText(holdRate)} + 거주 ${pctText(liveRate)}`;
  } else if (hold >= lg.startYear) {
    longTermRate = Math.min(lg.maxRate, lg.baseRate + (Math.floor(hold) - lg.startYear) * lg.perYearRate);
    longTermBasis = `표1 — 보유 ${Math.floor(hold)}년`;
  }
  const longTermDeduction = Math.floor(taxableGain * longTermRate);
  const income = Math.max(0, taxableGain - longTermDeduction);

  const taxBase = Math.max(0, income - t.basicDeduction);

  // 세율 — 단기 보유는 단일세율, 2년 이상은 기본세율(+중과)
  const short = t.shortTermRates.find(s => hold < s.underYears);
  let rate: number;
  let rateLabel: string;
  let incomeTax: number;

  if (short) {
    rate = short.rate;
    rateLabel = `${short.label} 단일세율 ${pctText(rate)}`;
    incomeTax = Math.floor(taxBase * rate);
  } else {
    const { tax, bracket } = progressive(taxBase, r.incomeTax.brackets);
    const surcharge = i.heavyHouseCount === 3
      ? t.heavySurcharge.threeOrMore
      : i.heavyHouseCount === 2 ? t.heavySurcharge.twoHouse : 0;
    rate = bracket.rate + surcharge;
    rateLabel = surcharge > 0
      ? `기본세율 ${pctText(bracket.rate)} + 중과 ${pctText(surcharge)}`
      : `기본세율 ${pctText(bracket.rate)}`;
    incomeTax = Math.floor(tax + taxBase * surcharge);
  }

  const finalIncomeTax = won(Math.max(0, incomeTax));
  const localTax = won(finalIncomeTax * t.localTaxRateOfIncomeTax);

  return {
    gain, taxableRatio, taxableGain, longTermDeduction, longTermRate,
    income, taxBase, rate, rateLabel,
    incomeTax: finalIncomeTax, localTax, total: finalIncomeTax + localTax,
    fullyExempt,
    note: t.note, note2: t.note2, source: t.source,
    steps: [
      { label: '양도가액', value: sale },
      { label: '취득가액', value: Math.max(0, i.buyPrice), tone: 'minus' },
      { label: '필요경비', value: Math.max(0, i.expenses), basis: '취득세·중개보수·자본적지출', tone: 'minus' },
      { label: '양도차익', value: gain },
      ...(i.oneHouse ? [{
        label: '과세 대상 비율',
        value: pctText(taxableRatio),
        basis: fullyExempt
          ? `양도가액이 ${fmt(t.oneHouseExemptLimit)}원 이하 → 전액 비과세`
          : `(${fmt(sale)} − ${fmt(t.oneHouseExemptLimit)}) ÷ ${fmt(sale)}`,
        tone: 'info' as const,
      }] : []),
      { label: '과세 대상 양도차익', value: taxableGain },
      { label: '장기보유특별공제', value: longTermDeduction,
        basis: `${pctText(longTermRate)} — ${longTermBasis}`, tone: 'minus' },
      { label: '양도소득금액', value: income },
      { label: '기본공제', value: t.basicDeduction, basis: '연 1회', tone: 'minus' },
      { label: '과세표준', value: taxBase },
      { label: '양도소득세', value: finalIncomeTax, basis: rateLabel },
      { label: '지방소득세', value: localTax, basis: `양도소득세의 ${t.localTaxRateOfIncomeTax * 100}%` },
      { label: '총 납부액', value: finalIncomeTax + localTax, tone: 'result' },
    ],
  };
}
