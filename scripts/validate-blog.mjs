// 블로그 글 검사 — 스케줄러가 글을 쓴 뒤 반드시 돌린다.
//
// 왜 있는가 — 글 품질을 사람 눈에만 맡기면 기준이 매번 흔들린다. 특히 자동으로 쓰는
// 글은 "일단 짧게 하나 올리고 넘어가기"가 되기 쉬운데, 그렇게 쌓인 얇은 글은 도움이
// 안 되는 정도가 아니라 사이트 전체 평가를 끌어내린다.
//
// 기준은 두 개다(2026-08-23 결정).
//   · 본문 1,500자 이상 — 검색 결과에서 경쟁하려면 이 정도는 필요하다
//   · 타깃 키워드 7회 이상 — 다만 **자연스럽게**. 아래 상한 검사를 함께 둔 이유다
//
// ⚠️ 키워드는 하한만 있으면 스터핑으로 간다. 1,500자에 7회는 밀도 약 1.4%로 정상이지만,
//    억지로 채워 3%를 넘기면 검색엔진이 스팸으로 본다. 그래서 상한도 검사한다.
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const DIR = join(process.cwd(), 'content', 'blog');

/** 본문에서 마크다운 문법과 토큰을 걷어내고 사람이 읽는 글자만 남긴다 */
function plainText(body) {
  return body
    // 토큰은 실제로는 "200,000원" 같은 값이 된다. 대략 그만큼으로 친다.
    .replace(/\{\{[^}]*\}\}/g, '000,000원')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')   // 링크는 글자만
    .replace(/^\|.*\|$/gm, m => m.replace(/\|/g, ' '))
    .replace(/[#*>`]/g, '')
    .replace(/^-{2,}$/gm, '')
    .trim();
}

function frontmatter(raw) {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!m) return null;
  const meta = {};
  for (const line of m[1].split(/\r?\n/)) {
    const i = line.indexOf(':');
    if (i > 0) meta[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
  return { meta, body: m[2] };
}

const MIN_CHARS = 1500;
const MIN_KEYWORD = 7;
/** 밀도 상한 — 이걸 넘으면 억지로 채운 것이다 */
const MAX_DENSITY = 0.03;

const problems = [];

if (!existsSync(DIR)) {
  console.log('content/blog 없음 — 검사할 글이 없다');
  process.exit(0);
}

for (const file of readdirSync(DIR).filter(f => f.endsWith('.md'))) {
  const parsed = frontmatter(readFileSync(join(DIR, file), 'utf-8'));
  if (!parsed) { problems.push(`${file}: frontmatter를 못 읽었다`); continue; }
  const { meta, body } = parsed;

  for (const key of ['title', 'description', 'date', 'tags', 'keyword']) {
    if (!meta[key]) problems.push(`${file}: frontmatter에 '${key}'가 없다`);
  }

  const text = plainText(body);
  if (text.length < MIN_CHARS) {
    problems.push(`${file}: 본문이 ${text.length}자다 (${MIN_CHARS}자 이상 필요)`);
  }

  const keyword = meta.keyword;
  if (keyword) {
    // 정규식 특수문자가 섞여도 안전하게
    const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const hits = (text.match(new RegExp(escaped, 'g')) ?? []).length;
    if (hits < MIN_KEYWORD) {
      problems.push(`${file}: 키워드 "${keyword}"가 ${hits}회다 (${MIN_KEYWORD}회 이상 필요)`);
    }
    // 밀도 = 키워드가 차지하는 글자 비율
    const density = (hits * keyword.length) / Math.max(text.length, 1);
    if (density > MAX_DENSITY) {
      problems.push(
        `${file}: 키워드 "${keyword}" 밀도가 ${(density * 100).toFixed(1)}%다`
        + ` (${(MAX_DENSITY * 100).toFixed(0)}% 초과 — 억지로 채운 것으로 보인다)`);
    }
    console.log(`${file}: ${text.length}자 · "${keyword}" ${hits}회 (밀도 ${(density * 100).toFixed(1)}%)`);
  }
}

if (problems.length) {
  console.error(`\n블로그 문제 ${problems.length}건:\n`);
  for (const p of problems) console.error('  - ' + p);
  process.exit(1);
}
console.log('\n블로그 이상 없음');
