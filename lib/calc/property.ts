// 부동산·금융 계산 — 취득세 / 중개보수 / 대출 상환.
import { getRates, type FeeTier } from '../rates';
import type { Step } from './labor';

const won = (n: number) => Math.floor(n / 10) * 10;

// ─────────────────────────────────────────────────────────────
// 취득세 (주택 유상취득)
// ─────────────────────────────────────────────────────────────
export interface AcquisitionInput {
  year: string;
  price: number;          // 취득가액
  areaSqm: number;        // 전용면적(㎡) — 85 초과 시 농특세
  houseCount: 1 | 2 | 3;  // 취득 후 보유 주택 수(3은 3주택 이상)
  regulated: boolean;     // 조정대상지역 여부
}

export interface AcquisitionResult {
  acquisitionTax: number; localEduTax: number; ruralTax: number; total: number;
  effectiveRate: number;
  steps: Step[]; verifiedAt: string; note: string;
}

export function calcAcquisitionTax(i: AcquisitionInput): AcquisitionResult {
  const r = getRates(i.year);
  const a = r.acquisitionTax;
  const p = Math.max(0, i.price);

  let rate: number;
  let rateBasis: string;
  /** 중과세율이 걸리면 부가세목(지방교육세·농특세)도 다른 산식을 쓴다 — 그 사실을 여기서 한 번만 판정한다 */
  let heavy: 'two' | 'three' | null = null;

  // 다주택 중과 — 조정대상지역 2주택 / 3주택 이상
  if (i.houseCount >= 3) {
    rate = a.multiHouse.threeOrMore;
    rateBasis = `3주택 이상 중과 ${(rate * 100).toFixed(0)}%`;
    heavy = 'three';
  } else if (i.houseCount === 2 && i.regulated) {
    rate = a.multiHouse.twoInRegulated;
    rateBasis = `조정대상지역 2주택 중과 ${(rate * 100).toFixed(0)}%`;
    heavy = 'two';
  } else if (p <= 600_000_000) {
    rate = a.house['under6억'].rate;
    rateBasis = `6억 이하 ${(rate * 100).toFixed(0)}%`;
  } else if (p <= 900_000_000) {
    // 6~9억 누진식: (취득가액(억) × 2/3 − 3) / 100
    const eok = p / 100_000_000;
    rate = Math.max(0.01, Math.min(0.03, (eok * 2 / 3 - 3) / 100));
    rateBasis = `6~9억 누진식 → ${(rate * 100).toFixed(2)}%`;
  } else {
    rate = a.house['over9억'].rate;
    rateBasis = `9억 초과 ${(rate * 100).toFixed(0)}%`;
  }

  const acquisitionTax = won(p * rate);

  // 지방교육세 — 주택 유상거래는 취득세율의 1/10(제151조 단서), 다주택 중과는 0.4% 고정(같은 조 나목)
  const localEduRate = heavy
    ? a.multiHouse.localEduRate
    : Math.min(0.003, Math.max(0.001, rate / 10));
  const localEduBasis = heavy ? a.multiHouse.localEduBasis : a.house['under6억'].localEduBasis;
  const localEduTax = won(p * localEduRate);

  // 농어촌특별세 — 85㎡ 초과에만. 중과 시에는 과세표준이 커져 0.2% → 0.6%/1.0%
  const overArea = i.areaSqm > a.ruralTax.areaThresholdSqm;
  const ruralTaxRate = heavy === 'three'
    ? a.multiHouse.ruralTaxRateThree
    : heavy === 'two'
      ? a.multiHouse.ruralTaxRateTwo
      : a.ruralTax.rate;
  const ruralTax = overArea ? won(p * ruralTaxRate) : 0;

  const total = acquisitionTax + localEduTax + ruralTax;

  return {
    acquisitionTax, localEduTax, ruralTax, total,
    effectiveRate: p > 0 ? total / p : 0,
    verifiedAt: r.verifiedAt,
    note: a.note,
    steps: [
      { label: '취득가액', value: p, basis: '입력값' },
      { label: '취득세', value: acquisitionTax, basis: `${p.toLocaleString()}원 × ${(rate * 100).toFixed(2)}% (${rateBasis})` },
      { label: '지방교육세', value: localEduTax,
        basis: `${(localEduRate * 100).toFixed(2)}% — ${localEduBasis}` },
      { label: '농어촌특별세', value: ruralTax,
        basis: overArea
          ? `전용 ${i.areaSqm}㎡ > ${a.ruralTax.areaThresholdSqm}㎡ → ${(ruralTaxRate * 100).toFixed(1)}%`
            + (heavy ? ` (${a.multiHouse.ruralTaxBasis})` : '')
          : `전용 ${a.ruralTax.areaThresholdSqm}㎡ 이하는 비과세` },
      { label: '총 납부액', value: total, basis: `실효세율 ${(total / (p || 1) * 100).toFixed(2)}%` },
    ],
  };
}

// ─────────────────────────────────────────────────────────────
// 부동산 중개보수
// ─────────────────────────────────────────────────────────────
export interface BrokerageResult {
  tier: FeeTier; fee: number; vat: number; total: number;
  cappedByMax: boolean;
  steps: Step[]; verifiedAt: string; note: string;
}

