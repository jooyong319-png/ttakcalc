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
import { calcCarTax, calcPropertyTax } from '../lib/calc/localTax';
import { calcComprehensiveTax, calcYearEnd, calcParentalLeave } from '../lib/calc/income';
import { calcReverseSalary, calcEmployerCost, calcEmploymentCompare } from '../lib/calc/compare';
import { calcExchange, parseCurUnit } from '../lib/exchange';
import { calcArea, calcVat, calcPercent, calcCompound } from '../lib/calc/basic';
import { CATEGORIES, allCalcHrefs } from '../lib/catalog';
import {
  calcAnnualLeave, calcGiftTax, calcCarAcquisitionTax,
  calcRentConversion, calcComprehensivePropertyTax, calcTransferTax,
} from '../lib/calc/extra';
import { getRates, latestYear, availableYears } from '../lib/rates';
import { pct } from '../lib/format';

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

// ─────────── 전 연도 무결성 ───────────
// 연도별 데이터를 보관하는 게 이 사이트의 차별점이라, 과거 연도가 조용히 깨지면 차별점이 거짓말이 된다.
// 아래는 "연도를 추가할 때 자동으로 같이 검사되는" 안전망이다.
test('전 연도 — 필수 필드와 source가 빠진 연도가 없다', () => {
  const years = availableYears();
  assert.ok(years.length >= 2, '연도 비교가 가능하려면 최소 2개 필요');
  for (const y of years) {
    const r = getRates(y);
    assert.match(r.verifiedAt, /^\d{4}-\d{2}-\d{2}$/, `${y}: verifiedAt 형식`);
    for (const [name, v] of Object.entries(r.insurance)) {
      assert.ok((v as { source?: string }).source, `${y}/${name}에 source 필요`);
    }
    for (const key of ['incomeTax', 'nonTaxable', 'minimumWage', 'freelancer', 'unemployment',
      'severance', 'holidayPay', 'acquisitionTax', 'brokerageFee'] as const) {
      assert.ok((r[key] as { source?: string }).source, `${y}/${key}에 source 필요`);
    }
  }
});

test('전 연도 — 실업급여 상한이 하한보다 크다', () => {
  for (const y of availableYears()) {
    const r = getRates(y);
    const lower = Math.floor(
      r.minimumWage.hourly * r.unemployment.lowerBoundRateOfMinimumWage * r.unemployment.dailyWorkHours);
    assert.ok(r.unemployment.dailyMax > lower,
      `${y}: 상한 ${r.unemployment.dailyMax} > 하한 ${lower} 이어야 한다(최저임금만 올리고 상한 갱신을 빠뜨리면 여기서 걸린다)`);
  }
});

test('전 연도 — 최저임금은 해가 갈수록 오른다(연도 뒤바뀜·오타 감지)', () => {
  // availableYears()는 UI용이라 내림차순 — 여기서는 시간순으로 뒤집어 비교한다
  const years = availableYears().slice().reverse();
  for (let i = 1; i < years.length; i++) {
    const prev = getRates(years[i - 1]).minimumWage.hourly;
    const cur = getRates(years[i]).minimumWage.hourly;
    assert.ok(cur > prev, `${years[i]} 최저시급 ${cur} > ${years[i - 1]} ${prev}`);
  }
});

test('전 연도 — 국민연금 기준소득월액 하한 < 상한', () => {
  for (const y of availableYears()) {
    const np = getRates(y).insurance.nationalPension;
    assert.ok(np.monthlyIncomeMin < np.monthlyIncomeMax, `${y}: 하한 < 상한`);
  }
});

test('전 연도 — 소득세 구간이 오름차순이고 마지막은 무한대', () => {
  for (const y of availableYears()) {
    const b = getRates(y).incomeTax.brackets;
    assert.equal(b[b.length - 1].upTo, null, `${y}: 마지막 구간은 상한 없음`);
    const finite = b.slice(0, -1).map(x => x.upTo) as number[];
    for (let i = 1; i < finite.length; i++) {
      assert.ok(finite[i] > finite[i - 1], `${y}: 구간 오름차순`);
    }
  }
});

// 같은 연봉이라도 연도가 다르면 실수령액이 달라야 한다 — 연도 선택이 실제로 동작한다는 증거
test('연도별 계산 — 2025년과 2026년의 실수령액이 다르다', () => {
  const a = calcSalary({ annualSalary: 50_000_000, dependents: 1, childrenUnder20: 0, monthlyNonTaxable: 200_000, year: '2025' });
  const b = calcSalary({ annualSalary: 50_000_000, dependents: 1, childrenUnder20: 0, monthlyNonTaxable: 200_000, year: '2026' });
  assert.notEqual(a.monthlyNet, b.monthlyNet, '요율이 바뀌었으므로 실수령액도 달라야 한다');
});

// ─────────── 취득세 부가세목 (2026-07-31 조문 확인) ───────────
// 다주택 중과가 걸리면 지방교육세·농어촌특별세도 표준세율과 다른 산식을 쓴다.
// 이걸 놓쳐서 한동안 표준세율 공식을 그대로 쓰고 있었다 — 다시는 조용히 되돌아가지 않게 못 박는다.
test('취득세 — 1주택 지방교육세는 취득세율의 1/10 (지방세법 151조 단서)', () => {
  const p = 500_000_000;   // 6억 이하 → 취득세 1%
  const r = calcAcquisitionTax({ year: Y, price: p, areaSqm: 84, houseCount: 1, regulated: false });
  assert.equal(r.acquisitionTax, p * 0.01, '취득세 1%');
  assert.equal(r.localEduTax, p * 0.001, '지방교육세 0.1% = 1%의 1/10');
  assert.equal(r.ruralTax, 0, '85㎡ 이하는 농특세 없음');
});

