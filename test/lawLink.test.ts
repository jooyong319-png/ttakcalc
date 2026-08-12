// 법령 링크 회귀 테스트.
//
// 이 테스트의 핵심은 **무엇을 링크하지 않는지**다. 죽은 링크는 신뢰 신호를 얻으려다
// 오히려 잃는 일이라, 확실히 아는 법령만 걸고 나머지는 텍스트로 둬야 한다.
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { hasLawCitation, lawUrlsIn } from '../lib/lawLink';

const dec = (u: string) => decodeURIComponent(u).replace('https://www.law.go.kr/법령/', '');

test('법령링크 — 기본 조문을 인식한다', () => {
  assert.deepEqual(dec(lawUrlsIn('소득세법 제12조제3호 러목')[0]), '소득세법/제12조');
  assert.deepEqual(dec(lawUrlsIn('근로기준법 제56조 ①')[0]), '근로기준법/제56조');
});

test('법령링크 — 시행령을 본법으로 잘라먹지 않는다', () => {
  // "소득세법 시행령"이 "소득세법"에 먹히면 엉뚱한 조문으로 간다
  assert.deepEqual(dec(lawUrlsIn('소득세법 시행령 제116조의2')[0]), '소득세법 시행령/제116조의2');
  assert.deepEqual(dec(lawUrlsIn('지방세법 시행령 제109조')[0]), '지방세법 시행령/제109조');
});

test('법령링크 — 이어지는 조문도 같은 법으로 건다', () => {
  assert.deepEqual(lawUrlsIn('지방세법 제127조·제128조').map(dec), [
    '지방세법/제127조',
    '지방세법/제128조',
  ]);
});

test('법령링크 — 줄여 쓴 표기는 정식 명칭으로 보낸다', () => {
  assert.deepEqual(dec(lawUrlsIn('상증세법 제53조')[0]), '상속세 및 증여세법/제53조');
});

test('법령링크 — 띄어쓰기가 있는 법령명을 잘라먹지 않는다', () => {
  // 정규식으로 하면 "보장법 제8조"만 남아 죽은 링크가 됐다
  assert.deepEqual(dec(lawUrlsIn('근로자퇴직급여 보장법 제8조')[0]), '근로자퇴직급여 보장법/제8조');
});

test('법령링크 — 앞 문맥을 법령명으로 삼키지 않는다', () => {
  // "이자율은 지방세법 시행령 제..."에서 법령명은 "지방세법 시행령"이어야 한다
  const [u] = lawUrlsIn('이자율은 지방세법 시행령 제125조를 따른다');
  assert.deepEqual(dec(u), '지방세법 시행령/제125조');
});

test('법령링크 — 모르는 법령은 링크하지 않는다', () => {
  // 표에 없으면 안 건다. 지어낸 주소는 죽은 링크가 된다.
  assert.equal(hasLawCitation('한도는 시행령이 아니라 법 제12조에 있다'), false);
  assert.equal(hasLawCitation('같은 법 시행령 제17조'), false);
  assert.equal(hasLawCitation('개똥법 제3조'), false);
});

test('법령링크 — 고시·행정규칙은 링크 대상이 아니다', () => {
  // 고시 URL은 내부 일련번호(admRulSeq)를 요구해 이름만으로 만들 수 없다
  assert.equal(hasLawCitation('고용노동부고시 제2025-47호'), false);
  assert.equal(hasLawCitation('보건복지부고시 제2026-31호(2026. 2. 2. 일부개정)'), false);
});

test('법령링크 — 조문 없는 일반 문장은 그대로 둔다', () => {
  assert.equal(hasLawCitation('필요경비율은 국세청 업종별 고시'), false);
  assert.equal(hasLawCitation('해외 현지 원천징수세는 계산하지 않는다'), false);
});

test('법령링크 — 부칙 조문은 본법 조문으로 보내지 않는다', () => {
  // "국민연금법 부칙<법률 제20903호> 제4조"의 제4조는 본법 제4조가 아니다.
  // 본법으로 링크하면 엉뚱한 조문을 근거라고 가리키게 된다.
  assert.equal(hasLawCitation('국민연금법 부칙<법률 제20903호, 2025. 4. 2.> 제4조 제1항'), false);
});
