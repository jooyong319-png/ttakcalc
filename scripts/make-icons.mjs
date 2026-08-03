// 파비콘·앱 아이콘 생성기.
//
// 마크는 워드마크(딱**칼크**)의 첫 글자 "딱" 하나다. 16px 탭에서 읽히려면 형태가 하나여야 하고,
// 계산기 아이콘(=, ±)은 어느 사이트나 쓰는 거라 이름을 못 남긴다.
// 액센트 파랑 바탕에 흰 글씨 — 밝은 탭 배경에서도 어두운 탭 배경에서도 덩어리가 먼저 보인다.
//
// 크기별로 축소하지 않고 각각 그 크기로 직접 렌더한다. 512를 16으로 줄이면 획이 뭉갠다.
// 작은 크기에서는 글자를 키우고 모서리를 덜 깎는다(아래 SPEC).
//
// 실행:
//   PLAYWRIGHT_PATH=<...>/node_modules/playwright/index.mjs node scripts/make-icons.mjs
import { writeFile, unlink } from 'node:fs/promises';
import path from 'node:path';
import url from 'node:url';

const ROOT = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '..');
const BG = '#1d4ed8';   // globals.css --accent (라이트)
const FG = '#ffffff';

/** 크기마다 글자 비율과 모서리를 따로 준다 — 작을수록 글자를 키우고 모서리를 덜 깎아야 읽힌다 */
const SPEC = [
  { file: 'app/icon.png',       size: 512, font: 0.60, radius: 0.22 },
  { file: 'app/apple-icon.png', size: 180, font: 0.58, radius: 0.22 },
  { file: 'app/icon-32.png',    size: 32,  font: 0.72, radius: 0.16 },  // favicon.ico 재료
];

const page$ = (size, font, radius) => `<!doctype html><meta charset="utf-8">
<link rel="stylesheet" href="../public/fonts/pretendard/pretendard.css">
<style>
  html, body { margin: 0; }
  body { width: ${size}px; height: ${size}px; }
  .m {
    width: 100%; height: 100%;
    background: ${BG};
    border-radius: ${Math.round(size * radius)}px;
    display: flex; align-items: center; justify-content: center;
    font-family: "Pretendard Variable", sans-serif;
    font-weight: 900;
    font-size: ${Math.round(size * font)}px;
    line-height: 1;
    color: ${FG};
    letter-spacing: -0.06em;
    /* 한글은 baseline이 약간 아래라 시각 중심을 맞추려면 조금 올려야 한다 */
    padding-bottom: ${(size * 0.04).toFixed(1)}px;
  }
</style>
<div class="m">딱</div>`;

let chromium;
for (const spec of [
  'playwright',
  process.env.PLAYWRIGHT_PATH && url.pathToFileURL(process.env.PLAYWRIGHT_PATH).href,
].filter(Boolean)) {
  try { ({ chromium } = await import(spec)); break; } catch { /* 다음 후보 */ }
}
if (!chromium) {
  console.error('playwright를 못 찾았다. PLAYWRIGHT_PATH로 경로를 넘기거나 설치할 것.');
  process.exit(1);
}

const browser = await chromium.launch();
for (const { file, size, font, radius } of SPEC) {
  // public 안에 둬야 폰트 상대경로가 file://에서 풀린다
  const tmp = path.join(ROOT, 'public/.icon-src.html');
  await writeFile(tmp, page$(size, font, radius), 'utf-8');
  const page = await browser.newPage({ viewport: { width: size, height: size }, deviceScaleFactor: 1 });
  await page.goto(url.pathToFileURL(tmp).href, { waitUntil: 'networkidle' });
  await page.waitForTimeout(400);  // 폰트 적용 대기 — 안 기다리면 시스템 폰트로 찍힌다
  await page.screenshot({ path: path.join(ROOT, file), omitBackground: true });
  await page.close();
  await unlink(tmp);
  console.log(`${file}  ${size}×${size}`);
}
await browser.close();

// ── favicon.ico ─────────────────────────────────────────────────────
// ICO는 PNG를 그대로 품을 수 있다(Vista 이후 전 브라우저 지원). 헤더 22바이트만 붙이면 된다.
// 별도 라이브러리를 받을 이유가 없다.
const { readFile } = await import('node:fs/promises');
const png = await readFile(path.join(ROOT, 'app/icon-32.png'));

const header = Buffer.alloc(6);
header.writeUInt16LE(0, 0);   // reserved
header.writeUInt16LE(1, 2);   // 1 = 아이콘
header.writeUInt16LE(1, 4);   // 이미지 1장

const entry = Buffer.alloc(16);
entry.writeUInt8(32, 0);            // width  (0이면 256)
entry.writeUInt8(32, 1);            // height
entry.writeUInt8(0, 2);             // 팔레트 색 수(트루컬러면 0)
entry.writeUInt8(0, 3);             // reserved
entry.writeUInt16LE(1, 4);          // color planes
entry.writeUInt16LE(32, 6);         // bits per pixel
entry.writeUInt32LE(png.length, 8); // 이미지 크기
entry.writeUInt32LE(22, 12);        // 이미지 시작 위치(6 + 16)

await writeFile(path.join(ROOT, 'app/favicon.ico'), Buffer.concat([header, entry, png]));
await unlink(path.join(ROOT, 'app/icon-32.png'));  // ico 재료였을 뿐이라 남기지 않는다
console.log('app/favicon.ico  32×32 (PNG-in-ICO)');