test('취득세 — 85㎡ 초과 1주택은 농특세 0.2%', () => {
  const p = 500_000_000;
  const r = calcAcquisitionTax({ year: Y, price: p, areaSqm: 110, houseCount: 1, regulated: false });
  assert.equal(r.ruralTax, p * 0.002);
});

test('취득세 — 조정대상지역 2주택: 8% + 지방교육세 0.4% + 농특세 0.6%', () => {
  const p = 500_000_000;
  const r = calcAcquisitionTax({ year: Y, price: p, areaSqm: 110, houseCount: 2, regulated: true });
  assert.equal(r.acquisitionTax, p * 0.08, '중과 8%');
  assert.equal(r.localEduTax, p * 0.004, '지방교육세 0.4% (4%−2%)×20%');
  assert.equal(r.ruralTax, p * 0.006, '농특세 0.6% (2%+4%)×10%');
  near(r.effectiveRate, 0.09, 0.0001, '실효세율 9%');
});

test('취득세 — 3주택 이상: 12% + 지방교육세 0.4% + 농특세 1.0%', () => {
  const p = 500_000_000;
  const r = calcAcquisitionTax({ year: Y, price: p, areaSqm: 110, houseCount: 3, regulated: false });
  assert.equal(r.acquisitionTax, p * 0.12, '중과 12%');
  assert.equal(r.localEduTax, p * 0.004, '지방교육세는 중과 단계와 무관하게 0.4%');
  assert.equal(r.ruralTax, p * 0.010, '농특세 1.0% (2%+8%)×10%');
});

test('취득세 — 중과 시 부가세목이 표준세율 공식으로 되돌아가지 않는다', () => {
  const p = 500_000_000;
  const std = calcAcquisitionTax({ year: Y, price: p, areaSqm: 110, houseCount: 1, regulated: false });
  const heavy = calcAcquisitionTax({ year: Y, price: p, areaSqm: 110, houseCount: 3, regulated: false });
  assert.ok(heavy.localEduTax > std.localEduTax, '중과 지방교육세 > 표준 지방교육세');
  assert.ok(heavy.ruralTax > std.ruralTax, '중과 농특세 > 표준 농특세');
});

test('전 연도 — 취득세 중과 부가세율이 모든 연도에 있다', () => {
  for (const y of availableYears()) {
    const m = getRates(y).acquisitionTax.multiHouse;
    assert.equal(m.localEduRate, 0.004, `${y}: 지방교육세 0.4%`);
    assert.equal(m.ruralTaxRateTwo, 0.006, `${y}: 8% 중과 농특세 0.6%`);
    assert.equal(m.ruralTaxRateThree, 0.010, `${y}: 12% 중과 농특세 1.0%`);
    assert.ok(m.localEduBasis && m.ruralTaxBasis, `${y}: 조문 근거 문자열 필요`);
  }
});

// ─────────────────────────── 자동차세 ───────────────────────────
test('자동차세 — 배기량 구간 경계에서 cc당 세액이 뛴다', () => {
  const at = (cc: number) => calcCarTax({ year: Y, cc, ageYears: 1, business: false });
  assert.equal(at(1000).perCc, 80, '1,000cc 이하');
  assert.equal(at(1001).perCc, 140, '1,000cc 초과');
  assert.equal(at(1600).perCc, 140, '1,600cc 이하');
  assert.equal(at(1601).perCc, 200, '1,600cc 초과');
});

test('자동차세 — 2000cc 차령 1년: 자동차세 40만원 + 지방교육세 30%', () => {
  const r = calcCarTax({ year: Y, cc: 2000, ageYears: 1, business: false });
  assert.equal(r.baseTax, 400_000, '2000cc × 200원');
  assert.equal(r.ageDiscount, 0, '차령 2년 이하는 경감 없음');
  assert.equal(r.localEduTax, 120_000, '자동차세의 30%');
  assert.equal(r.total, 520_000);
});

test('자동차세 — 차령 경감은 3년째 5%, 12년째 50%에서 멈춘다', () => {
  const at = (ageYears: number) => calcCarTax({ year: Y, cc: 2000, ageYears, business: false });
  assert.equal(at(2).ageDiscountRate, 0);
  near(at(3).ageDiscountRate, 0.05, 1e-9, '3년째 5%');
  near(at(12).ageDiscountRate, 0.50, 1e-9, '12년째 50%');
  near(at(20).ageDiscountRate, 0.50, 1e-9, '12년 초과도 50%에서 멈춤');
});

test('자동차세 — 영업용은 차령 경감·지방교육세가 없다', () => {
  const r = calcCarTax({ year: Y, cc: 2000, ageYears: 10, business: true });
  assert.equal(r.ageDiscount, 0);
  assert.equal(r.localEduTax, 0);
});

test('자동차세 — 연납은 일찍 신청할수록 할인이 크다', () => {
  const r = calcCarTax({ year: Y, cc: 2000, ageYears: 3, business: false });
  const [jan, mar, jun] = r.prepayments;
  assert.ok(jan.discount > mar.discount && mar.discount > jun.discount, '1월 > 3월 > 6월');
  near(jan.discount, r.total * (334 / 365) * 0.05, 20, '1월 공제액 = 연세액 × 334/365 × 5%');
});

// ─────────────────────────── 재산세 ───────────────────────────
test('재산세 — 1세대 1주택은 공정시장가액비율이 43~45%로 낮다', () => {
  const at = (p: number) =>
    calcPropertyTax({ year: Y, publicPrice: p, oneHouse: true, urbanArea: true }).fairMarketRatio;
  assert.equal(at(300_000_000), 0.43, '3억 이하');
  assert.equal(at(500_000_000), 0.44, '3~6억');
  assert.equal(at(700_000_000), 0.45, '6억 초과');
  const std = calcPropertyTax({ year: Y, publicPrice: 500_000_000, oneHouse: false, urbanArea: true });
  assert.equal(std.fairMarketRatio, 0.60, '그 밖의 주택은 60%');
});

