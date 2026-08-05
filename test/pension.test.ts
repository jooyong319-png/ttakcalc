// 국민연금 노령연금 회귀 테스트.
//
// 급소는 세 군데다 — 20년 경계(가산이 시작된다), 10년 경계(수급권 자체가 생긴다),
// 조기·연기 조정. 값은 조문에서 직접 따라간 것이다.
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { calcPension } from '../lib/calc/pension';
import { latestYear, getRates } from '../lib/rates';

const Y = latestYear();
const P = getRates(Y).pension!;
const base = { year: Y, years: 25, monthlyIncome: 3_000_000, timing: 0, hasSpouse: false, dependents: 0 };

test('연금 — 10년 미만이면 수급권이 없다', () => {
  const r = calcPension({ ...base, years: 9 });
  assert.equal(r.eligible, false);
  assert.equal(r.monthly, 0);
  assert.match(r.steps[r.steps.length - 1].basis!, /반환일시금/);
});

test('연금 — 기본연금액은 1.29 × (A + B) ÷ 12 (20년 이하)', () => {
  const r = calcPension({ ...base, years: 20 });
  const expected = Math.floor((P.multiplier * (P.aValue + 3_000_000) / 12) / 10) * 10;
  assert.equal(r.basicMonthly, expected);
  assert.equal(r.oldAgeMonthly, expected, '20년이면 전액');
});

test('연금 — 20년 초과분은 1년당 5%씩 가산한다(제51조 ① 단서)', () => {
  const y20 = calcPension({ ...base, years: 20 });
  const y30 = calcPension({ ...base, years: 30 });
  // 10년 초과 → 1 + 0.05×10 = 1.5배
  assert.ok(Math.abs(y30.basicMonthly / y20.basicMonthly - 1.5) < 0.001);
});

test('연금 — 10~20년은 50%에서 1년당 5%씩 올라간다(제63조 ①2)', () => {
  const y10 = calcPension({ ...base, years: 10 });
  const y15 = calcPension({ ...base, years: 15 });
  const y20 = calcPension({ ...base, years: 20 });
  assert.ok(Math.abs(y10.oldAgeMonthly / y10.basicMonthly - 0.5) < 0.001, '10년 = 50%');
  assert.ok(Math.abs(y15.oldAgeMonthly / y15.basicMonthly - 0.75) < 0.001, '15년 = 75%');
  assert.ok(Math.abs(y20.oldAgeMonthly / y20.basicMonthly - 1.0) < 0.001, '20년 = 100%');
});

test('연금 — 조기수령은 1년당 6%씩 깎인다(제63조 ②)', () => {
  const normal = calcPension({ ...base });
  for (const { yearsEarly, rate } of P.earlyRates) {
    const early = calcPension({ ...base, timing: -yearsEarly });
    assert.ok(
      Math.abs(early.adjustedMonthly / normal.oldAgeMonthly - rate) < 0.001,
      `${yearsEarly}년 조기 = ${rate * 100}%`,
    );
  }
});

test('연금 — 연기수령은 1개월당 0.6%씩 붙고 5년이 한도다(제62조 ②)', () => {
  const normal = calcPension({ ...base });
  const defer5 = calcPension({ ...base, timing: 5 });
  assert.ok(Math.abs(defer5.timingRate - 1.36) < 1e-9, '5년 = +36%');
  assert.ok(defer5.adjustedMonthly > normal.oldAgeMonthly);
  const defer10 = calcPension({ ...base, timing: 10 });
  assert.equal(defer10.timingRate, defer5.timingRate, '5년을 넘겨도 더 붙지 않는다');
});

test('연금 — 부양가족연금은 조기·연기 조정을 받지 않는다', () => {
  const withDep = calcPension({ ...base, hasSpouse: true, dependents: 1, timing: -5 });
  const expected = Math.floor(((P.dependentSpouseAnnual + P.dependentChildAnnual) / 12) / 10) * 10;
  assert.equal(withDep.dependentMonthly, expected, '조기수령이어도 부양가족연금은 그대로');
});

test('연금 — 소득이 높을수록 소득대체율은 낮아진다(A값이 균등 부분이라)', () => {
  const low = calcPension({ ...base, monthlyIncome: 2_000_000 });
  const high = calcPension({ ...base, monthlyIncome: 6_000_000 });
  assert.ok(low.replacementRate > high.replacementRate,
    `저소득 ${low.replacementRate} > 고소득 ${high.replacementRate} 이어야 한다`);
});

test('연금 — 가입기간이 길수록 수령액은 단조증가한다', () => {
  let prev = -1;
  for (const y of [10, 15, 20, 25, 30, 40]) {
    const r = calcPension({ ...base, years: y });
    assert.ok(r.monthly > prev, `${y}년에서 줄었다`);
    prev = r.monthly;
  }
});

test('연금 — 데이터가 없는 연도는 조용히 넘어가지 않고 실패한다', () => {
  assert.throws(() => calcPension({ ...base, year: '2024' }), /2024/);
});
