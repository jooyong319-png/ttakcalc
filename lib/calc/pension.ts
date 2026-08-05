// 국민연금 노령연금 예상 수령액.
//
// ## 산식 (전부 시행 2026. 1. 1. 기준으로 원문 대조, 2026-08-06)
//
//   기본연금액 = 1.29 × (A값 + B값) × (1 + 0.05n)      제51조 ①, n = 20년 초과 가입연수
//   노령연금액   가입 20년 이상 → 기본연금액 전액        제63조 ①1
//                가입 10~20년  → 50% + 초과 1년당 5%    제63조 ①2
//                가입 10년 미만 → 수급권 없음(반환일시금)
//   조기수령     1년 일찍 94% … 5년 일찍 70%            제63조 ②
//   연기수령     1개월당 +0.6%, 최대 5년(+36%)          제62조 ②
//
// 계수 1.29는 2025년 연금개혁으로 소득대체율이 43%로 오르며 개정된 값이다(개정 2025. 10. 1.).
//
// ## 계산하지 않는 것 — 여기가 이 계산기의 한계다
//
//  - **재평가**: 실제 B값은 과거 소득을 연도별 재평가율로 현재가치 환산해 평균낸 값이다.
//    그 표는 매년 고시되고 가입 이력이 있어야 적용할 수 있어, 여기서는 "현재가치 기준 평균 소득"을
//    그대로 받는다. 과거 소득이 낮았다면 실제 B값은 이보다 낮다.
//  - **A값 변동**: 실제로는 수급 시점의 A값이 적용된다. 지금 A값으로 계산한 오늘 기준 금액이다.
//  - **물가 조정**(제51조 ②), **크레딧**(출산·군복무·실업), **소득활동에 따른 감액**(제63조의2).
import { getRates } from '../rates';
import type { Step } from './labor';

const won = (n: number) => Math.floor(n / 10) * 10;
const fmt = (n: number) => Math.round(n).toLocaleString('ko-KR');

/** 수령 시점 — 음수는 조기(년), 0은 정상, 양수는 연기(년) */
export type PensionTiming = number;

export interface PensionInput {
  year: string;
  /** 총 가입기간(년) */
  years: number;
  /** 가입기간 평균 기준소득월액(B값, 현재가치 기준) */
  monthlyIncome: number;
  /** 조기(-1~-5) / 정상(0) / 연기(+1~+5) */
  timing: PensionTiming;
  hasSpouse: boolean;
  /** 부양 자녀·부모 수 */
  dependents: number;
}

export interface PensionResult {
  eligible: boolean;
  basicMonthly: number;
  /** 가입기간을 반영한 노령연금액(조정 전) */
  oldAgeMonthly: number;
  /** 조기·연기 조정 후 */
  adjustedMonthly: number;
  dependentMonthly: number;
  monthly: number;
  annual: number;
  /** 낸 보험료 대비가 아니라 소득 대비 — 소득대체율 감각 */
  replacementRate: number;
  timingRate: number;
  steps: Step[];
  verifiedAt: string;
}

