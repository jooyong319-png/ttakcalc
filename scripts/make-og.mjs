// OG 이미지(public/og.png) 생성기.
//
// 왜 스크립트인가 — 2026-08-03에 og.png가 두 군데 틀어져 있는 걸 발견했다.
//   1) 브랜드명이 "딱 계산"으로 남아 있었다(딱칼크로 바뀐 뒤)
//   2) "월 2,947,383원"이 식대 비과세를 30만원으로 잘못 잡던 시절의 값이었다
// 이미지는 grep에 걸리지 않아서 아무도 모르게 낡는다. 그래서 숫자를 손으로 적지 않고
// 홈 화면과 같은 함수(quickAnswers)에서 가져온다 — 요율이 바뀌면 다시 돌리기만 하면 된다.
//
// 실행:
//   npm test                  # dist-test에 계산 함수를 컴파일해 둔다
//   node scripts/make-og.mjs  # playwright가 필요하다
//
// playwright가 이 프로젝트의 의존성은 아니다(OG 한 장 만들자고 브라우저를 받을 이유가 없다).
// 없으면 NODE_PATH로 다른 곳의 설치를 빌려 쓰거나 설치할 것 — 아래에서 안내한다.
import { createRequire } from 'node:module';
import { writeFile, unlink } from 'node:fs/promises';
import path from 'node:path';
import url from 'node:url';

const require = createRequire(import.meta.url);
const ROOT = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '..');

function load(mod) {
  try {
    return require(path.join(ROOT, 'dist-test/lib', mod));
  } catch {
    console.error(`dist-test/lib/${mod} 를 못 찾았다. 먼저 \`npm test\`로 컴파일할 것.`);
    process.exit(1);
  }
}

const { quickAnswers } = load('quickAnswers.js');
const { getRates, latestYear } = load('rates.js');

const rates = getRates(latestYear());
const all = quickAnswers();

/** OG에 넣을 3장. 카테고리가 겹치지 않게 골라 사이트의 폭을 보여준다. */
const PICK = ['연봉 4,000만원이면 실수령 얼마?', '5억 주택 취득세는?', '2,000cc 자동차세는?'];
const cards = PICK.map(q => {
  const a = all.find(x => x.question === q);
  if (!a) {
    console.error(`quickAnswers에 "${q}"가 없다. lib/quickAnswers.ts가 바뀌었으면 PICK도 고칠 것.`);
    process.exit(1);
  }
  return a;
});

// 색은 globals.css의 라이트 팔레트를 그대로 옮긴 것. OG는 항상 라이트로 렌더한다 —
// 공유 카드는 보는 쪽 테마를 따라가지 않는다.
const TONE = {
  c1: { bg: '#eff6ff', key: '#1d4ed8', ink: '#1e3a8a' },
  c2: { bg: '#ecfdf5', key: '#047857', ink: '#064e3b' },
  c3: { bg: '#fff7ed', key: '#c2410c', ink: '#7c2d12' },
  c4: { bg: '#f5f3ff', key: '#6d28d9', ink: '#4c1d95' },
};

const html = `<!doctype html><meta charset="utf-8">
<link rel="stylesheet" href="fonts/pretendard/pretendard.css">
<style>
  * { box-sizing: border-box; margin: 0; }
  body {
    width: 1200px; height: 630px; background: #fff; color: #18181b;
    font-family: "Pretendard Variable", sans-serif;
    padding: 56px 64px 0; position: relative; overflow: hidden;
  }
  .bar { position: absolute; inset: 0 0 auto; height: 10px; display: flex; }
  .bar i { flex: 1; }
  .wordmark { display: flex; align-items: baseline; gap: 14px; margin-bottom: 40px; }
  .wm1 { font-size: 30px; font-weight: 900; letter-spacing: -0.04em; }
  .wm1 b { color: #1d4ed8; }
  .wm2 { font-size: 15px; font-weight: 700; letter-spacing: 0.16em; color: #6b6b73; }
  h1 { font-size: 76px; font-weight: 900; letter-spacing: -0.055em; line-height: 1.1; }
  h1 mark { background: none; color: inherit; box-shadow: inset 0 -0.28em 0 #c7d9fb; }
  .lead { margin-top: 26px; font-size: 25px; color: #52525b; letter-spacing: -0.02em; }
  .lead b { color: #18181b; font-weight: 700; }
  .cards { position: absolute; left: 64px; right: 64px; bottom: 52px; display: flex; gap: 18px; }
  .card { flex: 1; border-radius: 16px; padding: 20px 24px; }
  .q { font-size: 17px; font-weight: 600; margin-bottom: 8px; }
  .a { font-size: 31px; font-weight: 800; letter-spacing: -0.03em; }
</style>
<div class="bar">
  <i style="background:#1d4ed8"></i><i style="background:#047857"></i>
  <i style="background:#c2410c"></i><i style="background:#6d28d9"></i>
</div>
<div class="wordmark"><span class="wm1">딱<b>칼크</b></span><span class="wm2">TTAKCALC.COM</span></div>
<h1>연봉·세금·부동산<br><mark>계산기</mark></h1>
<p class="lead">결과 숫자만 던지지 않고 <b>어떤 요율로 얼마를 뗐는지</b> 보여드립니다</p>
<div class="cards">
${cards
  .map(c => {
    const t = TONE[c.tone] ?? TONE.c1;
    // 질문에서 물음표를 떼어 카드 라벨로 쓴다("연봉 4,000만원이면 실수령 얼마?" → 연봉 4,000만원 실수령)
    const label = c.question.replace(/이면 | 얼마\?|는\?|\?/g, ' ').replace(/\s+/g, ' ').trim();
    return `  <div class="card" style="background:${t.bg}">
    <div class="q" style="color:${t.ink}">${label}</div>
    <div class="a" style="color:${t.key}">${c.answer}</div>
  </div>`;
  })
  .join('\n')}
</div>`;

// public 안에 두어야 fonts/... 상대경로가 file://에서 풀린다
const tmp = path.join(ROOT, 'public/.og-src.html');
await writeFile(tmp, html, 'utf-8');

// ESM의 import()는 NODE_PATH를 보지 않는다. 다른 곳의 설치를 빌려 쓰려면 절대경로가 필요하다.
let chromium;
for (const spec of [
  'playwright',
  process.env.PLAYWRIGHT_PATH && url.pathToFileURL(process.env.PLAYWRIGHT_PATH).href,
].filter(Boolean)) {
  try {
    ({ chromium } = await import(spec));
    break;
  } catch {
    /* 다음 후보로 */
  }
}
if (!chromium) {
  console.error(
    'playwright를 못 찾았다. 이 프로젝트의 의존성이 아니라서 그렇다.\n' +
      '  설치:  npm i -D playwright && npx playwright install chromium\n' +
      '  또는:  PLAYWRIGHT_PATH=<...>/node_modules/playwright/index.mjs node scripts/make-og.mjs\n' +
      `  생성된 HTML은 남겨 둔다: ${tmp}`,
  );
  process.exit(1);
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
await page.goto(url.pathToFileURL(tmp).href, { waitUntil: 'networkidle' });
await page.waitForTimeout(600); // 폰트 적용 대기 — 안 기다리면 시스템 폰트로 찍힌다
await page.screenshot({ path: path.join(ROOT, 'public/og.png') });
await browser.close();
await unlink(tmp);

console.log(`public/og.png 생성 완료 — ${rates.label} 기준`);
cards.forEach(c => console.log(`  ${c.question}  ${c.answer}`));
