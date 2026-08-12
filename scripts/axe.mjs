// 접근성 자동 점검. `npm run build && npx next start -p 3111` 후 `npm run axe`.
//
// 라이트/다크 × 데스크톱/모바일을 모두 도는 이유 — 대비 위반은 한쪽 테마에서만 나고,
// 터치 타겟·레이아웃 위반은 좁은 화면에서만 난다. 한 조합만 보면 절반을 놓친다.
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const axe = readFileSync(require.resolve('axe-core/axe.min.js'), 'utf-8');
const { chromium } = await import(
  process.env.PLAYWRIGHT_PATH ?? 'file:///d:/Gcalen/whenstage/node_modules/playwright/index.mjs'
);

const BASE = process.env.AXE_BASE ?? 'http://localhost:3111';
// 계산기 유형별로 한 장씩 — 같은 컴포넌트를 쓰므로 전수를 돌 필요가 없다
const PAGES = process.argv.slice(2).length
  ? process.argv.slice(2)
  : ['/', '/calc/salary', '/calc/acquisition-tax', '/calc/overtime', '/calc/inheritance-tax', '/salary', '/about'];

const browser = await chromium.launch();
let total = 0;

for (const colorScheme of ['light', 'dark']) {
  for (const vp of [
    { width: 1280, height: 900, name: 'desktop' },
    { width: 390, height: 844, name: 'mobile' },
  ]) {
    const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, colorScheme });
    const page = await ctx.newPage();
    for (const path of PAGES) {
      await page.goto(BASE + path, { waitUntil: 'networkidle' });
      await page.addScriptTag({ content: axe });
      const { violations } = await page.evaluate(() => window.axe.run(document, { resultTypes: ['violations'] }));
      for (const v of violations) {
        total += v.nodes.length;
        console.log(`❌ ${colorScheme}/${vp.name} ${path} — ${v.id} (${v.impact}) ×${v.nodes.length}`);
        console.log(`   ${v.nodes[0].target.join(' ')}`);
      }
    }
    await ctx.close();
  }
}

await browser.close();
console.log(`axe 위반 ${total}건 — ${PAGES.length}페이지 × light/dark × desktop/mobile`);
process.exit(total === 0 ? 0 : 1);
