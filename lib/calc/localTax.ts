// 지방세 계산 — 자동차세 / 재산세.
// 둘 다 "구간 절벽"이 있는 계산이라, 경계 근처에서 금액이 한 번에 뛴다.
// 그 사실이 결과 화면에서 보이도록 근거(basis)에 어느 구간인지를 항상 적는다.
import { getRates, type CcTier, type PropertyTaxBracket } from '../rates';
import type { Step } from './labor';

const won = (n: number) => Math.floor(n / 10) * 10;
const fmt = (n: number) => Math.round(n).toLocaleString('ko-KR');

// ─────────────────────────────────────────────────────────────
// 자동차세 (승용자동차)
// ─────────────────────────────────────────────────────────────
export interface CarTaxInput {
  year: string;
  /** 배기량(cc) */
  cc: number;
  /** 차령(년). 신차 등록 후 경과 연수. 3년째부터 5%씩 경감된다. */
  ageYears: number;
  business: boolean;
}

export interface CarTaxPrepayment {
  month: 1 | 3 | 6;
  /** 공제 대상 일수 / 365 */
  dayRatio: number;
  discount: number;
  payable: number;
}

export interface CarTaxResult {
  perCc: number;
  /** 경감 전 자동차세(연) */
  baseTax: number;
  /** 차령 경감액 */
  ageDiscount: number;
  ageDiscountRate: number;
  /** 경감 후 자동차세(연) */
  carTax: number;
  localEduTax: number;
  /** 자동차세 + 지방교육세 (연) */
  total: number;
  /** 6월·12월에 절반씩 */
  halfYear: number;
  prepayments: CarTaxPrepayment[];
  steps: Step[];
  verifiedAt: string;
  note: string;
}

function perCcOf(tiers: CcTier[], cc: number): CcTier {
  return tiers.find(t => t.upToCc === null || cc <= t.upToCc) ?? tiers[tiers.length - 1];
}

/** 연납 신청 월별 공제 대상 일수(평년 기준). 납부기한 다음 날부터 12/31까지. */
const PREPAY_DAYS: Record<1 | 3 | 6, number> = { 1: 334, 3: 275, 6: 184 };

export function calcCarTax(i: CarTaxInput): CarTaxResult {
  const r = getRates(i.year);
  const c = r.carTax;
  const cc = Math.max(0, Math.round(i.cc));

  const tier = perCcOf(i.business ? c.business : c.private, cc);
  const baseTax = won(cc * tier.perCc);

  // 차령 경감 — 지방세법 제127조 제2항. n은 2~12로 자르고, 3년째(n=3)부터 5%씩.
  const n = Math.min(c.ageReduction.maxYear, Math.max(2, Math.floor(i.ageYears)));
  // 영업용은 차령 경감 대상이 아니다(조문상 비영업용 승용자동차 한정)
  const ageDiscountRate = i.business ? 0 : c.ageReduction.perYearRate * (n - 2);
  const ageDiscount = won(baseTax * ageDiscountRate);
  const carTax = baseTax - ageDiscount;

  // 지방교육세 — 비영업용 승용자동차의 자동차세액 30%
  const localEduTax = i.business ? 0 : won(carTax * c.localEduRateOfCarTax);
  const total = carTax + localEduTax;

  const prepayments = ([1, 3, 6] as const).map(month => {
    const dayRatio = PREPAY_DAYS[month] / 365;
    const discount = won(total * dayRatio * c.prepayment.rate);
    return { month, dayRatio, discount, payable: total - discount };
  });

  // 마지막 구간은 "직전 구간 상한 초과"로 표시한다(자기 자신의 upToCc는 null이라 0이 돼 버린다)
  const tiers = i.business ? c.business : c.private;
  const idx = tiers.indexOf(tier);
  const ccLabel = tier.upToCc === null
    ? `${fmt(tiers[idx - 1]?.upToCc ?? 0)}cc 초과`
    : `${fmt(tier.upToCc)}cc 이하`;

  return {
    perCc: tier.perCc, baseTax, ageDiscount, ageDiscountRate, carTax, localEduTax, total,
    halfYear: Math.round(total / 2),
    prepayments,
    verifiedAt: r.verifiedAt,
    note: c.note,
    steps: [
      { label: '배기량', value: `${fmt(cc)}cc`, basis: `${i.business ? '영업용' : '비영업용'} 승용 · ${ccLabel} 구간` },
      { label: '자동차세(경감 전)', value: baseTax, basis: `${fmt(cc)}cc × ${tier.perCc}원` },
      { label: '차령 경감', value: ageDiscount,
        basis: ageDiscountRate > 0
          ? `차령 ${n}년 → ${(ageDiscountRate * 100).toFixed(0)}% 경감 (3년째부터 5%씩, 12년 50% 한도)`
          : i.business ? '영업용은 차령 경감 대상 아님' : '차령 2년 이하는 경감 없음' },
      { label: '자동차세', value: carTax, basis: '경감 후' },
      { label: '지방교육세', value: localEduTax,
        basis: i.business ? '영업용은 부과 대상 아님' : `자동차세의 ${c.localEduRateOfCarTax * 100}%` },
      { label: '연간 총액', value: total, basis: `6월·12월에 ${fmt(Math.round(total / 2))}원씩` },
    ],
  };
}