export function calcPension(i: PensionInput): PensionResult {
  const rates = getRates(i.year);
  const p = rates.pension;
  if (!p) throw new Error(`${i.year}년 국민연금 데이터가 없습니다`);

  const years = Math.max(0, i.years);
  const b = Math.max(0, i.monthlyIncome);
  const steps: Step[] = [];
  const push = (label: string, value: number | string, basis: string, tone?: Step['tone']) =>
    steps.push({ label, value, basis, tone });

  push('A값 (전체 가입자 평균)', p.aValue, `${rates.label} 기준 — 매년 바뀌며 수급 시점의 값이 적용된다`, 'info');
  push('B값 (본인 평균 소득)', b, '가입기간 평균 기준소득월액', 'info');

  // 10년 미만이면 노령연금 수급권 자체가 없다 — 조용히 0을 주지 않고 이유를 밝힌다
  if (years < p.minYears) {
    push(
      '수급 가능 여부',
      '수급권 없음',
      `노령연금은 가입기간 ${p.minYears}년 이상이어야 받는다. ${years}년이면 반환일시금 대상이다`,
      'info',
    );
    return {
      eligible: false, basicMonthly: 0, oldAgeMonthly: 0, adjustedMonthly: 0,
      dependentMonthly: 0, monthly: 0, annual: 0, replacementRate: 0, timingRate: 1,
      steps, verifiedAt: p.verifiedAt,
    };
  }

  // ── 기본연금액 (제51조 ①) ──────────────────────────────────
  const over20 = Math.max(0, years - 20);
  const basicAnnual = p.multiplier * (p.aValue + b) * (1 + p.over20BonusPerYear * over20);
  const basicMonthly = won(basicAnnual / 12);
  push(
    '기본연금액 (월)',
    basicMonthly,
    `${p.multiplier} × (${fmt(p.aValue)} + ${fmt(b)})`
      + (over20 > 0 ? ` × (1 + 0.05 × ${over20}년)` : '')
      + ' ÷ 12 (제51조 ①)',
  );

  // ── 가입기간 반영 (제63조 ①) ───────────────────────────────
  let periodRate = 1;
  if (years < 20) {
    periodRate = p.under20BaseRate + p.under20PerYear * (years - p.minYears);
  }
  const oldAgeMonthly = won(basicMonthly * periodRate);
  push(
    '노령연금액 (월)',
    oldAgeMonthly,
    years >= 20
      ? `가입 ${years}년 — 20년 이상이라 기본연금액 전액 (제63조 ①1)`
      : `가입 ${years}년 — 기본연금액의 ${(p.under20BaseRate * 100).toFixed(0)}% + 10년 초과 ${years - p.minYears}년 × 5% = ${(periodRate * 100).toFixed(0)}% (제63조 ①2)`,
  );

  // ── 조기·연기 조정 (제62조·제63조 ②) ───────────────────────
  let timingRate = 1;
  let timingBasis = '지급개시연령에 맞춰 정상 수령';
  if (i.timing < 0) {
    const early = p.earlyRates.find(e => e.yearsEarly === Math.min(5, -i.timing));
    timingRate = early ? early.rate : 1;
    timingBasis = `${-i.timing}년 일찍 받으면 ${(timingRate * 100).toFixed(0)}% — 평생 줄어든 금액으로 받는다 (제63조 ②)`;
  } else if (i.timing > 0) {
    const months = Math.min(p.deferMaxMonths, i.timing * 12);
    timingRate = 1 + p.deferPerMonth * months;
    timingBasis = `${i.timing}년 미루면 1개월당 ${(p.deferPerMonth * 100).toFixed(1)}% 가산 → ${(timingRate * 100).toFixed(1)}% (제62조 ②)`;
  }
  const adjustedMonthly = won(oldAgeMonthly * timingRate);
  if (i.timing !== 0) push('조기·연기 조정', adjustedMonthly, timingBasis, i.timing < 0 ? 'minus' : undefined);

  // ── 부양가족연금 (고시) ────────────────────────────────────
  const depAnnual =
    (i.hasSpouse ? p.dependentSpouseAnnual : 0) +
    Math.max(0, Math.floor(i.dependents)) * p.dependentChildAnnual;
  const dependentMonthly = won(depAnnual / 12);
  if (dependentMonthly > 0) {
    push(
      '부양가족연금',
      dependentMonthly,
      (i.hasSpouse ? `배우자 연 ${fmt(p.dependentSpouseAnnual)}원` : '')
        + (i.dependents > 0 ? `${i.hasSpouse ? ' + ' : ''}자녀·부모 ${i.dependents}명 × 연 ${fmt(p.dependentChildAnnual)}원` : '')
        + ' ÷ 12 — 조기·연기 조정 대상이 아니다',
    );
  }

  const monthly = adjustedMonthly + dependentMonthly;
  push('월 예상 수령액', monthly, '노령연금 + 부양가족연금', 'total');
  push(
    '연 환산',
    monthly * 12,
    `월 ${fmt(monthly)}원 × 12개월 — 사망할 때까지 물가에 연동돼 지급된다`,
    'result',
  );

  return {
    eligible: true, basicMonthly, oldAgeMonthly, adjustedMonthly, dependentMonthly,
    monthly, annual: monthly * 12,
    replacementRate: b > 0 ? monthly / b : 0,
    timingRate,
    steps, verifiedAt: p.verifiedAt,
  };
}
