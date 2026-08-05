// 가산수당 회귀 테스트.
//
// 급소는 **가산이 겹친다는 것**과 **휴일 8시간 경계**다. 사람들이 제일 많이 틀리는 지점이고,
// 우리가 틀리면 임금 체불 판단을 잘못 하게 만든다.
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { calcOvertimePay } from '../lib/calc/overtime';
import { latestYear } from '../lib/rates';

const Y = latestYear();
const W = 10_000;   // 통상시급 1만원 — 배율을 눈으로 검산하기 쉽게
const base = {
  year: Y, hourlyWage: W,
  overtimeHours: 0, overtimeNightHours: 0,
  holidayHours: 0, holidayNightHours: 0,
  employees: 5,
};

test('가산수당 — 평일 연장은 1.5배(제56조 ①)', () => {
  const r = calcOvertimePay({ ...base, overtimeHours: 10 });
  assert.equal(r.total, W * 10 * 1.5);
  assert.equal(r.extra, W * 10 * 0.5);
});

test('가산수당 — 야간에 한 연장은 2.0배다(가산이 겹친다)', () => {
  const r = calcOvertimePay({ ...base, overtimeHours: 4, overtimeNightHours: 4 });
  assert.equal(r.total, W * 4 * 2.0, '연장 50% + 야간 50%');
});

test('가산수당 — 연장 중 일부만 야간이면 나눠 계산한다', () => {
  const r = calcOvertimePay({ ...base, overtimeHours: 10, overtimeNightHours: 4 });
  // 주간 6h × 1.5 + 야간 4h × 2.0
  assert.equal(r.total, W * 6 * 1.5 + W * 4 * 2.0);
});

test('가산수당 — 휴일 8시간 이내는 1.5배, 초과는 2.0배(제56조 ②)', () => {
  const r = calcOvertimePay({ ...base, holidayHours: 10 });
  assert.equal(r.total, W * 8 * 1.5 + W * 2 * 2.0);
});

test('가산수당 — 휴일 8시간 초과분을 야간에 하면 2.5배로 가장 높다', () => {
  const r = calcOvertimePay({ ...base, holidayHours: 10, holidayNightHours: 2 });
  // 야간 2h는 초과분에 먼저 배분 → 8h×1.5 + 2h×2.5
  assert.equal(r.total, W * 8 * 1.5 + W * 2 * 2.5);
  const top = r.lines.find(l => l.key === 'hol-over-night')!;
  assert.equal(top.multiplier, 2.5);
});

test('가산수당 — 야간 시간은 가산율이 높은 초과분에 먼저 배분한다', () => {
  const r = calcOvertimePay({ ...base, holidayHours: 10, holidayNightHours: 3 });
  // 초과 2h 전부 야간(2.5배) + 이내 1h 야간(2.0배) + 이내 7h 주간(1.5배)
  assert.equal(r.total, W * 7 * 1.5 + W * 1 * 2.0 + W * 2 * 2.5);
});

test('가산수당 — 5인 미만 사업장은 가산 의무가 없다(제11조 ①)', () => {
  const small = calcOvertimePay({ ...base, overtimeHours: 10, overtimeNightHours: 5, employees: 4 });
  assert.equal(small.applies, false);
  assert.equal(small.total, W * 10, '일한 시간만큼 통상임금만');
  assert.equal(small.extra, 0);

  const ok = calcOvertimePay({ ...base, overtimeHours: 10, overtimeNightHours: 5, employees: 5 });
  assert.equal(ok.applies, true);
  assert.ok(ok.total > small.total);
});

test('가산수당 — 야간 시간이 전체 시간을 넘으면 전체로 자른다', () => {
  const r = calcOvertimePay({ ...base, overtimeHours: 3, overtimeNightHours: 99 });
  assert.equal(r.total, W * 3 * 2.0);
  assert.equal(r.totalHours, 3);
});

test('가산수당 — 근로가 없으면 0이고 터지지 않는다', () => {
  const r = calcOvertimePay({ ...base });
  assert.equal(r.total, 0);
  assert.equal(r.lines.length, 0);
});

test('가산수당 — 데이터가 없는 연도는 조용히 넘어가지 않고 실패한다', () => {
  assert.throws(() => calcOvertimePay({ ...base, year: '2024', overtimeHours: 1 }), /2024/);
});
