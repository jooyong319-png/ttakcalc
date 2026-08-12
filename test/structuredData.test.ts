// 구조화 데이터 회귀 테스트.
//
// 구조화 데이터의 유일한 위험은 **화면과 다른 말을 하는 것**이다. 화면에 없는 정보를
// 마크업하면 스팸 정책 위반이고, 화면과 다른 경로를 가리키면 그냥 거짓말이다.
// 그래서 여기서 검사하는 건 "필드가 있는가"가 아니라 "화면과 일치하는가"다.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

import { breadcrumbLd, categoryHrefByName, latestVerifiedAt, ldJson } from '../lib/jsonLd';
import { CATEGORIES } from '../lib/catalog';

test('구조화데이터 — 카테고리 이름은 반드시 카탈로그에 있어야 한다', () => {
  // 계산기 페이지가 넘기는 category가 카탈로그에 없으면 눈썹줄 링크가 홈으로 새고
  // breadcrumb도 엉뚱한 곳을 가리킨다. 실제로 "급여·노동", "금융", "자동차"라는
  // 카탈로그에 없는 이름이 13개 페이지에 박혀 있었다.
  const known = Array.from(new Set(CATEGORIES.map(c => c.name)));
  for (const name of known) {
    assert.equal(categoryHrefByName(name).startsWith('/c/'), true, `${name}의 허브 경로가 없다`);
  }
  assert.equal(categoryHrefByName('있을 리 없는 갈래'), '/');
});

test('구조화데이터 — breadcrumb은 홈으로 시작하고 마지막에 URL을 넣지 않는다', () => {
  const ld = breadcrumbLd([{ name: '급여·세금', href: '/c/tax' }, { name: '연봉 실수령액 계산기' }]);
  const items = ld.itemListElement;
  assert.equal(items.length, 3);
  assert.equal(items[0].name, '홈');
  assert.equal(items[0].item, 'https://ttakcalc.com/');
  assert.equal(items[1].item, 'https://ttakcalc.com/c/tax');
  assert.deepEqual(items.map(i => i.position), [1, 2, 3]);
  // 현재 페이지는 item을 생략한다 — 그래야 컴포넌트가 자기 URL을 몰라도 된다
  assert.equal('item' in items[2], false);
});

test('구조화데이터 — dateModified는 실제 대조 날짜다', () => {
  const d = latestVerifiedAt();
  assert.match(d, /^\d{4}-\d{2}-\d{2}$/);
  // 미래 날짜면 "최근에 갱신했다"는 거짓 신호가 된다
  assert.ok(d <= new Date().toISOString().slice(0, 10), `대조일이 미래다: ${d}`);
});

test('구조화데이터 — script 조기 종료를 막는다', () => {
  // 값에 </script>가 섞이면 페이지가 통째로 깨진다
  assert.equal(ldJson({ a: '</script><img>' }).includes('<'), false);
});

test('구조화데이터 — 계산기 페이지의 category가 실제 카탈로그와 어긋나지 않는다', () => {
  // 소스를 직접 훑는다. 타입으로는 못 막는 종류의 어긋남이라(그냥 문자열이다)
  // 여기서 잡지 않으면 눈썹줄·허브·breadcrumb이 조용히 따로 논다.
  const known = new Set(CATEGORIES.map(c => c.name));
  const byHref = new Map<string, string>();
  for (const c of CATEGORIES) for (const x of c.calcs) byHref.set(x.href, c.name);

  const bad: string[] = [];
  for (const dir of readdirSync('app/calc')) {
    const file = join('app/calc', dir, 'page.tsx');
    if (!existsSync(file)) continue;
    const m = readFileSync(file, 'utf-8').match(/category="([^"]+)"/);
    if (!m) continue;
    const used = m[1];
    if (!known.has(used)) { bad.push(`${file}: "${used}"는 카탈로그에 없는 갈래`); continue; }
    const want = byHref.get(`/calc/${dir}`);
    if (want && want !== used) bad.push(`${file}: "${used}" ≠ 카탈로그의 "${want}"`);
  }
  assert.deepEqual(bad, []);
});