export function calcBrokerage(
  amount: number, year: string, type: 'sale' | 'lease', includeVat: boolean,
): BrokerageResult {
  const r = getRates(year);
  const b = r.brokerageFee;
  const tiers = type === 'sale' ? b.sale : b.lease;
  const amt = Math.max(0, amount);

  const tier = tiers.find(t => t.upTo === null || amt <= t.upTo) ?? tiers[tiers.length - 1];
  const raw = amt * tier.rate;
  const cappedByMax = tier.maxFee !== null && raw > tier.maxFee;
  const fee = won(cappedByMax ? tier.maxFee! : raw);
  const vat = includeVat ? won(fee * b.vatRate) : 0;

  const tierLabel = tier.upTo === null ? '15억 초과' : `${(tier.upTo / 100_000_000).toFixed(tier.upTo % 100_000_000 === 0 ? 0 : 1)}억 이하`;

  return {
    tier, fee, vat, total: fee + vat, cappedByMax,
    verifiedAt: r.verifiedAt, note: b.note,
    steps: [
      { label: '거래금액', value: amt, basis: type === 'sale' ? '매매·교환' : '임대차(전세·월세 환산)' },
      { label: '상한요율', value: `${(tier.rate * 100).toFixed(1)}%`, basis: `${tierLabel} 구간` },
      { label: '중개보수(상한)', value: fee,
        basis: cappedByMax ? `요율 계산 ${Math.round(raw).toLocaleString()}원이 한도 ${tier.maxFee!.toLocaleString()}원 초과 → 한도 적용`
                           : `${amt.toLocaleString()}원 × ${(tier.rate * 100).toFixed(1)}%` },
      ...(includeVat ? [{ label: '부가가치세', value: vat, basis: `중개보수 × ${b.vatRate * 100}% (일반과세 중개사)` }] : []),
      { label: includeVat ? '총 지급액' : '중개보수', value: fee + vat, basis: '상한이며 실제로는 협의로 정한다' },
    ],
  };
}

// ─────────────────────────────────────────────────────────────
// 대출 상환
// ─────────────────────────────────────────────────────────────
export type LoanMethod = 'equal-payment' | 'equal-principal' | 'bullet';

export interface LoanResult {
  method: LoanMethod;
  monthlyPayment: number;      // 원리금균등: 매월 동일 / 그 외: 첫 달
  firstPayment: number;
  lastPayment: number;
  totalInterest: number;
  totalPayment: number;
  schedule: { month: number; principal: number; interest: number; payment: number; balance: number }[];
  steps: Step[]; verifiedAt: string;
}

export function calcLoan(
  principal: number, annualRatePercent: number, months: number, method: LoanMethod, year: string,
): LoanResult {
  const r = getRates(year);
  const P = Math.max(0, principal);
  const n = Math.max(1, Math.round(months));
  const i = annualRatePercent / 100 / 12;

  const schedule: LoanResult['schedule'] = [];
  let balance = P;
  let totalInterest = 0;

  if (method === 'equal-payment') {
    // 원리금균등: A = P·i·(1+i)^n / ((1+i)^n − 1)
    const pay = i === 0 ? P / n : (P * i * Math.pow(1 + i, n)) / (Math.pow(1 + i, n) - 1);
    for (let m = 1; m <= n; m++) {
      const interest = balance * i;
      const principalPart = pay - interest;
      balance = Math.max(0, balance - principalPart);
      totalInterest += interest;
      schedule.push({ month: m, principal: principalPart, interest, payment: pay, balance });
    }
  } else if (method === 'equal-principal') {
    const principalPart = P / n;
    for (let m = 1; m <= n; m++) {
      const interest = balance * i;
      balance = Math.max(0, balance - principalPart);
      totalInterest += interest;
      schedule.push({ month: m, principal: principalPart, interest, payment: principalPart + interest, balance });
    }
  } else {
    // 만기일시: 매월 이자만, 마지막에 원금
    for (let m = 1; m <= n; m++) {
      const interest = P * i;
      const principalPart = m === n ? P : 0;
      totalInterest += interest;
      balance = m === n ? 0 : P;
      schedule.push({ month: m, principal: principalPart, interest, payment: interest + principalPart, balance });
    }
  }

  const first = schedule[0]?.payment ?? 0;
  const last = schedule[schedule.length - 1]?.payment ?? 0;
  const methodLabel = method === 'equal-payment' ? '원리금균등' : method === 'equal-principal' ? '원금균등' : '만기일시';

  return {
    method,
    monthlyPayment: won(first),
    firstPayment: won(first),
    lastPayment: won(last),
    totalInterest: won(totalInterest),
    totalPayment: won(P + totalInterest),
    schedule,
    verifiedAt: r.verifiedAt,
    steps: [
      { label: '대출원금', value: P, basis: `${methodLabel} · 연 ${annualRatePercent}% · ${n}개월` },
      { label: method === 'equal-payment' ? '매월 상환액' : '첫 달 상환액', value: won(first),
        basis: method === 'equal-payment'
          ? `P×i×(1+i)ⁿ ÷ ((1+i)ⁿ−1), 월이자율 ${(i * 100).toFixed(4)}%`
          : method === 'equal-principal'
            ? `원금 ${won(P / n).toLocaleString()}원 + 첫달 이자 ${won(P * i).toLocaleString()}원`
            : `이자만 ${won(P * i).toLocaleString()}원 (원금은 만기 일시상환)` },
      ...(method !== 'equal-payment' ? [{ label: '마지막 달 상환액', value: won(last),
        basis: method === 'bullet' ? '이자 + 원금 전액' : '원금 + 잔액 이자(가장 적음)' }] : []),
      { label: '총 이자', value: won(totalInterest), basis: `${n}개월 누적` },
      { label: '총 상환액', value: won(P + totalInterest), basis: '원금 + 총 이자' },
    ],
  };
}
