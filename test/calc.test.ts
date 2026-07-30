// 계산 로직 회귀 테스트 — 이 프로젝트의 제1원칙("계산이 틀리면 끝이다")을 지키는 안전망.
// 실행: npm test  (tsc로 dist-test에 컴파일 후 node --test)
//
// 값의 근거:
//  - 교차검증 값은 2026-07-30에 타 계산기(간이세액표 기준)와 대조해 20원 이내로 일치시킨 것.
//  - 경계값(상·하한, 구간 경계, 자격 요건)은 요율 데이터와 법령 기준에서 직접 온 것.
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { calcSalary } from '../lib/calc/salary';
import { calcSeverance, calcFreelancer, calcUnemployment, calcHolidayPay } from '../lib/calc/labor';
import { calcAcquisitionTax, calcBrokerage, calcLoan } from '../lib/calc/property';
import { getRates, latestYear } from '../lib/rates';

const Y = latestYear();
const R = getRates(Y);
/** 교차검증 허용 오차 — 원 단위 절사 방식 차이만 허용한다. */
const near = (got: number, expect: number, tol = 50, msg = '') =>
  assert.ok(Math.abs(got - expect) <= tol, `${msg} got=${got} expect=${expect} (허용 ±${tol})`);

// ─────────────────────────── 연봉 실수령액 ───────────────────────────
test('연봉 실수령액 — 교차검증 값과 일치(비과세 20만, 부양가족 1)', () => {
  const base = { year: Y, dependents: 1, childrenUnder20: 0, monthlyNonTaxable: 200_000 };
  near(calcSalary({ ...base, annualSalary: 30_000_000 }).monthlyNet, 2_253_593, 50, '연봉 3천만');
  near(calcSalary({ ...base, annualSalary: 50_000_000 }).monthlyNet, 3_565_639, 50, '연봉 5천만');
  near(calcSalary({ ...base, annualSalary: 60_000_000 }).monthlyNet, 4_200_731, 50, '연봉 6천만');
});

test('연봉 — 국민연금 기준소득월액 상한이 걸린다(고연봉은 보험료 고정)', () => {
  const mk = (annual: number) => calcSalary({
    annualSalary: annual, year: Y, dependents: 1, childrenUnder20: 0, monthlyNonTaxable: 200_000,
  }).deductions.find(d => d.key === 'nationalPension')!.amount;
  const cap = Math.floor(R.insurance.nationalPension.monthlyIncomeMax * R.insurance.nationalPension.employeeRate / 10) * 10;
  assert.equal(mk(100_000_000), cap, '연봉 1억은 상한 보험료');
  assert.equal(mk(300_000_000), cap, '연봉 3억도 같은 상한 보험료');
});

test('연봉 — 비과세는 한도까지만 인정된다', () => {
  const over = calcSalary({
    annualSalary: 50_000_000, year: Y, dependents: 1, childrenUnder20: 0,
    monthlyNonTaxable: 1_000_000, // 한도 초과 입력
  });
  assert.equal(over.monthlyNonTaxable, R.nonTaxable.mealAllowanceMonthlyMax, '한도로 잘려야 함');
});

test('연봉 — 부양가족이 늘면 세금이 줄어든다', () => {
  const mk = (deps: number) => calcSalary({
    annualSalary: 60_000_000, year: Y, dependents: deps, childrenUnder20: 0, monthlyNonTaxable: 200_000,
  }).deductions.find(d => d.key === 'incomeTax')!.amount;
  assert.ok(mk(3) < mk(1), '부양가족 3인 세금 < 1인 세금');
});

test('연봉 — 공제 합계 + 실수령 = 세전(반올림 오차 없음)', () => {
  const r = calcSalary({ annualSalary: 47_300_000, year: Y, dependents: 2, childrenUnder20: 1, monthlyNonTaxable: 150_000 });
  assert.equal(r.monthlyNet + r.totalDeduction, r.monthlyGross);
});

// ─────────────────────────── 퇴직금 ───────────────────────────
test('퇴직금 — 1년 미만은 지급 대상 아님', () => {
  const r = calcSeverance({
    year: Y, joinDate: '2026-01-01', leaveDate: '2026-09-01',
    monthlySalary: 3_000_000, annualBonus: 0, annualLeavePay: 0,
  });
  assert.equal(r.eligible, false);
  assert.ok(r.reason);
});

test('퇴직금 — 3년 근무 시 월급×3년 수준(30일분 기준)', () => {
  const r = calcSeverance({
    year: Y, joinDate: '2023-07-30', leaveDate: '2026-07-30',
    monthlySalary: 3_500_000, annualBonus: 0, annualLeavePay: 0,
  });
  assert.equal(r.eligible, true);
  // 1일 평균임금 = 3개월 임금 / 91.25일 → ×30일×3년 ≒ 월급×3 수준
  near(r.severance, 10_356_160, 20_000, '퇴직금 3년');
  assert.ok(r.serviceDays >= 1095 && r.serviceDays <= 1097, `재직일수 ${r.serviceDays}`);
});