test('재산세 — 1세대 1주택 특례세율은 공시가격 9억 이하만', () => {
  const under = calcPropertyTax({ year: Y, publicPrice: 900_000_000, oneHouse: true, urbanArea: true });
  const over = calcPropertyTax({ year: Y, publicPrice: 900_000_001, oneHouse: true, urbanArea: true });
  assert.equal(under.specialRateApplied, true);
  assert.equal(over.specialRateApplied, false, '9억 초과는 표준세율');
});

test('재산세 — 공시가격 4억 1세대1주택 과세표준·세액', () => {
  const r = calcPropertyTax({ year: Y, publicPrice: 400_000_000, oneHouse: true, urbanArea: true });
  assert.equal(r.taxBase, 176_000_000, '4억 × 44%');
  assert.equal(r.propertyTax, 172_000, '12만원 + (1.76억−1.5억)×0.2%');
  assert.equal(r.urbanAreaTax, 246_400, '과세표준 × 0.14%');
  assert.equal(r.localEduTax, 34_400, '재산세의 20%');
  assert.equal(r.total, 452_800);
});

test('재산세 — 1세대 1주택이 아니면 항상 더 많다', () => {
  for (const p of [200_000_000, 500_000_000, 900_000_000, 1_200_000_000]) {
    const one = calcPropertyTax({ year: Y, publicPrice: p, oneHouse: true, urbanArea: true });
    const multi = calcPropertyTax({ year: Y, publicPrice: p, oneHouse: false, urbanArea: true });
    assert.ok(multi.total > one.total, `공시가격 ${p}: 그 밖의 주택 > 1세대 1주택`);
  }
});

// ─────────────────────────── 종합소득세 ───────────────────────────
test('종합소득세 — 3.3% 기납부보다 결정세액이 적으면 환급', () => {
  const r = calcComprehensiveTax({
    year: Y, revenue: 40_000_000, expenseRatePercent: 64.1,
    dependents: 1, otherDeduction: 0, withheldTax: 1_200_000,
  });
  assert.equal(r.expense, 25_640_000, '4천만 × 64.1% (부동소수점 오차 없이)');
  assert.equal(r.income, 40_000_000 - r.expense);
  assert.equal(r.taxBase, r.income - 1_500_000);
  assert.equal(r.refund, true, '경비율이 높아 환급');
  assert.equal(r.balance, r.finalTax - 1_200_000);
});

test('종합소득세 — 경비율이 낮으면 추가 납부로 뒤집힌다', () => {
  const base = { year: Y, revenue: 60_000_000, dependents: 1, otherDeduction: 0, withheldTax: 1_800_000 };
  const high = calcComprehensiveTax({ ...base, expenseRatePercent: 80 });
  const low = calcComprehensiveTax({ ...base, expenseRatePercent: 20 });
  assert.equal(high.refund, true);
  assert.equal(low.refund, false);
  assert.ok(low.finalTax > high.finalTax);
});

// ─────────────────────────── 연말정산 ───────────────────────────
test('연말정산 — 특별공제를 넣지 않으면 표준세액공제 13만원', () => {
  const base = {
    year: Y, grossSalary: 50_000_000, dependents: 1, childrenUnder20: 0,
    insurancePaid: 4_500_000, withheldTax: 1_400_000,
  };
  const std = calcYearEnd({ ...base, specialDeduction: 0 });
  const special = calcYearEnd({ ...base, specialDeduction: 3_000_000 });
  assert.equal(std.usedStandardCredit, true);
  assert.equal(special.usedStandardCredit, false);
  assert.ok(special.finalTax < std.finalTax, '특별공제 300만원이 표준공제보다 유리');
});

test('연말정산 — 기납부세액이 결정세액보다 많으면 환급', () => {
  const r = calcYearEnd({
    year: Y, grossSalary: 50_000_000, dependents: 1, childrenUnder20: 0,
    insurancePaid: 4_500_000, withheldTax: 5_000_000, specialDeduction: 0,
  });
  assert.equal(r.refund, true);
  assert.equal(Math.abs(r.balance), 5_000_000 - r.finalTax);
});

// 같은 조건이면 두 계산 경로가 크게 어긋나면 안 된다(한쪽만 고치는 실수 감지)
test('연말정산 — 결정세액이 연봉 계산기의 연간 소득세와 일치한다', () => {
  const gross = 50_000_000;
  const salary = calcSalary({
    annualSalary: gross, year: Y, dependents: 1, childrenUnder20: 0, monthlyNonTaxable: 0,
  });
  const annualFromSalary = salary.deductions.find(d => d.key === 'incomeTax')!.amount * 12;
  const insurance = salary.deductions
    .filter(d => ['nationalPension', 'healthInsurance', 'longTermCare', 'employmentInsurance'].includes(d.key))
    .reduce((a, d) => a + d.amount, 0) * 12;
  const ye = calcYearEnd({
    year: Y, grossSalary: gross, dependents: 1, childrenUnder20: 0,
    insurancePaid: insurance, withheldTax: 0, specialDeduction: 0,
  });
  near(ye.finalTax, annualFromSalary, 200, '두 경로의 연간 소득세');
});

// ─────────────────────────── 육아휴직급여 ───────────────────────────
test('육아휴직급여 — 구간별 상한(250/200/160만원)이 적용된다', () => {
  const r = calcParentalLeave(4_000_000, 12, Y);
  assert.equal(r.months[0].benefit, 2_500_000, '1개월째 상한 250만');
  assert.equal(r.months[3].benefit, 2_000_000, '4개월째 상한 200만');
  assert.equal(r.months[6].benefit, 1_600_000, '7개월째 상한 160만');
  assert.equal(r.total, 2_500_000 * 3 + 2_000_000 * 3 + 1_600_000 * 6);
});

test('육아휴직급여 — 7개월째부터 통상임금의 80%', () => {
  const r = calcParentalLeave(1_500_000, 12, Y);
  assert.equal(r.months[0].benefit, 1_500_000, '1~6개월은 100%');
  assert.equal(r.months[6].benefit, 1_200_000, '7개월째부터 80%');
});

