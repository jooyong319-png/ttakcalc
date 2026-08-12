// 사용 측정 회귀 테스트.
//
// 여기서 가장 중요한 건 **보내지 않아야 할 것을 안 보내는가**다.
// 연봉·상속재산·집값은 그 사람의 재산 상태 그 자체라 우리 쪽에 쌓일 이유가 없다.
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { calculatorFromPath, trackCalculate } from '../lib/analytics';

test('사용측정 — 계산기 경로에서 이름을 뽑는다', () => {
  assert.equal(calculatorFromPath('/calc/salary'), 'salary');
  assert.equal(calculatorFromPath('/calc/acquisition-tax'), 'acquisition-tax');
  // 임베드도 같은 이름으로 센다 — 어디서 쓰였든 같은 계산기다
  assert.equal(calculatorFromPath('/embed/car-tax'), 'car-tax');
  assert.equal(calculatorFromPath('/calc/salary?year=2025'), 'salary');
});

test('사용측정 — 계산기가 아닌 경로는 세지 않는다', () => {
  assert.equal(calculatorFromPath('/'), null);
  assert.equal(calculatorFromPath('/salary/3000'), null);   // 값별 답 페이지는 계산 행위가 없다
  assert.equal(calculatorFromPath('/c/tax'), null);
  assert.equal(calculatorFromPath('/about'), null);
});

test('사용측정 — 금액은 보내지 않는다', () => {
  const sent: unknown[][] = [];
  (globalThis as { window?: unknown }).window = {
    gtag: (...args: unknown[]) => sent.push(args),
    location: { pathname: '/calc/salary' },
  };

  trackCalculate('salary');

  assert.equal(sent.length, 1);
  const [event, name, params] = sent[0] as [string, string, Record<string, unknown>];
  assert.equal(event, 'event');
  assert.equal(name, 'calculate');
  assert.deepEqual(params, { calculator: 'salary' });
  // 금액처럼 보이는 것이 하나라도 섞여 있으면 안 된다
  for (const v of Object.values(params)) {
    assert.equal(typeof v === 'number', false, `숫자 값이 섞였다: ${JSON.stringify(params)}`);
  }

  delete (globalThis as { window?: unknown }).window;
});

test('사용측정 — 분석 도구가 없어도 조용히 넘어간다', () => {
  // 광고 차단기나 개발 환경에서 계산기가 깨지면 안 된다
  (globalThis as { window?: unknown }).window = { location: { pathname: '/calc/salary' } };
  assert.doesNotThrow(() => trackCalculate('salary'));
  delete (globalThis as { window?: unknown }).window;
});