test('퇴직금 — 상여·연차수당이 평균임금을 올린다', () => {
  const base = { year: Y, joinDate: '2023-07-30', leaveDate: '2026-07-30', monthlySalary: 3_500_000 };
  const plain = calcSeverance({ ...base, annualBonus: 0, annualLeavePay: 0 });
  const withBonus = calcSeverance({ ...base, annualBonus: 6_000_000, annualLeavePay: 0 });
  assert.ok(withBonus.severance > plain.severance);
});

// ─────────────────────────── 프리랜서 3.3% ───────────────────────────
test('프리랜서 — 300만원 계약 시 실수령 290.1만원', () => {
  const r = calcFreelancer(3_000_000, Y, 'gross');
  assert.equal(r.incomeTax, 90_000);
  assert.equal(r.localTax, 9_000);
  assert.equal(r.net, 2_901_000);
});

test('프리랜서 — 실수령 역산이 왕복 일치한다', () => {
  const back = calcFreelancer(2_901_000, Y, 'net');   // 실수령 → 계약금액
  near(back.gross, 3_000_000, 1_500, '역산 계약금액');
  near(calcFreelancer(back.gross, Y, 'gross').net, 2_901_000, 1_500, '왕복 실수령');
});

// ─────────────────────────── 실업급여 ───────────────────────────
test('실업급여 — 상한이 하한보다 크다(데이터 모순 없음)', () => {
  const lower = R.minimumWage.hourly * R.unemployment.lowerBoundRateOfMinimumWage * R.unemployment.dailyWorkHours;
  assert.ok(R.unemployment.dailyMax > lower,
    `상한 ${R.unemployment.dailyMax} > 하한 ${lower} 이어야 한다(최저임금 인상 시 상한 갱신 누락 감지)`);
});

test('실업급여 — 고소득자는 상한, 저소득자는 하한이 적용된다', () => {
  const hi = calcUnemployment(7_000_000, Y, 3, false);
  assert.equal(hi.cappedBy, 'max');
  assert.equal(hi.dailyBenefit, R.unemployment.dailyMax);

  const lo = calcUnemployment(1_500_000, Y, 3, false);
  assert.equal(lo.cappedBy, 'min');
  assert.equal(lo.boundsConflict, false);
});

test('실업급여 — 소정급여일수가 가입기간·연령에 따라 달라진다', () => {
  assert.equal(calcUnemployment(3_000_000, Y, 0.5, false).durationDays, 120, '1년 미만');
  assert.equal(calcUnemployment(3_000_000, Y, 4, false).durationDays, 180, '3~5년·50세 미만');
  assert.equal(calcUnemployment(3_000_000, Y, 12, false).durationDays, 240, '10년 이상·50세 미만');
  assert.equal(calcUnemployment(3_000_000, Y, 12, true).durationDays, 270, '10년 이상·50세 이상');
});

// ─────────────────────────── 주휴수당 ───────────────────────────
test('주휴수당 — 주 15시간 미만은 발생하지 않는다', () => {
  const r = calcHolidayPay(R.minimumWage.hourly, 14, Y);
  assert.equal(r.eligible, false);
  assert.equal(r.weeklyHolidayPay, 0);
});

test('주휴수당 — 주 40시간은 8시간분, 20시간은 4시간분', () => {
  const full = calcHolidayPay(10_320, 40, Y);
  assert.equal(full.weeklyHolidayPay, 82_560);   // 8h × 10,320
  const half = calcHolidayPay(10_320, 20, Y);
  assert.equal(half.weeklyHolidayPay, 41_280);   // 4h × 10,320
});

test('주휴수당 — 최저임금 미달을 감지한다', () => {
  assert.equal(calcHolidayPay(R.minimumWage.hourly - 100, 40, Y).belowMinimum, true);
  assert.equal(calcHolidayPay(R.minimumWage.hourly, 40, Y).belowMinimum, false);
});

// ─────────────────────────── 취득세 ───────────────────────────
test('취득세 — 구간별 세율(6억 이하 1% / 7.5억 2% 누진식 / 9억 초과 3%)', () => {
  const mk = (price: number) => calcAcquisitionTax({ year: Y, price, areaSqm: 84, houseCount: 1, regulated: false });
  near(mk(500_000_000).acquisitionTax, 5_000_000, 100, '5억 → 1%');
  // 공식 예시: 7.5억이면 (7.5×2/3−3)=2%
  near(mk(750_000_000).acquisitionTax, 15_000_000, 100, '7.5억 → 2%');
  near(mk(1_200_000_000).acquisitionTax, 36_000_000, 100, '12억 → 3%');
});

test('취득세 — 다주택 중과(조정 2주택 8% / 3주택 12%)', () => {
  const two = calcAcquisitionTax({ year: Y, price: 500_000_000, areaSqm: 84, houseCount: 2, regulated: true });
  near(two.acquisitionTax, 500_000_000 * 0.08, 100, '조정 2주택 8%');
  const three = calcAcquisitionTax({ year: Y, price: 500_000_000, areaSqm: 84, houseCount: 3, regulated: false });
  near(three.acquisitionTax, 500_000_000 * 0.12, 100, '3주택 12%');
});