test('육아휴직급여 — 하한 70만원', () => {
  const r = calcParentalLeave(500_000, 12, Y);
  assert.ok(r.months.every(m => m.benefit === 700_000), '전 구간 하한 적용');
});

test('육아휴직급여 — 데이터 없는 연도는 조용히 넘어가지 않는다', () => {
  assert.throws(() => calcParentalLeave(3_000_000, 12, '2024'), /육아휴직급여 데이터가 없는 연도/);
});

// ─────────────── 새 항목의 전 연도 무결성 ───────────────
test('전 연도 — 자동차세·재산세 데이터와 source가 모든 연도에 있다', () => {
  for (const y of availableYears()) {
    const r = getRates(y);
    assert.ok(r.carTax.source, `${y}: carTax.source`);
    assert.ok(r.propertyTax.source, `${y}: propertyTax.source`);
    assert.equal(r.carTax.private.length, 3, `${y}: 비영업용 승용 3구간`);
    assert.equal(
      r.propertyTax.brackets[r.propertyTax.brackets.length - 1].upTo, null,
      `${y}: 재산세 마지막 구간은 상한 없음`);
  }
});

// 표기 헬퍼 — 실제로 40%가 4%로 표시되던 버그가 있었다(정수부의 0까지 잘림)
test('pct — 소수점 뒤의 0만 자른다', () => {
  assert.equal(pct(0.4, 0), '40%');
  assert.equal(pct(0.5, 0), '50%');
  assert.equal(pct(0.05, 0), '5%');
  assert.equal(pct(0.09, 2), '9%');
  assert.equal(pct(0.0183, 2), '1.83%');
  assert.equal(pct(0.1314, 2), '13.14%');
  assert.equal(pct(0.1, 1), '10%');
});

// ─────────────────────── 역산 (실수령액 → 연봉) ───────────────────────
// 정방향 계산기와 같은 함수를 뒤집으므로, 왕복이 어긋나면 둘 중 하나가 깨진 것이다.
test('역산 — 되짚은 연봉으로 정방향 계산하면 목표 실수령액이 나온다', () => {
  for (const target of [2_000_000, 3_000_000, 4_500_000, 6_000_000]) {
    const r = calcReverseSalary({
      year: Y, targetNet: target, dependents: 1, childrenUnder20: 0, monthlyNonTaxable: 200_000,
    });
    assert.ok(r.actual.monthlyNet >= target, `목표 ${target}에 모자라면 안 된다 (${r.actual.monthlyNet})`);
    // 연봉 만원 단위 올림 → 월 실수령 차이는 만원/12 보다 작아야 한다
    assert.ok(r.gap < 10_000 / 12 + 100, `올림 오차가 과도하다: ${r.gap}`);
  }
});

test('역산 — 연봉은 만원 단위로 떨어진다', () => {
  const r = calcReverseSalary({
    year: Y, targetNet: 3_333_333, dependents: 2, childrenUnder20: 1, monthlyNonTaxable: 200_000,
  });
  assert.equal(r.annualSalary % 10_000, 0);
});

test('역산 — 부양가족이 늘면 필요한 연봉이 줄어든다', () => {
  const at = (dependents: number) => calcReverseSalary({
    year: Y, targetNet: 3_000_000, dependents, childrenUnder20: 0, monthlyNonTaxable: 200_000,
  }).annualSalary;
  assert.ok(at(4) < at(1), '부양가족 4명 < 1명');
});

test('역산 — 목표가 클수록 필요한 연봉도 크다(단조성)', () => {
  const at = (targetNet: number) => calcReverseSalary({
    year: Y, targetNet, dependents: 1, childrenUnder20: 0, monthlyNonTaxable: 200_000,
  }).annualSalary;
  let prev = 0;
  for (const t of [1_500_000, 2_000_000, 3_000_000, 5_000_000, 7_000_000]) {
    const v = at(t);
    assert.ok(v > prev, `${t}: ${v} > ${prev}`);
    prev = v;
  }
});

// ─────────────────────── 사업주 부담 ───────────────────────
test('사업주 부담 — 국민연금·건강보험은 근로자와 같은 요율', () => {
  const r = calcEmployerCost({
    year: Y, monthlySalary: 3_000_000, monthlyNonTaxable: 0,
    stabilityTierIndex: 0, accidentRatePercent: 0.7,
  });
  const base = 3_000_000;
  const pension = r.items.find(it => it.key === 'nationalPension')!.amount;
  const health = r.items.find(it => it.key === 'healthInsurance')!.amount;
  assert.equal(pension, Math.floor(base * R.insurance.nationalPension.employeeRate / 10) * 10);
  assert.equal(health, Math.floor(base * R.insurance.healthInsurance.employeeRate / 10) * 10);
});

test('사업주 부담 — 고용안정 요율은 사업 규모에 따라 커진다', () => {
  const at = (idx: number) => calcEmployerCost({
    year: Y, monthlySalary: 3_000_000, monthlyNonTaxable: 0,
    stabilityTierIndex: idx, accidentRatePercent: 0.7,
  }).items.find(it => it.key === 'stability')!.amount;
  assert.ok(at(0) < at(1) && at(1) < at(2) && at(2) < at(3), '150인 미만 < ... < 1000인 이상');
});

