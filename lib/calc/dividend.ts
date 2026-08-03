// 배당소득세.
//
// 이 계산이 비선형인 지점은 하나다 — **금융소득 2천만원**. 그 아래는 무조건 15.4%로 끝나고,
// 넘는 순간 초과분이 다른 소득과 합쳐져 누진세율을 탄다. 그래서 "배당 2천만원"과
// "배당 2천 1만원"의 세금 차이가 사람들이 실제로 궁금해하는 것이다.
//
// 조문(전부 시행 2026. 1. 1. 기준으로 원문 대조, 2026-08-03):
//   제129조①2나  배당소득 원천징수 100분의 14
//   제14조③6     이자+배당 합계 2천만원 이하이면 분리과세로 종결
//   제14조④      2천만원 판정에는 귀속법인세 가산액을 넣지 않는다
//   제17조③ 단서 내국법인 배당은 총수입금액에 100분의 10을 더한다(Gross-up)
//   제56조·④     더한 금액을 산출세액에서 공제. 공제 대상은 2천만원 **초과분**에 한정
//   제62조        종합과세 시 산출세액 = max(종합과세 방식, 분리과세 방식)  ← 비교과세
//   시행령 제116조의2  2천만원을 채우는 순서: 이자 → 그 밖의 배당 → 가산 대상 배당
//
// 계산하지 않는 것(추정하면 거짓말이 되는 값):
//   - 해외 배당의 현지 원천징수세액과 외국납부세액공제(제57조) — 국가·조세조약마다 다르다
//   - 개인별 세액공제(의료비·기부금 등) — 알 수 없다
//   그래서 화면에 "이 계산기가 보지 않는 것"으로 명시한다.
import { getRates } from '../rates';
import type { Step } from './labor';
import { progressiveTax, bracketLabel } from './income';

const won = (n: number) => Math.floor(n / 10) * 10;
const fmt = (n: number) => Math.round(n).toLocaleString('ko-KR');

export interface DividendTaxInput {
  year: string;
  /** 연간 배당금(세전) */
  dividend: number;
  /** 연간 이자소득(세전). 2천만원은 이자부터 채운다(시행령 제116조의2 제1호) */
  interest: number;
  /** 내국법인 배당인가 — Gross-up 대상 여부. 해외 주식·ETF는 false */
  domestic: boolean;
  /** 배당·이자를 뺀 다른 종합소득금액(근로소득금액 등) */
  otherIncome: number;
  /** 종합소득공제 합계. 기본값은 본인 기본공제 150만원(제50조①1) */
  deduction: number;
}

export interface DividendTaxResult {
  financialIncome: number;
  /** 2천만원을 넘어 종합과세되는가 */
  comprehensive: boolean;
  /** 원천징수 단계에서 떼인 세금(소득세+지방소득세) */
  withheld: number;
  /** 최종 결정세액(소득세) */
  incomeTax: number;
  localTax: number;
  totalTax: number;
  /** 세후 배당 수령액 */
  netDividend: number;
  /** 실효세율(총세금 ÷ 금융소득) */
  effectiveRate: number;
  /** 종합과세 방식 산출세액(제62조 제1호) — 분리과세면 0 */
  comprehensiveWay: number;
  /** 분리과세 방식 산출세액(제62조 제2호) */
  separateWay: number;
  grossUp: number;
  dividendCredit: number;
  steps: Step[];
  verifiedAt: string;
}

