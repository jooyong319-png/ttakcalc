// 배당소득세 회귀 테스트.
//
// 이 계산의 급소는 2천만원 경계와 제62조 비교과세다. 경계 양쪽에서 세금이 어떻게 움직이는지를
// 고정해 둔다. 값은 조문에서 직접 손으로 따라간 것이지 다른 계산기를 베낀 게 아니다.
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { calcDividendTax, reverseDividend } from '../lib/calc/dividend';
import { latestYear, getRates } from '../lib/rates';

const Y = latestYear();
const base = { year: Y, interest: 0, domestic: false, otherIncome: 0, deduction: 1_500_000 };

test('배당 — 2천만원 이하는 15.4%로 끝난다(분리과세)', () => {
  const r = calcDividendTax({ ...base, dividend: 20_000_000 });
  assert.equal(r.comprehensive, false);
  // 20,000,000 × 14% = 2,800,000 / 지방소득세 280,000
  assert.equal(r.incomeTax, 2_800_000);
  assert.equal(r.localTax, 280_000);
  assert.equal(r.totalTax, 3_080_000);
  assert.equal(r.netDividend, 16_920_000);
  assert.ok(Math.abs(r.effectiveRate - 0.154) < 1e-9, '실효세율이 정확히 15.4%');
});

test('배당 — 2천만원을 1원이라도 넘으면 종합과세로 넘어간다', () => {
  const under = calcDividendTax({ ...base, dividend: 20_000_000 });
  const over = calcDividendTax({ ...base, dividend: 20_000_100 });
  assert.equal(under.comprehensive, false);
  assert.equal(over.comprehensive, true);
  // 경계를 넘어도 세금이 갑자기 튀지는 않는다 — 비교과세가 분리과세 방식을 하한으로 잡아준다
  assert.ok(over.totalTax >= under.totalTax, '넘었는데 세금이 줄면 안 된다');
  assert.ok(over.totalTax - under.totalTax < 100_000, `경계에서 세금이 급증하면 안 된다: ${over.totalTax - under.totalTax}`);
});

test('배당 — 다른 소득이 없으면 비교과세에서 분리과세 방식이 이긴다', () => {
  // 금융소득만 있는 파이어족의 전형적인 경우. 종합과세 대상이 돼도 실효세율은 15.4%에 머문다.
  const r = calcDividendTax({ ...base, dividend: 30_000_000 });
  assert.equal(r.comprehensive, true);
  assert.ok(r.separateWay > r.comprehensiveWay, '이 구간에서는 ②가 커야 한다');
  assert.equal(r.incomeTax, 4_200_000);              // 30,000,000 × 14%
  assert.equal(r.totalTax, 4_620_000);
  assert.ok(Math.abs(r.effectiveRate - 0.154) < 1e-9);
});

test('배당 — 금액이 커지면 종합과세 방식이 이겨 실효세율이 올라간다', () => {
  const r = calcDividendTax({ ...base, dividend: 200_000_000 });
  // 과세표준 198,500,000 → 누진 대상 178,500,000 (1.5억~3억: 38%, 누진공제 19,940,000)
  const progressive = 178_500_000 * 0.38 - 19_940_000;  // 47,890,000
  assert.equal(r.comprehensiveWay, progressive + 20_000_000 * 0.14);
  assert.ok(r.comprehensiveWay > r.separateWay, '이 구간에서는 ①이 커야 한다');
  assert.equal(r.incomeTax, 50_690_000);
  assert.ok(r.effectiveRate > 0.25, `실효세율이 15.4%를 넘어야 한다: ${r.effectiveRate}`);
});

test('배당 — 실효세율은 금액이 커질수록 단조증가한다', () => {
  let prev = 0;
  for (const man of [1000, 2000, 3000, 5000, 10000, 30000, 100000]) {
    const r = calcDividendTax({ ...base, dividend: man * 10_000 });
    assert.ok(
      r.effectiveRate >= prev - 1e-9,
      `${man}만원에서 실효세율이 떨어졌다: ${prev} → ${r.effectiveRate}`,
    );
    prev = r.effectiveRate;
  }
});

test('배당 — 국내 배당은 Gross-up만큼 세금이 줄거나 같다(이중과세 조정)', () => {
  const foreign = calcDividendTax({ ...base, dividend: 100_000_000, domestic: false });
  const home = calcDividendTax({ ...base, dividend: 100_000_000, domestic: true });
  assert.ok(home.grossUp > 0, '국내 배당은 가산액이 있어야 한다');
  assert.equal(foreign.grossUp, 0, '해외 배당은 가산 대상이 아니다');
  assert.ok(home.totalTax <= foreign.totalTax, '조정 결과 세금이 늘어나면 안 된다');
});

test('배당 — 배당세액공제로 세금이 분리과세 방식 아래로 내려가지 않는다', () => {
  // 제62조의 취지: 종합과세가 분리과세보다 유리해지면 안 된다
  for (const man of [2500, 4000, 6000, 10000]) {
    const r = calcDividendTax({ ...base, dividend: man * 10_000, domestic: true });
    assert.ok(
      r.incomeTax >= r.separateWay - 10,
      `${man}만원: 결정세액 ${r.incomeTax}이 분리과세 방식 ${r.separateWay}보다 낮다`,
    );
  }
});

test('배당 — 2천만원은 이자부터 채운다(시행령 제116조의2)', () => {
  // 이자 2천만원이 기준금액을 다 채우면 배당 전액이 초과분이 된다
  const r = calcDividendTax({ ...base, dividend: 10_000_000, interest: 20_000_000, domestic: true });
  assert.equal(r.financialIncome, 30_000_000);
  assert.equal(r.comprehensive, true);
  // 초과분 1천만원 전부가 배당이므로 가산 대상도 1천만원
  assert.equal(r.grossUp, 10_000_000 * getRates(Y).dividend!.grossUpRate);
});

test('배당 — 근로소득이 있으면 같은 배당에도 세금이 더 붙는다', () => {
  const alone = calcDividendTax({ ...base, dividend: 50_000_000 });
  const withJob = calcDividendTax({ ...base, dividend: 50_000_000, otherIncome: 60_000_000 });
  assert.ok(withJob.totalTax > alone.totalTax, '합산 과세라 세금이 늘어야 한다');
});

test('배당 — 역산: 세후 목표액을 넣으면 필요한 세전 배당이 나온다', () => {
  for (const target of [20_000_000, 36_000_000, 60_000_000]) {
    const gross = reverseDividend(target, base);
    const net = calcDividendTax({ ...base, dividend: gross }).netDividend;
    assert.ok(net >= target, `${target}원 목표인데 ${net}원밖에 안 된다`);
    assert.ok(net - target < 20_000, `과하게 올려잡았다: ${net - target}원 초과`);
  }
});

test('배당 — 데이터가 없는 연도는 조용히 넘어가지 않고 실패한다', () => {
  assert.throws(() => calcDividendTax({ ...base, year: '2024', dividend: 10_000_000 }), /2024/);
});

test('배당 — 5월 정산액은 결정세액과 원천징수액의 차이다', () => {
  const r = calcDividendTax({ ...base, dividend: 100_000_000 });
  const last = r.steps[r.steps.length - 1];
  assert.match(last.label, /5월에/);
  // 원천징수 15.4%보다 결정세액이 크므로 추가 납부가 나와야 한다
  assert.equal(last.label, '5월에 추가 납부');
  assert.equal(last.value, r.totalTax - r.withheld);
});