test('사업주 부담 — 실제 인건비는 급여보다 항상 크고, 직원 실수령액보다 크다', () => {
  const r = calcEmployerCost({
    year: Y, monthlySalary: 3_000_000, monthlyNonTaxable: 200_000,
    stabilityTierIndex: 0, accidentRatePercent: 0.7,
  });
  assert.ok(r.totalCost > 3_000_000, '급여 < 실제 인건비');
  assert.ok(r.employeeNet < 3_000_000, '실수령액 < 급여');
  assert.ok(r.totalCost > r.employeeNet, '회사가 쓰는 돈 > 직원이 받는 돈');
  // 부담률은 "과세 급여 기준 보험료 ÷ 총급여"라 비과세가 클수록 낮아진다.
  // 비과세 20만원이면 약 10%, 비과세 0이면 약 10.7%.
  assert.ok(r.overheadRate > 0.08 && r.overheadRate < 0.3, `부담률이 상식 범위여야 한다: ${r.overheadRate}`);
  const noNonTaxable = calcEmployerCost({
    year: Y, monthlySalary: 3_000_000, monthlyNonTaxable: 0,
    stabilityTierIndex: 0, accidentRatePercent: 0.7,
  });
  assert.ok(noNonTaxable.overheadRate > r.overheadRate, '비과세가 없으면 부담률이 높다');
});

test('사업주 부담 — 산재보험료율 0%면 산재 항목도 0', () => {
  const r = calcEmployerCost({
    year: Y, monthlySalary: 3_000_000, monthlyNonTaxable: 0,
    stabilityTierIndex: 0, accidentRatePercent: 0,
  });
  assert.equal(r.items.find(it => it.key === 'accident')!.amount, 0);
});

// ─────────────────────── 정규직 vs 프리랜서 ───────────────────────
test('비교 — 같은 금액이면 프리랜서 실수령액이 더 크다(4대보험이 빠지므로)', () => {
  const r = calcEmploymentCompare(3_000_000, Y, 200_000);
  assert.ok(r.freelancer.net > r.employee.net);
  assert.equal(r.monthlyDiff, r.freelancer.net - r.employee.net);
  assert.equal(r.annualDiff, r.monthlyDiff * 12);
});

test('비교 — 프리랜서 공제는 항상 정확히 3.3%', () => {
  for (const amount of [1_000_000, 3_000_000, 10_000_000]) {
    const r = calcEmploymentCompare(amount, Y, 200_000);
    near(r.freelancer.deductionRate, 0.033, 0.0001, `${amount}원`);
  }
});

test('비교 — 고소득 구간에서는 격차가 벌어진다(정규직 누진세)', () => {
  const low = calcEmploymentCompare(2_000_000, Y, 200_000);
  const high = calcEmploymentCompare(10_000_000, Y, 200_000);
  assert.ok(high.employee.deductionRate > low.employee.deductionRate, '정규직 공제율은 누진');
  assert.ok(high.monthlyDiff > low.monthlyDiff, '금액이 클수록 차액도 크다');
});

// ─────────────── 사업주 요율 데이터 무결성 ───────────────
test('전 연도 — 사업주 부담 요율 데이터가 모든 연도에 있다', () => {
  for (const y of availableYears()) {
    const e = getRates(y).employer;
    assert.ok(e.source, `${y}: employer.source`);
    assert.equal(e.employmentStability.length, 4, `${y}: 고용안정 4구간`);
    const rates = e.employmentStability.map(t => t.rate);
    for (let i = 1; i < rates.length; i++) {
      assert.ok(rates[i] > rates[i - 1], `${y}: 규모가 클수록 요율이 높아야 한다`);
    }
  }
});

// ─────────────────────── 환전 ───────────────────────
test('환전 — 우대율이 스프레드를 깎는다', () => {
  const rate = { code: 'USD', name: '미국 달러', unit: 1, base: 1400, ttb: 1386, tts: 1414 };
  const none = calcExchange({ amount: 1000, rate, direction: 'buy', spreadPercent: 1.75, preferentialPercent: 0 });
  const p90 = calcExchange({ amount: 1000, rate, direction: 'buy', spreadPercent: 1.75, preferentialPercent: 90 });
  const full = calcExchange({ amount: 1000, rate, direction: 'buy', spreadPercent: 1.75, preferentialPercent: 100 });
  near(none.appliedRate, 1400 * 1.0175, 0.001, '우대 없음');
  near(p90.appliedRate, 1400 * (1 + 0.0175 * 0.1), 0.001, '90% 우대');
  assert.equal(full.appliedRate, 1400, '100% 우대면 매매기준율');
  assert.equal(full.cost, 0);
});

test('환전 — 살 때는 기준율보다 비싸고, 팔 때는 싸다', () => {
  const rate = { code: 'USD', name: '미국 달러', unit: 1, base: 1400, ttb: 1386, tts: 1414 };
  const buy = calcExchange({ amount: 1000, rate, direction: 'buy', spreadPercent: 1.75, preferentialPercent: 0 });
  const sell = calcExchange({ amount: 1000, rate, direction: 'sell', spreadPercent: 1.75, preferentialPercent: 0 });
  assert.ok(buy.appliedRate > 1400 && sell.appliedRate < 1400);
  assert.ok(buy.krw > buy.krwAtBase, '살 때는 더 낸다');
  assert.ok(sell.krw < sell.krwAtBase, '팔 때는 덜 받는다');
});

test('환전 — 100단위로 고시되는 통화(엔)는 단위를 나눈다', () => {
  const jpy = { code: 'JPY', name: '일본 옌', unit: 100, base: 950, ttb: 940, tts: 960 };
  const r = calcExchange({ amount: 10_000, rate: jpy, direction: 'buy', spreadPercent: 0, preferentialPercent: 0 });
  assert.equal(r.krw, 95_000, '10,000엔 × (950원/100엔)');
});

test('환전 — cur_unit 파싱', () => {
  assert.deepEqual(parseCurUnit('USD'), { code: 'USD', unit: 1 });
  assert.deepEqual(parseCurUnit('JPY(100)'), { code: 'JPY', unit: 100 });
  assert.deepEqual(parseCurUnit('IDR(100)'), { code: 'IDR', unit: 100 });
});

