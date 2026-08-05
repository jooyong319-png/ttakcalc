// 자동차 유지비 회귀 테스트.
//
// 이 계산기는 대부분 덧셈이라 산수가 급소가 아니다. 지켜야 할 건 두 가지다.
//  1) 우리가 계산하는 건 자동차세 하나뿐이고, 그 값이 자동차세 계산기와 어긋나지 않을 것
//  2) 어떤 값이 우리 계산이고 어떤 값이 사용자 입력인지 구분이 유지될 것
//     (이게 무너지면 "보험료도 계산해 준다"는 오해가 생긴다 — 이 계산기가 피하려던 바로 그것)
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { calcCarCost } from '../lib/calc/carCost';
import { calcCarTax } from '../lib/calc/localTax';
import { latestYear } from '../lib/rates';

const Y = latestYear();
const base = {
  year: Y, cc: 1998, ageYears: 3,
  km: 15000, fuelEfficiency: 11, fuelPrice: 1700,
  insurance: 900_000, maintenance: 500_000,
  parkingMonthly: 100_000, tollMonthly: 30_000,
};

test('유지비 — 자동차세는 자동차세 계산기와 같은 값이어야 한다', () => {
  const r = calcCarCost(base);
  const tax = calcCarTax({ year: Y, cc: base.cc, ageYears: base.ageYears, business: false });
  assert.equal(r.carTaxTotal, tax.total);
  assert.equal(r.items.find(x => x.key === 'tax')!.annual, tax.total);
});

test('유지비 — 우리가 계산하는 항목은 자동차세 하나뿐이다', () => {
  const r = calcCarCost(base);
  const computed = r.items.filter(x => x.computed).map(x => x.key);
  assert.deepEqual(computed, ['tax'], '보험료를 계산해 주는 것처럼 보이면 안 된다');
});

test('유지비 — 연료비는 주행거리 ÷ 연비 × 단가', () => {
  const r = calcCarCost({ ...base, km: 11000, fuelEfficiency: 11, fuelPrice: 1700 });
  // 11,000km ÷ 11km/L = 1,000L × 1,700원 = 1,700,000원
  assert.equal(r.items.find(x => x.key === 'fuel')!.annual, 1_700_000);
});

test('유지비 — 월 평균과 1km당 비용이 합계와 맞는다', () => {
  const r = calcCarCost(base);
  const sum = r.items.reduce((a, x) => a + x.annual, 0);
  assert.equal(r.annualTotal, sum);
  assert.ok(Math.abs(r.monthlyTotal - sum / 12) < 10, '원 단위 절사 범위 안이어야 한다');
  assert.equal(r.perKm, Math.round(sum / base.km));
});

test('유지비 — 주행거리 0이면 1km당 비용은 0이고 터지지 않는다', () => {
  const r = calcCarCost({ ...base, km: 0 });
  assert.equal(r.perKm, 0);
  assert.ok(r.annualTotal > 0, '주행하지 않아도 보험료·자동차세는 나간다');
});

test('유지비 — 연비를 0으로 넣어도 나눗셈이 터지지 않는다', () => {
  const r = calcCarCost({ ...base, fuelEfficiency: 0 });
  assert.ok(Number.isFinite(r.annualTotal));
  assert.ok(Number.isFinite(r.perKm));
});

test('유지비 — 음수 입력은 0으로 눌린다', () => {
  const r = calcCarCost({ ...base, insurance: -500_000, maintenance: -1 });
  assert.equal(r.items.find(x => x.key === 'insurance')!.annual, 0);
  assert.equal(r.items.find(x => x.key === 'maintenance')!.annual, 0);
});

test('유지비 — 많이 탈수록 1km당 비용은 내려간다(고정비가 나뉘므로)', () => {
  const few = calcCarCost({ ...base, km: 5000 });
  const many = calcCarCost({ ...base, km: 30000 });
  assert.ok(many.perKm < few.perKm, `${many.perKm} < ${few.perKm} 이어야 한다`);
});
