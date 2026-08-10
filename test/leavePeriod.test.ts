// 육아휴직 기간 회귀 테스트.
//
// 급소는 "만 8세 이하 **또는** 초등학교 2학년 이하"다. 조문이 "또는"이라 둘 중 늦은 쪽까지인데,
// 생일이 언제냐에 따라 어느 쪽이 늦은지가 갈린다. 여기를 틀리면 "언제까지 쓸 수 있나"라는
// 이 계산기의 존재 이유가 통째로 무너진다.
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { calcLeavePeriod } from '../lib/calc/leavePeriod';
import { latestYear, getRates } from '../lib/rates';

const Y = latestYear();
const P = getRates(Y).parentalLeave!.period!;
const base = { year: Y, today: '2026-08-10', usedMonths: 0, usedSplits: 0, eligibleForExtra: false };

const iso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

test('기간 — 5월생은 만 8세 기준이 늦다', () => {
  // 2018-05-10생: 만 9세 생일 전날 = 2027-05-09 / 2학년 종료 = 2027-02-28
  const r = calcLeavePeriod({ ...base, birth: '2018-05-10' });
  assert.equal(iso(r.byAge), '2027-05-09');
  assert.equal(iso(r.bySchool), '2027-02-28');
  assert.equal(iso(r.deadline), '2027-05-09', '늦은 쪽인 만 8세 기준을 쓴다');
});

test('기간 — 1월생은 학년 기준이 늦다', () => {
  // 2018-01-20생: 만 9세 생일 전날 = 2027-01-19 / 2학년 종료 = 2027-02-28
  const r = calcLeavePeriod({ ...base, birth: '2018-01-20' });
  assert.equal(iso(r.byAge), '2027-01-19');
  assert.equal(iso(r.bySchool), '2027-02-28');
  assert.equal(iso(r.deadline), '2027-02-28', '늦은 쪽인 학년 기준을 쓴다');
});

test('기간 — 기본 12개월, 요건 충족 시 18개월', () => {
  const plain = calcLeavePeriod({ ...base, birth: '2024-03-01' });
  assert.equal(plain.maxMonths, P.baseMonths);

  const extra = calcLeavePeriod({ ...base, birth: '2024-03-01', eligibleForExtra: true });
  assert.equal(extra.maxMonths, P.baseMonths + P.extraMonths);
  assert.equal(extra.maxMonths, 18);
});

test('기간 — 이미 쓴 만큼 빠진다', () => {
  const r = calcLeavePeriod({ ...base, birth: '2024-03-01', usedMonths: 5 });
  assert.equal(r.remainMonths, P.baseMonths - 5);
});

test('기간 — 기한이 한도보다 먼저 닫히면 기한이 이긴다', () => {
  // 2018-05-10생, 오늘 2026-08-10 → 기한까지 8개월 남았는데 한도는 12개월
  const r = calcLeavePeriod({ ...base, birth: '2018-05-10' });
  assert.ok(r.monthsLeft < r.maxMonths, '이 사례는 기한이 더 짧아야 한다');
  assert.equal(r.remainMonths, r.monthsLeft);
});

test('기간 — 기한이 지났으면 신청할 수 없다', () => {
  const r = calcLeavePeriod({ ...base, birth: '2010-01-01' });
  assert.equal(r.eligible, false);
  assert.equal(r.remainMonths, 0);
});

test('기간 — 분할은 3회까지', () => {
  assert.equal(calcLeavePeriod({ ...base, birth: '2024-03-01' }).splitsLeft, 3);
  assert.equal(calcLeavePeriod({ ...base, birth: '2024-03-01', usedSplits: 2 }).splitsLeft, 1);
  assert.equal(calcLeavePeriod({ ...base, birth: '2024-03-01', usedSplits: 9 }).splitsLeft, 0);
});

test('기간 — 태어난 해에도 계산된다', () => {
  const r = calcLeavePeriod({ ...base, birth: '2026-01-05' });
  assert.equal(r.eligible, true);
  assert.equal(r.remainMonths, P.baseMonths, '한도가 기한보다 짧으니 한도가 남은 기간이다');
});

test('기간 — 잘못된 날짜는 조용히 넘어가지 않는다', () => {
  assert.throws(() => calcLeavePeriod({ ...base, birth: '아무거나' }), /날짜/);
});