// ─────────────────────── 평 ↔ ㎡ ───────────────────────
test('평㎡ — 1평 = 400/121 ㎡, 왕복 변환이 일치한다', () => {
  const a = calcArea(1, 'pyeong', Y);
  near(a.sqm, 3.31, 0.01, '1평');
  const back = calcArea(a.sqm, 'sqm', Y);
  near(back.pyeong, 1, 0.01, '왕복');
});

test('평㎡ — 84㎡는 85㎡ 이하, 85.1㎡는 초과(취득세 농특세 경계)', () => {
  assert.equal(calcArea(84, 'sqm', Y).overNationalHousingSize, false);
  assert.equal(calcArea(85, 'sqm', Y).overNationalHousingSize, false);
  assert.equal(calcArea(85.1, 'sqm', Y).overNationalHousingSize, true);
});

test('평㎡ — 84㎡는 약 25.4평', () => {
  near(calcArea(84, 'sqm', Y).pyeong, 25.41, 0.01);
});

// ─────────────────────── 부가가치세 ───────────────────────
test('부가세 — 공급가액 100만원이면 합계 110만원', () => {
  const r = calcVat(1_000_000, 'supply', Y);
  assert.equal(r.vat, 100_000);
  assert.equal(r.total, 1_100_000);
});

// 합계에서 10%를 빼면 틀린다 — 1.1로 나눠야 한다. 이 실수가 흔해서 못 박는다.
test('부가세 — 합계 110만원에서 되짚으면 공급가액 100만원(99만원 아님)', () => {
  const r = calcVat(1_100_000, 'total', Y);
  assert.equal(r.supply, 1_000_000);
  assert.equal(r.vat, 100_000);
  assert.notEqual(r.supply, 990_000);
});

test('부가세 — 양방향 왕복이 일치한다', () => {
  for (const a of [10_000, 333_333, 1_234_567]) {
    const up = calcVat(a, 'supply', Y);
    const down = calcVat(up.total, 'total', Y);
    near(down.supply, a, 1, `${a}원 왕복`);
  }
});

// ─────────────────────── 퍼센트 ───────────────────────
test('퍼센트 — A의 B%', () => {
  assert.equal(calcPercent(3_000_000, 15, 'of').answer, 450_000);
});

test('퍼센트 — 증감률', () => {
  assert.equal(calcPercent(100, 130, 'change').answer, 30);
  assert.equal(calcPercent(100, 70, 'change').answer, -30);
  near(calcPercent(3, 4, 'change').answer, 33.33, 0.01, '3%→4%는 33.3% 증가(1%p와 다름)');
});

test('퍼센트 — 비율', () => {
  assert.equal(calcPercent(25, 200, 'ratio').answer, 12.5);
});

// 0으로 나누면 Infinity가 나온다 — 화면에 Infinity%를 찍지 않는다
test('퍼센트 — 0으로 나누는 경우를 방어한다', () => {
  const change = calcPercent(0, 100, 'change');
  const ratio = calcPercent(50, 0, 'ratio');
  assert.ok(Number.isFinite(change.answer), '증감률이 Infinity가 아니어야 한다');
  assert.ok(Number.isFinite(ratio.answer), '비율이 Infinity가 아니어야 한다');
});

// ─────────────────────── 복리 ───────────────────────
test('복리 — 이자소득세 15.4%가 적용된다', () => {
  const r = calcCompound({
    year: Y, principal: 10_000_000, annualRatePercent: 3.5, months: 12,
    method: 'simple', taxed: true,
  });
  assert.equal(r.interest, 350_000, '세전 이자');
  assert.equal(r.tax, 53_900, '350,000 × 15.4%');
  assert.equal(r.netInterest, 296_100);
  assert.equal(r.total, 10_296_100);
});

test('복리 — 비과세면 세금이 0', () => {
  const r = calcCompound({
    year: Y, principal: 10_000_000, annualRatePercent: 3.5, months: 12,
    method: 'simple', taxed: false,
  });
  assert.equal(r.tax, 0);
  assert.equal(r.netInterest, r.interest);
});

test('복리 — 월복리가 단리보다 이자가 많고, 기간이 길수록 격차가 벌어진다', () => {
  const at = (method: 'simple' | 'monthly', months: number) => calcCompound({
    year: Y, principal: 10_000_000, annualRatePercent: 5, months, method, taxed: false,
  }).interest;
  assert.ok(at('monthly', 12) > at('simple', 12), '1년');
  const gap1 = at('monthly', 12) - at('simple', 12);
  const gap5 = at('monthly', 60) - at('simple', 60);
  assert.ok(gap5 > gap1, '기간이 길수록 격차가 커진다');
});

// ─────────────────────── 카탈로그 무결성 ───────────────────────
// 홈·카테고리 허브·사이트맵이 전부 이 배열 하나를 본다. 여기가 깨지면 다 깨진다.
test('카탈로그 — 계산기 경로가 중복되지 않는다', () => {
  const hrefs = allCalcHrefs();
  assert.equal(new Set(hrefs).size, hrefs.length, '중복 경로 있음');
});

test('카탈로그 — 카테고리 slug와 tone이 유일하다', () => {
  const slugs = CATEGORIES.map(c => c.slug);
  assert.equal(new Set(slugs).size, slugs.length, 'slug 중복');
  const tones = CATEGORIES.map(c => c.tone);
  assert.equal(new Set(tones).size, tones.length, 'tone 중복 — 색으로 구분이 안 된다');
});

test('카탈로그 — 카테고리마다 대표 계산기가 최소 1개 있다', () => {
  for (const c of CATEGORIES) {
    assert.ok(c.calcs.length > 0, `${c.slug}: 계산기 없음`);
    assert.ok(c.calcs.some(x => x.featured), `${c.slug}: featured 없음 — 홈에 아무것도 안 나온다`);
  }
});

