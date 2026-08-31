// 블로그 회귀 테스트.
//
// 이 블로그의 존재 이유는 "숫자를 손으로 적지 않는다"이다. 그 약속이 깨지는 경로가
// 두 개 있는데 — 토큰이 조용히 실패하거나, 누가 그냥 숫자를 타이핑하거나 — 둘 다 여기서 막는다.
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { getAllPosts, fillRates, markdownToHtml, renderPost } from '../lib/blog';

test('블로그 — 모든 글의 토큰이 실제 값으로 치환된다', () => {
  for (const p of getAllPosts()) {
    const html = renderPost(p);
    assert.equal(/\{\{/.test(html), false, `${p.slug}: 치환 안 된 토큰이 남았다`);
    assert.equal(/undefined|NaN|\[object/.test(html), false, `${p.slug}: 값이 새어 나왔다`);
  }
});

test('블로그 — 없는 토큰은 조용히 넘어가지 않고 빌드를 세운다', () => {
  // 조용히 비우면 문장이 "식대 비과세 한도는 입니다"가 된다
  assert.throws(() => fillRates('한도는 {{rates:nope.missing}}입니다'), /못 찾았다/);
  assert.throws(() => fillRates('{{compare:1234-5678}}'), /비교 페이지가 없는/);
});

test('블로그 — 한글 오타 토큰도 잡는다', () => {
  // 토큰 정규식이 [\w.]라 \w에 없는 한글은 매치조차 안 됐다. 그래서 오타가 화면에
  // {{rates:없는.경로}} 그대로 찍힐 수 있었다 — 마지막에 남은 {{...}}를 훑어 잡는다.
  assert.throws(() => fillRates('한도는 {{rates:없는.경로}}입니다'), /알 수 없는 토큰/);
  assert.throws(() => fillRates('{{오타:3000}}'), /알 수 없는 토큰/);
});

test('블로그 — 글의 필수 항목이 빠지지 않는다', () => {
  for (const p of getAllPosts()) {
    assert.ok(p.title && p.title !== '(제목 없음)', `${p.slug}: 제목 없음`);
    assert.match(p.date, /^\d{4}-\d{2}-\d{2}$/, `${p.slug}: 날짜 형식`);
    // 검색 결과 스니펫이 되는 문장이라 너무 짧으면 안 된다
    assert.ok(p.description.length >= 40, `${p.slug}: 설명이 ${p.description.length}자로 짧다`);
    assert.ok(p.tags.length > 0, `${p.slug}: 태그 없음`);
  }
});

test('블로그 — 표를 HTML 표로 바꾼다', () => {
  // 세금 글은 세율·기한을 표로 보여줘야 읽힌다. 이게 이 변환기의 존재 이유다.
  const html = markdownToHtml('| 구분 | 기한 |\n| --- | --- |\n| 주택 | 7월 |\n| 토지 | 9월 |');
  assert.match(html, /<table>/);
  assert.equal((html.match(/<tr>/g) ?? []).length, 3);   // 머리 1 + 본문 2
  assert.match(html, /<th scope="col">구분<\/th>/);
  assert.match(html, /<th scope="row">주택<\/th>/);
  // 좁은 화면에서 가로 스크롤되는 영역은 키보드로도 닿아야 한다
  assert.match(html, /tabindex="0"/);
});

test('블로그 — 위험한 링크 주소를 그대로 내보내지 않는다', () => {
  // 우리가 쓴 글만 들어가지만, javascript:가 통과하는 변환기를 두는 것과 아닌 것은 다르다
  const bad = markdownToHtml('[누르지 마세요](javascript:alert(1))');
  assert.equal(bad.includes('javascript:'), false);
  assert.match(bad, /누르지 마세요/);        // 글자는 남긴다

  const internal = markdownToHtml('[계산기](/calc/salary)');
  assert.match(internal, /href="\/calc\/salary"/);
  assert.equal(internal.includes('target='), false);   // 내부 링크는 새 창으로 열지 않는다

  const external = markdownToHtml('[국세청](https://www.nts.go.kr)');
  assert.match(external, /rel="noopener noreferrer"/);
});

test('블로그 — 본문의 HTML을 이스케이프한다', () => {
  const html = markdownToHtml('악의적인 <script>alert(1)</script> 입력');
  assert.equal(html.includes('<script>'), false);
  assert.match(html, /&lt;script&gt;/);
});