// ─────────────────────────────────────────────────────────────
// 재산세 (주택)
// ─────────────────────────────────────────────────────────────
export interface PropertyTaxInput {
  year: string;
  /** 주택 공시가격(시가표준액) */
  publicPrice: number;
  /** 1세대 1주택 여부 — 공정시장가액비율과 세율 특례가 모두 달라진다 */
  oneHouse: boolean;
  /** 도시지역분 부과 대상인지(대부분의 시·구 지역은 해당) */
  urbanArea: boolean;
}

export interface PropertyTaxResult {
  fairMarketRatio: number;
  taxBase: number;
  /** 특례세율이 실제로 적용됐는지 — 1세대1주택이어도 9억 초과면 표준세율 */
  specialRateApplied: boolean;
  propertyTax: number;
  urbanAreaTax: number;
  localEduTax: number;
  total: number;
  /** 7월·9월에 절반씩 */
  half: number;
  steps: Step[];
  verifiedAt: string;
  note: string;
}

function propertyBracketOf(brackets: PropertyTaxBracket[], base: number): PropertyTaxBracket {
  return brackets.find(b => b.upTo === null || base <= b.upTo) ?? brackets[brackets.length - 1];
}

export function calcPropertyTax(i: PropertyTaxInput): PropertyTaxResult {
  const r = getRates(i.year);
  const p = r.propertyTax;
  const price = Math.max(0, i.publicPrice);

  // 1세대 1주택은 공정시장가액비율도 낮다(43~45%)
  const ratio = i.oneHouse
    ? (p.fairMarketRatio.oneHouse.find(t => t.upTo === null || price <= t.upTo)
       ?? p.fairMarketRatio.oneHouse[p.fairMarketRatio.oneHouse.length - 1]).rate
    : p.fairMarketRatio.standard;
  const taxBase = Math.floor(price * ratio);

  // 특례세율은 1세대 1주택 + 공시가격 9억 이하일 때만
  const specialRateApplied = i.oneHouse && price <= p.oneHouseMaxValue;
  const brackets = specialRateApplied ? p.oneHouseBrackets : p.brackets;
  const b = propertyBracketOf(brackets, taxBase);
  const propertyTax = won(b.base + (taxBase - b.over) * b.rate);

  const urbanAreaTax = i.urbanArea ? won(taxBase * p.urbanAreaRate) : 0;
  const localEduTax = won(propertyTax * p.localEduRateOfPropertyTax);
  const total = propertyTax + urbanAreaTax + localEduTax;

  const bandLabel = b.upTo === null ? `${fmt(b.over)}원 초과` : `${fmt(b.upTo)}원 이하`;

  return {
    fairMarketRatio: ratio, taxBase, specialRateApplied,
    propertyTax, urbanAreaTax, localEduTax, total,
    half: Math.round(total / 2),
    verifiedAt: r.verifiedAt,
    note: p.note,
    steps: [
      { label: '공시가격', value: price, basis: '시가표준액(공동주택가격·개별주택가격)' },
      { label: '과세표준', value: taxBase,
        basis: `공시가격 × 공정시장가액비율 ${(ratio * 100).toFixed(0)}%`
          + (i.oneHouse ? ' (1세대 1주택 특례)' : '') },
      { label: '재산세', value: propertyTax,
        basis: `${bandLabel} 구간 · ${fmt(b.base)}원 + 초과분 ${(b.rate * 100).toFixed(2)}%`
          + (specialRateApplied ? ' (1세대 1주택 특례세율)' : '') },
      { label: '도시지역분', value: urbanAreaTax,
        basis: i.urbanArea ? `과세표준 × ${(p.urbanAreaRate * 100).toFixed(2)}%` : '부과 대상 아님' },
      { label: '지방교육세', value: localEduTax, basis: `재산세의 ${p.localEduRateOfPropertyTax * 100}%` },
      { label: '연간 총액', value: total, basis: `7월·9월에 ${fmt(Math.round(total / 2))}원씩` },
    ],
  };
}