// ─────────────────────── 연차 유급휴가 ───────────────────────
test('연차 — 1년 미만은 1개월 개근당 1일, 최대 11일', () => {
  const at = (m: number) => calcAnnualLeave(0, 3_000_000, 0, Y, m).days;
  assert.equal(at(0), 0);
  assert.equal(at(5), 5);
  assert.equal(at(11), 11);
  assert.equal(at(12), 11, '11일이 한도');
});

// 근로기준법 제60조 제4항: 3년 이상부터 "최초 1년을 초과하는 계속근로 매 2년"에 1일
test('연차 — 근속연수별 발생일수', () => {
  const at = (y: number) => calcAnnualLeave(y, 3_000_000, 0, Y).days;
  assert.equal(at(1), 15, '1년');
  assert.equal(at(2), 15, '2년 — 아직 가산 없음');
  assert.equal(at(3), 16, '3년 — 첫 가산');
  assert.equal(at(5), 17, '5년');
  assert.equal(at(10), 19, '10년');
  assert.equal(at(21), 25, '21년 — 25일 도달');
  assert.equal(at(30), 25, '한도를 넘지 않는다');
});

test('연차 — 수당은 1일 통상임금 × 미사용일수', () => {
  const r = calcAnnualLeave(3, 3_135_000, 5, Y);   // 209시간 기준 시급 15,000원
  assert.equal(r.dailyWage, 120_000, '시급 15,000 × 8시간');
  assert.equal(r.unusedPay, 600_000, '120,000 × 5일');
});

test('연차 — 미사용일수가 발생일수를 넘을 수 없다', () => {
  const r = calcAnnualLeave(1, 3_000_000, 99, Y);
  assert.equal(r.unusedPay, r.dailyWage * 15, '15일까지만');
});

// ─────────────────────── 증여세 ───────────────────────
test('증여세 — 직계존속 5천만원까지는 세금 없음', () => {
  const r = calcGiftTax(50_000_000, 'lineal-ascendant', 0, true, Y);
  assert.equal(r.taxBase, 0);
  assert.equal(r.finalTax, 0);
});

test('증여세 — 부모에게 1억 5천 받으면', () => {
  const r = calcGiftTax(150_000_000, 'lineal-ascendant', 0, true, Y);
  assert.equal(r.deduction, 50_000_000);
  assert.equal(r.taxBase, 100_000_000, '1.5억 − 5천만');
  assert.equal(r.calculatedTax, 10_000_000, '1억 × 10%');
  assert.equal(r.filingCredit, 300_000, '산출세액 × 3%');
  assert.equal(r.finalTax, 9_700_000);
});

// 10년 합산이 이 세금의 핵심 함정이라 반드시 못 박는다
test('증여세 — 10년 내 이미 공제받았으면 한도가 줄어든다', () => {
  const fresh = calcGiftTax(100_000_000, 'lineal-ascendant', 0, true, Y);
  const used = calcGiftTax(100_000_000, 'lineal-ascendant', 50_000_000, true, Y);
  assert.equal(fresh.deduction, 50_000_000);
  assert.equal(used.deduction, 0, '이미 5천만원을 다 썼다');
  assert.ok(used.finalTax > fresh.finalTax);
});

test('증여세 — 배우자는 6억, 미성년 자녀는 2천만원', () => {
  assert.equal(calcGiftTax(600_000_000, 'spouse', 0, true, Y).finalTax, 0);
  assert.equal(calcGiftTax(20_000_000, 'lineal-ascendant-minor', 0, true, Y).finalTax, 0);
  assert.ok(calcGiftTax(50_000_000, 'lineal-ascendant-minor', 0, true, Y).finalTax > 0);
});

test('증여세 — 기한 내 신고 안 하면 3% 공제가 없다', () => {
  const filed = calcGiftTax(200_000_000, 'lineal-ascendant', 0, true, Y);
  const not = calcGiftTax(200_000_000, 'lineal-ascendant', 0, false, Y);
  assert.equal(not.filingCredit, 0);
  assert.ok(not.finalTax > filed.finalTax);
});

// ─────────────────────── 자동차 취득세 ───────────────────────
test('자동차 취득세 — 비영업용 승용 7%, 경차 4%, 이륜 2%', () => {
  assert.equal(calcCarAcquisitionTax(30_000_000, 'passenger', Y).tax, 2_100_000);
  assert.equal(calcCarAcquisitionTax(15_000_000, 'passenger-light', Y).tax, 600_000);
  assert.equal(calcCarAcquisitionTax(5_000_000, 'motorcycle', Y).tax, 100_000);
});

// ─────────────────────── 전월세 전환율 ───────────────────────
test('전월세 전환율 — 기준금리+2%와 연 10% 중 낮은 쪽', () => {
  const r = calcRentConversion(500_000_000, 100_000_000, Y);
  const c = R.rentConversion;
  const expected = Math.min(c.ceilingRate, c.bokBaseRate + c.baseRateSpread);
  near(r.legalRate, expected, 1e-9);
  assert.ok(r.legalRate < c.ceilingRate, '기준금리가 낮아 ②가 적용된다');
});

test('전월세 전환율 — 1억을 월세로 돌리면 상한 월세', () => {
  const r = calcRentConversion(500_000_000, 100_000_000, Y);
  // 기준금리 2.75% + 2% = 4.75% → 1억 × 4.75% ÷ 12
  near(r.maxMonthlyRent, 100_000_000 * 0.0475 / 12, 10);
  assert.equal(r.remainingDeposit, 400_000_000);
});

test('전월세 전환율 — 보증금보다 많이 전환할 수 없다', () => {
  const r = calcRentConversion(100_000_000, 999_000_000, Y);
  assert.equal(r.convertedDeposit, 100_000_000);
  assert.equal(r.remainingDeposit, 0);
});

// ─────────────────────── 종합부동산세 ───────────────────────
test('종부세 — 공제금액 이하면 과세 대상이 아니다', () => {
  const one = calcComprehensivePropertyTax(1_200_000_000, true, false, Y);
  const other = calcComprehensivePropertyTax(900_000_000, false, false, Y);
  assert.equal(one.exempt, true);
  assert.equal(one.total, 0);
  assert.equal(other.exempt, true);
});

