// 구조화 데이터 회귀 테스트.
//
// 구조화 데이터의 유일한 위험은 **화면과 다른 말을 하는 것**이다. 화면에 없는 정보를
// 마크업하면 스팸 정책 위반이고, 화면과 다른 경로를 가리키면 그냥 거짓말이다.
// 그래서 여기서 검사하는 건 "필드가 있는가"가 아니라 "화면과 일치하는가"다.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

import {
  breadcrumbLd, categoryHrefByName, latestVerifiedAt, ldJson, DATASET_DESCRIPTION_MIN,
} from '../lib/jsonLd';
import { CATEGORIES } from '../lib/catalog';
import { getRates, latestYear } from '../lib/rates';

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

  // 라우트 그룹(app/(site)/…)이 생기면서 경로가 한 번 바뀌었다. 다시 바뀌어도
  // 테스트가 조용히 통과해 버리지 않도록, 찾아서 없으면 실패시킨다.
  const root = ['app/calc', 'app/(site)/calc'].find(existsSync);
  assert.ok(root, '계산기 라우트 디렉터리를 못 찾았다 — 경로가 바뀌었나?');

  const bad: string[] = [];
  for (const dir of readdirSync(root)) {
    const file = join(root, dir, 'page.tsx');
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

test('구조화데이터 — 대조일은 데이터 어디에 있든 가장 최근 것을 집는다', () => {
  // 연도 블록의 verifiedAt만 읽던 시절, 그 뒤 개별 항목(2027년 최저임금 예고)을
  // 확인한 날이 반영되지 않아 소개 페이지가 9일 오래된 날짜를 보여주고 있었다.
  // 하필 신뢰를 이야기하는 페이지에서 실제보다 방치된 것처럼 보이는 문제였다.
  const rates = getRates(latestYear()) as unknown as Record<string, unknown>;
  const nested: string[] = [];
  const walk = (n: unknown) => {
    if (Array.isArray(n)) return n.forEach(walk);
    if (!n || typeof n !== 'object') return;
    for (const [k, v] of Object.entries(n as Record<string, unknown>)) {
      if (k === 'verifiedAt' && typeof v === 'string') nested.push(v);
      else walk(v);
    }
  };
  walk(rates);
  const deepest = nested.slice().sort().pop();
  assert.equal(latestVerifiedAt(), deepest, '중첩된 verifiedAt을 놓치고 있다');
});

test('구조화데이터 — Dataset 설명은 50자 이상이고 실제로 설명이어야 한다', () => {
  // 표 아래 각주(caption)를 설명으로 넘겼다가 서치콘솔에 걸렸다(2026-08-13).
  // "2026년 기준 · 최종 확인 2026-08-03" — 33자였고, 무엇에 대한 데이터인지
  // 한 마디도 하지 않았다. 길이만 재면 반쪽이라 내용도 함께 본다.
  const bad: string[] = [];
  const root = ['app', 'app/(site)'].find(d => existsSync(join(d, 'salary', 'page.tsx')));
  assert.ok(root, '인덱스 페이지 경로를 못 찾았다 — 라우트가 바뀌었나?');

  for (const dir of readdirSync(root)) {
    const file = join(root, dir, 'page.tsx');
    if (!existsSync(file)) continue;
    const src = readFileSync(file, 'utf-8');
    // Dataset을 내보내는 페이지만 검사한다
    if (!src.includes('RouteIndex') && !src.includes('datasetLd')) continue;

    const m = src.match(/const DESCRIPTION =\s*([\s\S]*?);\n/);
    if (!m) { bad.push(`${file}: DESCRIPTION 상수가 없다`); continue; }
    // 문자열 리터럴만 이어붙여 실제 길이를 잰다
    const text = Array.from(m[1].matchAll(/'([^']*)'/g)).map(x => x[1]).join('');
    if (text.length < DATASET_DESCRIPTION_MIN) {
      bad.push(`${file}: ${text.length}자 (${DATASET_DESCRIPTION_MIN}자 이상 필요)`);
    }
    // 날짜와 "기준"만 있는 문장은 설명이 아니라 메타 정보다
    if (/^[\d년월일\s.·기준최종확인-]+$/.test(text)) {
      bad.push(`${file}: 설명이 아니라 메타 정보다 — "${text}"`);
    }
  }
  assert.deepEqual(bad, []);
});

test('사이트맵 — lastmod가 한 날짜로 뭉치지 않는다', () => {
  // 같은 버그를 세 번 당했다(2026-08-06 계산기 추가, 08-12 /about 표시, 08-13 롱테일 179장).
  // 마지막엔 699개 URL 전체가 2026-08-12 한 날짜로 나갔다 — 하루 뒤에 생긴 179장까지
  // "8월 12일에 마지막 수정"이라고 신고한 셈이다.
  //
  // 지문은 늘 같았다: **전부 같은 날짜**. 실제로는 페이지마다 바뀐 날이 다르다.
  // 요율 데이터만 보는 방식은 페이지가 늘어난 경우를 원리적으로 못 잡는다.
  const src = readFileSync(join('app', 'sitemap.ts'), 'utf-8');
  assert.ok(
    src.includes('routeModified') && src.includes("'git'"),
    'lastmod를 페이지별 변경일에서 가져오지 않는다 — 데이터 확인일만 쓰면 새 페이지를 놓친다',
  );
  // 모든 항목이 같은 값을 쓰는 구조로 되돌아가면 여기서 걸린다
  assert.equal(
    /const at = \([^)]*\)[^=]*=>\s*\(\{\s*url,\s*lastModified,/.test(src), false,
    '모든 URL이 같은 lastModified를 공유한다',
  );
});
