// 고유 문장 생성기 테스트.
//
// 이 테스트의 목적은 문장이 예쁜지가 아니라 **값마다 실제로 다른 말을 하는가**다.
// 전부 같은 말을 하면 그건 도어웨이 페이지이고, 사이트 전체가 평가절하될 수 있다.
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { salaryInsights, carAgeInsights } from '../lib/insights';
import { allSalaryValues } from '../lib/salaryPages';
import { latestYear } from '../lib/rates';

const YEAR = latestYear();

test('고유문장 — 연봉마다 다른 문장이 나온다', () => {
  const all = allSalaryValues().map(m => salaryInsights(m, YEAR).map(i => i.text).join('|'));
  const unique = new Set(all);
  // 모든 값이 다른 이야기를 해야 한다. 같은 문장이 반복되면 그게 도어웨이다.
  // 특히 50만원 단위로 쪼갠 밀집 구간(2,500~5,000만원)이 위험하다 — 옆 페이지와
  // 금액 차이가 작아서, 할 말까지 같으면 사실상 같은 페이지가 된다.
  assert.equal(unique.size, all.length, `중복 문장 ${all.length - unique.size}건`);
});

test('고유문장 — 50만원 단위로 쪼갠 값도 옆 페이지와 다른 말을 한다', () => {
  const all = allSalaryValues();
  for (let i = 1; i < all.length; i++) {
    const a = salaryInsights(all[i - 1], YEAR).map(x => x.text).join('|');
    const b = salaryInsights(all[i], YEAR).map(x => x.text).join('|');
    assert.notEqual(a, b, `${all[i - 1]}만원과 ${all[i]}만원이 같은 말을 한다`);
  }
});

test('고유문장 — 모든 연봉에 할 말이 있다', () => {
  const empty = allSalaryValues().filter(m => salaryInsights(m, YEAR).length === 0);
  // 할 말이 없는 값에 페이지를 만들면 그 페이지는 존재 이유가 없다
  assert.deepEqual(empty, [], '고유 문장이 하나도 없는 연봉이 있다');
});

test('고유문장 — 세율 구간이 바뀌는 지점을 실제로 집어낸다', () => {
  const crossings = allSalaryValues().filter(m =>
    salaryInsights(m, YEAR).some(i => i.text.includes('소득세율이')));
  // 구간 경계는 몇 군데뿐이다. 전부에서 나오면 판정이 틀린 것이고,
  // 하나도 안 나오면 그 사실을 못 잡고 있는 것이다.
  assert.ok(crossings.length >= 1, '구간 상승을 하나도 못 잡았다');
  assert.ok(crossings.length <= 8, `구간 상승이 ${crossings.length}곳이면 판정이 틀렸다`);
});

test('고유문장 — 국민연금 상한을 넘는 지점을 집어낸다', () => {
  const first = allSalaryValues().find(m =>
    salaryInsights(m, YEAR).some(i => i.text.includes('더 이상 오르지 않습니다')));
  assert.ok(first, '국민연금 상한 도달 지점을 못 잡았다');
});

test('고유문장 — 지어낸 값이 섞이지 않는다', () => {
  // 문장에 나오는 금액은 전부 계산 결과여야 한다. NaN·undefined·Infinity가
  // 문자열로 새어 나가면 그대로 화면에 찍힌다.
  for (const m of allSalaryValues()) {
    for (const i of salaryInsights(m, YEAR)) {
      assert.equal(/NaN|undefined|Infinity|null/.test(i.text), false, `${m}: ${i.text}`);
    }
  }
});

test('고유문장 — 차령별로 경감률이 다르다', () => {
  const texts = Array.from({ length: 13 }, (_, age) =>
    carAgeInsights(2000, age, YEAR).map(i => i.text).join('|'));
  // 0~2년은 "경감 대상 아님"으로 같고, 3~11년은 매년 달라야 하고, 12년은 상한이다
  assert.equal(new Set(texts.slice(3, 12)).size, 9, '차령별 경감률이 안 갈린다');
  assert.ok(texts[3].includes('5%'));
  assert.ok(texts[11].includes('45%'));
  assert.ok(texts[12].includes('50%'));
});

test('고유문장 — 범위 밖의 이웃을 근거로 삼지 않는다', () => {
  // 최소값에서 기계적으로 한 단계 빼면 "연봉 1,900만원에서 2,000만원으로"라고
  // 말하게 되는데, 그 연봉의 페이지는 존재하지 않는다. 없는 것을 근거로 쓰지 않는다.
  const valid = new Set(allSalaryValues());
  for (const m of allSalaryValues()) {
    for (const i of salaryInsights(m, YEAR)) {
      for (const [, num] of Array.from(i.text.matchAll(/연봉 ([\d,]+)만원(?:에서|으로)/g))) {
        assert.ok(valid.has(Number(num.replace(/,/g, ''))), `${m}: 없는 연봉을 언급한다 — ${i.text}`);
      }
    }
  }
});