test('종부세 — 1세대 1주택 공제 12억, 그 밖 9억', () => {
  const one = calcComprehensivePropertyTax(2_000_000_000, true, false, Y);
  const other = calcComprehensivePropertyTax(2_000_000_000, false, false, Y);
  assert.equal(one.deduction, 1_200_000_000);
  assert.equal(other.deduction, 900_000_000);
  assert.ok(other.total > one.total, '공제가 적으면 세금이 많다');
});

test('종부세 — 과세표준은 공제 후 금액 × 60%', () => {
  const r = calcComprehensivePropertyTax(2_000_000_000, true, false, Y);
  assert.equal(r.taxBase, Math.floor((2_000_000_000 - 1_200_000_000) * 0.6));
});

test('종부세 — 3주택 이상은 고구간에서 세율이 더 높다', () => {
  const two = calcComprehensivePropertyTax(5_000_000_000, false, false, Y);
  const three = calcComprehensivePropertyTax(5_000_000_000, false, true, Y);
  assert.ok(three.total > two.total);
});

test('종부세 — 농어촌특별세는 종부세의 20%', () => {
  const r = calcComprehensivePropertyTax(3_000_000_000, false, false, Y);
  assert.equal(r.ruralTax, Math.floor(r.tax * 0.2 / 10) * 10);
});

// ─────────────────────── 양도소득세 ───────────────────────
const TR = {
  year: Y, buyPrice: 500_000_000, expenses: 20_000_000,
  holdYears: 5, liveYears: 5, oneHouse: true, heavyHouseCount: 0 as const,
};

test('양도세 — 1세대 1주택 12억 이하는 전액 비과세', () => {
  const r = calcTransferTax({ ...TR, salePrice: 1_000_000_000 });
  assert.equal(r.fullyExempt, true);
  assert.equal(r.taxableRatio, 0);
  assert.equal(r.total, 0);
});

test('양도세 — 12억 초과분에 해당하는 양도차익만 과세', () => {
  const sale = 1_500_000_000;
  const r = calcTransferTax({ ...TR, salePrice: sale });
  near(r.taxableRatio, (sale - 1_200_000_000) / sale, 1e-9, '3억/15억 = 20%');
  assert.ok(r.total > 0);
});

test('양도세 — 1년 미만 보유는 70% 단일세율', () => {
  const r = calcTransferTax({ ...TR, salePrice: 2_000_000_000, oneHouse: false, holdYears: 0.5, liveYears: 0 });
  assert.ok(r.rateLabel.includes('70%'));
  assert.equal(r.longTermDeduction, 0, '3년 미만은 장특공제 없음');
});

test('양도세 — 보유가 길수록 장기보유특별공제가 커진다', () => {
  const at = (holdYears: number) =>
    calcTransferTax({ ...TR, salePrice: 2_000_000_000, oneHouse: false, holdYears, liveYears: 0 }).longTermRate;
  assert.equal(at(2), 0, '3년 미만');
  near(at(3), 0.06, 1e-9, '3년 6%');
  near(at(10), 0.20, 1e-9, '10년 20%');
  near(at(20), 0.30, 1e-9, '15년 이상 30% 한도');
});

test('양도세 — 1세대 1주택은 보유+거주로 최대 80%까지 공제', () => {
  const r = calcTransferTax({ ...TR, salePrice: 2_000_000_000, holdYears: 10, liveYears: 10 });
  near(r.longTermRate, 0.80, 1e-9, '보유 40% + 거주 40%');
});

test('양도세 — 거주 요건을 못 채우면 일반 표1이 적용된다', () => {
  const lived = calcTransferTax({ ...TR, salePrice: 2_000_000_000, holdYears: 10, liveYears: 10 });
  const not = calcTransferTax({ ...TR, salePrice: 2_000_000_000, holdYears: 10, liveYears: 1 });
  near(not.longTermRate, 0.20, 1e-9, '표1 10년 = 20%');
  assert.ok(not.total > lived.total);
});

// 2026-05-09에 다주택 중과 유예가 끝났다 — 연도별로 값이 달라야 한다
test('양도세 — 다주택 중과는 2026년부터 다시 적용된다', () => {
  assert.equal(getRates('2025').transferTax.heavySurcharge.twoHouse, 0, '2025년은 유예 중');
  assert.equal(getRates('2026').transferTax.heavySurcharge.twoHouse, 0.2, '2026년 재적용');

  const plain = calcTransferTax({ ...TR, salePrice: 2_000_000_000, oneHouse: false, heavyHouseCount: 0 });
  const heavy = calcTransferTax({ ...TR, salePrice: 2_000_000_000, oneHouse: false, heavyHouseCount: 3 });
  assert.ok(heavy.total > plain.total, '3주택 중과가 더 많다');
});

test('양도세 — 양도차익이 없으면 세금도 없다', () => {
  const r = calcTransferTax({ ...TR, salePrice: 400_000_000, oneHouse: false });
  assert.equal(r.gain, 0);
  assert.equal(r.total, 0);
});

// ─────────── 새 항목의 전 연도 무결성 ───────────
test('전 연도 — 새 계산기 6종 데이터와 source가 모든 연도에 있다', () => {
  for (const y of availableYears()) {
    const r = getRates(y);
    for (const key of ['annualLeave', 'giftTax', 'carAcquisitionTax',
      'rentConversion', 'comprehensivePropertyTax', 'transferTax'] as const) {
      assert.ok((r[key] as { source?: string }).source, `${y}/${key}에 source 필요`);
    }
    assert.equal(r.giftTax.brackets[r.giftTax.brackets.length - 1].upTo, null, `${y}: 증여세 마지막 구간`);
    assert.ok(r.rentConversion.bokBaseRate > 0, `${y}: 기준금리`);
  }
});