test('취득세 — 농어촌특별세는 85㎡ 초과에만 붙는다', () => {
  const small = calcAcquisitionTax({ year: Y, price: 500_000_000, areaSqm: 84.9, houseCount: 1, regulated: false });
  const big = calcAcquisitionTax({ year: Y, price: 500_000_000, areaSqm: 85.1, houseCount: 1, regulated: false });
  assert.equal(small.ruralTax, 0);
  near(big.ruralTax, 500_000_000 * R.acquisitionTax.ruralTax.rate, 100);
});

// ─────────────────────────── 중개보수 ───────────────────────────
test('중개보수 — 매매 구간별 요율', () => {
  near(calcBrokerage(500_000_000, Y, 'sale', false).fee, 2_000_000, 50, '5억 매매 0.4%');
  near(calcBrokerage(1_000_000_000, Y, 'sale', false).fee, 5_000_000, 50, '10억 매매 0.5%');
  near(calcBrokerage(2_000_000_000, Y, 'sale', false).fee, 14_000_000, 50, '20억 매매 0.7%');
});

test('중개보수 — 한도액이 요율 계산을 이긴다(소액 구간)', () => {
  const r = calcBrokerage(45_000_000, Y, 'sale', false);   // 0.6% = 27만 > 한도 25만
  assert.equal(r.cappedByMax, true);
  assert.equal(r.fee, 250_000);
});

test('중개보수 — 임대차 요율과 VAT', () => {
  const noVat = calcBrokerage(300_000_000, Y, 'lease', false);
  near(noVat.fee, 900_000, 50, '3억 임대차 0.3%');
  const withVat = calcBrokerage(300_000_000, Y, 'lease', true);
  near(withVat.total, 990_000, 50, 'VAT 10% 포함');
});

// ─────────────────────────── 대출 ───────────────────────────
test('대출 — 원리금균등 월 상환액 공식', () => {
  const r = calcLoan(300_000_000, 4.5, 360, 'equal-payment', Y);
  near(r.monthlyPayment, 1_520_050, 200, '3억·4.5%·30년');
  assert.equal(r.firstPayment, r.lastPayment, '원리금균등은 매월 동일');
});

test('대출 — 원금균등은 첫 달이 가장 크고 점점 준다', () => {
  const r = calcLoan(100_000_000, 5, 120, 'equal-principal', Y);
  assert.ok(r.firstPayment > r.lastPayment);
  near(r.schedule[0].principal, 100_000_000 / 120, 1, '매월 원금 동일');
});

test('대출 — 만기일시는 총이자 = 원금×월이자율×개월', () => {
  const P = 200_000_000, rate = 6, n = 24;
  const r = calcLoan(P, rate, n, 'bullet', Y);
  near(r.totalInterest, P * (rate / 100 / 12) * n, 100);
  assert.equal(r.schedule[n - 1].principal, P, '마지막 달에 원금 전액');
});

test('대출 — 같은 조건이면 총이자는 원금균등 < 원리금균등 < 만기일시', () => {
  const args = [200_000_000, 5, 120] as const;
  const ep = calcLoan(...args, 'equal-payment', Y).totalInterest;
  const pr = calcLoan(...args, 'equal-principal', Y).totalInterest;
  const bu = calcLoan(...args, 'bullet', Y).totalInterest;
  assert.ok(pr < ep, `원금균등(${pr}) < 원리금균등(${ep})`);
  assert.ok(ep < bu, `원리금균등(${ep}) < 만기일시(${bu})`);
});

// ─────────────────────────── 데이터 무결성 ───────────────────────────
test('요율 데이터 — 모든 항목이 source와 verifiedAt을 갖는다', () => {
  assert.ok(R.verifiedAt, 'verifiedAt 필수');
  for (const [name, v] of Object.entries(R.insurance)) {
    assert.ok((v as { source?: string }).source, `${name}에 source 필요`);
  }
  for (const key of ['incomeTax', 'nonTaxable', 'minimumWage', 'freelancer', 'unemployment',
    'severance', 'holidayPay', 'acquisitionTax', 'brokerageFee'] as const) {
    assert.ok((R[key] as { source?: string }).source, `${key}에 source 필요`);
  }
});

test('요율 데이터 — 없는 연도는 조용히 넘어가지 않고 실패한다', () => {
  assert.throws(() => getRates('1999'), /요율 데이터가 없는 연도/);
});

test('중개보수 요율표 — 구간이 오름차순이고 마지막은 무한대', () => {
  for (const tiers of [R.brokerageFee.sale, R.brokerageFee.lease]) {
    const ups = tiers.map(t => t.upTo);
    assert.equal(ups[ups.length - 1], null, '마지막 구간은 상한 없음');
    const finite = ups.slice(0, -1) as number[];
    for (let i = 1; i < finite.length; i++) {
      assert.ok(finite[i] > finite[i - 1], '구간이 오름차순이어야 함');
    }
  }
});
