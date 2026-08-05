// 상속세 회귀 테스트.
//
// 급소는 산수가 아니라 **공제 조합**이다. 일괄공제와 기초+인적 중 어느 쪽이 이기는지,
// 배우자가 있느냐 없느냐, 단독 상속이냐에 따라 세금이 수억 갈린다.
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { calcInheritanceTax } from '../lib/calc/inheritance';
import { latestYear, getRates } from '../lib/rates';

const Y = latestYear();
const 억 = 100_000_000;
const base = {
  year: Y, estate: 10 * 억, debt: 0,
  hasSpouse: false, spouseTakes: null, children: 2,
  minorYears: 0, elderly: 0, netFinancial: 0,
};

test('상속세 — 자녀만 있으면 5억 이하는 세금이 없다(일괄공제)', () => {
  const r = calcInheritanceTax({ ...base, estate: 5 * 억 });
  assert.equal(r.usedLumpSum, true);
  assert.equal(r.appliedBaseDeduction, 5 * 억);
  assert.equal(r.taxBase, 0);
  assert.equal(r.finalTax, 0);
});

test('상속세 — 배우자가 있으면 10억까지 세금이 없다(일괄 5억 + 배우자 최소 5억)', () => {
  const r = calcInheritanceTax({ ...base, estate: 10 * 억, hasSpouse: true, spouseTakes: 0 });
  assert.equal(r.spouseDeduction, 5 * 억, '실제 상속액이 0이어도 5억은 공제한다(제19조 ④)');
  assert.equal(r.totalDeduction, 10 * 억);
  assert.equal(r.finalTax, 0);
});

test('상속세 — 자녀가 많으면 인적공제가 일괄공제를 이긴다', () => {
  // 기초 2억 + 자녀 7명 × 5천만 = 5.5억 > 일괄 5억
  const r = calcInheritanceTax({ ...base, children: 7 });
  assert.equal(r.usedLumpSum, false);
  assert.equal(r.appliedBaseDeduction, 2 * 억 + 7 * 50_000_000);
});

test('상속세 — 배우자 단독 상속이면 일괄공제를 쓸 수 없다(제21조 ②)', () => {
  const alone = calcInheritanceTax({ ...base, estate: 20 * 억, hasSpouse: true, children: 0, spouseTakes: null });
  assert.equal(alone.usedLumpSum, false, '자녀 없이 배우자만이면 일괄공제 배제');
  assert.equal(alone.appliedBaseDeduction, 2 * 억, '기초공제 2억만 적용된다');
});

test('상속세 — 배우자공제는 법정상속분 한도를 넘지 못한다', () => {
  // 배우자 1.5 : 자녀 2명 → 배우자 법정상속분 1.5/3.5 = 42.86%
  const estate = 35 * 억;
  const r = calcInheritanceTax({ ...base, estate, hasSpouse: true, spouseTakes: 30 * 억, children: 2 });
  const limit = estate * (1.5 / 3.5);
  assert.ok(r.spouseDeduction <= limit + 10, `${r.spouseDeduction} ≤ ${limit}`);
});

test('상속세 — 배우자공제 상한은 30억이다(제19조 ①2)', () => {
  const r = calcInheritanceTax({ ...base, estate: 200 * 억, hasSpouse: true, spouseTakes: 100 * 억, children: 1 });
  assert.equal(r.spouseDeduction, 30 * 억);
});

test('상속세 — 금융재산공제: 2천만원 이하는 전액, 초과는 20%(2억 한도)', () => {
  const small = calcInheritanceTax({ ...base, netFinancial: 15_000_000 });
  assert.equal(small.financialDeduction, 15_000_000);

  const mid = calcInheritanceTax({ ...base, netFinancial: 3 * 억 });
  assert.equal(mid.financialDeduction, 3 * 억 * 0.2);   // 6천만원

  const big = calcInheritanceTax({ ...base, netFinancial: 20 * 억 });
  assert.equal(big.financialDeduction, 2 * 억, '2억 한도');
});

test('상속세 — 세율은 증여세와 같은 표를 쓴다(제26조)', () => {
  const g = getRates(Y).giftTax;
  // 과세표준 10억이 되도록: 상속재산 15억, 일괄공제 5억
  const r = calcInheritanceTax({ ...base, estate: 15 * 억 });
  assert.equal(r.taxBase, 10 * 억);
  const b = g.brackets.find(x => x.upTo === 1_000_000_000)!;
  assert.equal(r.calculatedTax, 10 * 억 * b.rate - b.deduction);
});

test('상속세 — 신고세액공제 3%가 산출세액에서 빠진다(제69조)', () => {
  const r = calcInheritanceTax({ ...base, estate: 15 * 억 });
  assert.equal(r.filingCredit, Math.floor((r.calculatedTax * 0.03) / 10) * 10);
  assert.equal(r.finalTax, r.calculatedTax - r.filingCredit);
});

test('상속세 — 채무는 과세가액에서 빠진다', () => {
  const withDebt = calcInheritanceTax({ ...base, estate: 15 * 억, debt: 5 * 억 });
  const without = calcInheritanceTax({ ...base, estate: 10 * 억 });
  assert.equal(withDebt.taxBase, without.taxBase);
});

test('상속세 — 재산이 커질수록 실효세율은 단조증가한다', () => {
  let prev = -1;
  for (const 억수 of [5, 10, 20, 30, 50, 100, 200]) {
    const r = calcInheritanceTax({ ...base, estate: 억수 * 억 });
    assert.ok(r.effectiveRate >= prev - 1e-9, `${억수}억에서 실효세율이 떨어졌다`);
    prev = r.effectiveRate;
  }
});

test('상속세 — 데이터가 없는 연도는 조용히 넘어가지 않고 실패한다', () => {
  assert.throws(() => calcInheritanceTax({ ...base, year: '2024' }), /2024/);
});