export function calcDividendTax(i: DividendTaxInput): DividendTaxResult {
  const rates = getRates(i.year);
  const d = rates.dividend;
  // 제1원칙 — 데이터가 없는 연도를 조용히 넘어가지 않는다
  if (!d) throw new Error(`${i.year}년 배당소득 데이터가 없습니다`);

  const dividend = Math.max(0, i.dividend);
  const interest = Math.max(0, i.interest);
  const other = Math.max(0, i.otherIncome);
  const deduction = Math.max(0, i.deduction);

  const financialIncome = dividend + interest;
  const threshold = d.comprehensiveThreshold;
  const W = d.withholdingRate;
  const localRate = rates.incomeTax.localTaxRateOfIncomeTax;

  const steps: Step[] = [];
  // 금액은 숫자로 넘긴다 — Breakdown이 자리수 구분과 '원'을 붙이고, minus 톤이면 부호도 붙인다.
  // 여기서 '−'를 문자열에 넣으면 부호가 두 번 찍힌다.
  const push = (label: string, value: number | string, basis: string, tone?: Step['tone']) =>
    steps.push({ label, value, basis, tone });

  push(
    '금융소득 합계',
    financialIncome,
    interest > 0
      ? `배당 ${fmt(dividend)}원 + 이자 ${fmt(interest)}원`
      : '배당소득 전액(세전)',
  );

  // ── 1단계: 원천징수 ──────────────────────────────────────────
  // 받을 때 이미 떼인다. 2천만원 이하면 이걸로 끝난다.
  const withheldIncome = won(financialIncome * W);
  const withheldLocal = won(withheldIncome * localRate);
  const withheld = withheldIncome + withheldLocal;
  push(
    '원천징수',
    withheld,
    `소득세 ${(W * 100).toFixed(0)}% + 지방소득세 ${(W * localRate * 100).toFixed(1)}% = ${(W * (1 + localRate) * 100).toFixed(1)}% (제129조①2나)`,
    'minus',
  );

  // ── 2단계: 종합과세 대상인가 ─────────────────────────────────
  // 제14조④ — 판정에는 Gross-up 가산액을 넣지 않는다. 그래서 실제 받은 금액으로 본다.
  const comprehensive = financialIncome > threshold;
  if (!comprehensive) {
    push(
      '종합과세 여부',
      '해당 없음',
      `금융소득 ${fmt(financialIncome)}원 ≤ ${fmt(threshold)}원 — 원천징수로 납세의무가 끝난다(제14조③6)`,
      'info',
    );
    const net = financialIncome - withheld;
    return {
      financialIncome, comprehensive: false, withheld,
      incomeTax: withheldIncome, localTax: withheldLocal, totalTax: withheld,
      netDividend: net,
      effectiveRate: financialIncome > 0 ? withheld / financialIncome : 0,
      comprehensiveWay: 0, separateWay: withheldIncome,
      grossUp: 0, dividendCredit: 0,
      steps, verifiedAt: d.verifiedAt,
    };
  }

  push(
    '종합과세 대상',
    financialIncome - threshold,
    `${fmt(threshold)}원 초과분이 다른 종합소득과 합산된다(제14조③6). `
      + '위 원천징수액은 미리 떼어 둔 것이라 5월에 정산한다',
    'info',
  );

  // ── 3단계: Gross-up ─────────────────────────────────────────
  // 제56조④ + 시행령 제116조의2 — 2천만원은 이자부터 채우고, 가산 대상 배당은 맨 나중에
  // 합산한다. 그래서 가산 대상이 되는 건 "2천만원을 채우고 남은 배당"이다.
  const excess = financialIncome - threshold;
  const grossUpBase = i.domestic ? Math.min(dividend, excess) : 0;
  const grossUp = won(grossUpBase * d.grossUpRate);
  if (i.domestic) {
    push(
      '귀속법인세 가산 (Gross-up)',
      `+${fmt(grossUp)}원`,
      `2천만원 초과 배당 ${fmt(grossUpBase)}원 × ${(d.grossUpRate * 100).toFixed(0)}% — 같은 금액을 아래에서 세액공제로 뺀다(제17조③·제56조)`,
      'info',
    );
  } else {
    push(
      '귀속법인세 가산',
      '해당 없음',
      '해외 법인 배당은 Gross-up·배당세액공제 대상이 아니다(제17조③ 단서)',
      'info',
    );
  }

  // ── 4단계: 비교과세 (제62조) ────────────────────────────────
  const totalIncome = financialIncome + grossUp + other;
  const taxBase = Math.max(0, totalIncome - deduction);
  push(
    '종합소득 과세표준',
    taxBase,
    `금융소득 ${fmt(financialIncome)}원${grossUp ? ` + 가산 ${fmt(grossUp)}원` : ''}${other ? ` + 다른 종합소득 ${fmt(other)}원` : ''} − 소득공제 ${fmt(deduction)}원`,
  );

  // ① 종합과세 방식: 2천만원은 14%로 떼고, 나머지 과세표준에 누진세율
  const progressiveBase = Math.max(0, taxBase - threshold);
  const wayComprehensive =
    progressiveTax(progressiveBase, rates) + Math.round(threshold * W);
  push(
    '① 종합과세 방식',
    wayComprehensive,
    `${fmt(progressiveBase)}원에 누진세율(${bracketLabel(progressiveBase, rates)}) + ${fmt(threshold)}원 × ${(W * 100).toFixed(0)}%`,
  );

  // ② 분리과세 방식: 금융소득 전부 14% + 다른 소득만 누진세율
  const otherBase = Math.max(0, other - deduction);
  const waySeparate = Math.round(financialIncome * W) + progressiveTax(otherBase, rates);
  push(
    '② 분리과세 방식',
    waySeparate,
    other > 0
      ? `금융소득 ${fmt(financialIncome)}원 × ${(W * 100).toFixed(0)}% + 다른 종합소득 ${fmt(otherBase)}원에 누진세율`
      : `금융소득 ${fmt(financialIncome)}원 × ${(W * 100).toFixed(0)}% (다른 종합소득 없음)`,
  );

  const calculated = Math.max(wayComprehensive, waySeparate);
  push(
    '산출세액',
    calculated,
    `①과 ② 중 큰 금액을 택한다 — ${wayComprehensive >= waySeparate ? '①' : '②'}가 크다 (제62조)`,
  );

  // ── 5단계: 배당세액공제 ─────────────────────────────────────
  // 가산했던 금액을 그대로 뺀다. 다만 이 공제로 세금이 ②(분리과세 방식) 아래로 내려가지는
  // 않는다 — 종합과세가 분리과세보다 유리해지는 결과를 막는 것이 제62조의 취지다.
  const creditCap = Math.max(0, calculated - waySeparate);
  const dividendCredit = Math.min(grossUp, creditCap);
  if (grossUp > 0) {
    push(
      '배당세액공제',
      dividendCredit,
      dividendCredit < grossUp
        ? `가산액 ${fmt(grossUp)}원 중 ${fmt(dividendCredit)}원만 공제 — 공제 후 세액이 ②보다 낮아질 수 없다(제62조)`
        : `가산한 ${fmt(grossUp)}원을 그대로 공제(제56조)`,
      'minus',
    );
  }

  const incomeTax = won(Math.max(0, calculated - dividendCredit));
  const localTax = won(incomeTax * localRate);
  const totalTax = incomeTax + localTax;

  push('소득세 (결정세액)', incomeTax, '산출세액 − 배당세액공제');
  push('지방소득세', localTax, `소득세의 ${(localRate * 100).toFixed(0)}% (지방세법 제92조)`);
  push('총 세금', totalTax, '소득세 + 지방소득세', 'total');

  const netDividend = financialIncome - totalTax;
  push(
    '세후 실수령',
    netDividend,
    `금융소득 ${fmt(financialIncome)}원 − 총 세금 ${fmt(totalTax)}원`,
    'total',
  );

  // 원천징수는 미리 떼어 둔 것일 뿐이다. 종합과세 대상이면 5월에 정산하므로
  // "그래서 얼마를 더 내야 하나"가 실제로 필요한 답이다.
  const balance = totalTax - withheld;
  push(
    balance >= 0 ? '5월에 추가 납부' : '5월에 환급',
    Math.abs(balance),
    `결정세액 ${fmt(totalTax)}원 − 원천징수로 이미 낸 ${fmt(withheld)}원`,
    'result',
  );

  return {
    financialIncome, comprehensive: true, withheld,
    incomeTax, localTax, totalTax, netDividend,
    effectiveRate: financialIncome > 0 ? totalTax / financialIncome : 0,
    comprehensiveWay: wayComprehensive, separateWay: waySeparate,
    grossUp, dividendCredit,
    steps, verifiedAt: d.verifiedAt,
  };
}

/**
 * 세후 목표 배당을 만들려면 세전 배당이 얼마여야 하는가.
 *
 * 파이어를 준비하는 사람이 실제로 던지는 질문은 "배당 5천만원이면 세금 얼마"가 아니라
 * "세후 월 300을 만들려면 얼마가 필요한가"다. 누진세라 역함수가 없어 이분탐색으로 찾는다
 * (역산 연봉 계산기와 같은 방식).
 */
export function reverseDividend(
  targetNet: number,
  base: Omit<DividendTaxInput, 'dividend'>,
): number {
  if (targetNet <= 0) return 0;
  let lo = 0;
  let hi = Math.max(targetNet * 3, 10_000_000);
  for (let n = 0; n < 60; n++) {
    const mid = (lo + hi) / 2;
    const net = calcDividendTax({ ...base, dividend: mid }).netDividend;
    if (net < targetNet) lo = mid;
    else hi = mid;
  }
  return Math.ceil(hi / 10_000) * 10_000; // 만원 단위로 올림
}
