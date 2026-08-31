import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { getRates, latestYear } from './rates';
import { resultFor, parseComparePair } from './salaryPages';
import { manLabel } from './format';

/**
 * 블로그 — 계산기가 답하지 못하는 것을 글로 답한다.
 *
 * 왜 만드나 (2026-08-23) — 자매 사이트 WhenStage와 GSC를 나란히 놓고 보니, 시작이 9일밖에
 * 차이 안 나는데 노출이 8배 갈렸다. 사이트맵 구성이 원인이었다.
 *
 *   WhenStage  1,137 URL 중 읽을거리 237장(news·blog·guide)
 *   딱칼크        699 URL 중 읽을거리   0장
 *
 * 계산기는 "얼마인가"에 답하지만 "지금 해야 하나", "왜 이런가", "뭘 조심하나"에는 답하지
 * 못한다. 값별 페이지를 아무리 늘려도 그건 **같은 종류**가 늘 뿐이다.
 *
 * ## 이 블로그의 규칙 — 숫자를 손으로 적지 않는다
 *
 * 세금 글의 가장 흔한 죽음은 **숫자가 낡는 것**이다. "식대 비과세는 월 20만원"이라고 적어
 * 두면 한도가 바뀌는 순간 그 글은 거짓말이 되고, 아무도 고치러 오지 않는다.
 *
 * 그래서 본문에 `{{rates:경로}}` 토큰을 쓰면 빌드할 때 실제 요율 데이터에서 값을 꺼내
 * 넣는다. 요율이 바뀌면 계산기와 글이 **함께** 갱신된다. 이 사이트가 계산기에서 지켜 온
 * 규칙("요율을 코드에 하드코딩하지 않는다")을 글에도 그대로 적용한 것이다.
 *
 * 못 찾는 토큰이 있으면 **빌드를 세운다.** 오타 하나 때문에 `{{rates:...}}`가 화면에
 * 그대로 찍히는 것보다 배포가 막히는 편이 낫다.
 */

const DIR = join(process.cwd(), 'content', 'blog');

export interface Post {
  slug: string;
  title: string;
  description: string;
  /** YYYY-MM-DD */
  date: string;
  /** 내용을 고친 날. 없으면 date와 같다. */
  updated?: string;
  tags: string[];
  /** 이 글과 짝이 되는 계산기 — 글 끝에서 안내한다 */
  calc?: string;
  calcLabel?: string;
  body: string;
}

/** 아주 단순한 frontmatter 파서. 이 글들은 우리가 쓰므로 문법을 넓게 받을 이유가 없다. */
function parseFrontmatter(raw: string): { meta: Record<string, string>; body: string } {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!m) return { meta: {}, body: raw };
  const meta: Record<string, string> = {};
  for (const line of m[1].split(/\r?\n/)) {
    const i = line.indexOf(':');
    if (i < 0) continue;
    meta[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
  return { meta, body: m[2] };
}

/** `[a, b, c]` 또는 `a, b, c` 둘 다 받는다 */
function parseTags(v: string | undefined): string[] {
  if (!v) return [];
  return v.replace(/^\[|\]$/g, '').split(',').map(s => s.trim()).filter(Boolean);
}

const TOKEN = /\{\{rates:([\w.]+)(?:\|(\w+))?\}\}/g;

/**
 * 계산 결과 토큰.
 *
 *   {{salary:5000}}         연봉 5,000만원의 월 실수령액
 *   {{compare:3000-3500}}   두 연봉의 월 실수령 차이
 *
 * 요율 토큰과 같은 이유로 있다 — 글에 "월 349,687원"이라고 적어 두면 요율이 바뀌는 순간
 * 그 문장이 거짓말이 되고 아무도 고치러 오지 않는다. 계산기와 같은 함수를 쓰므로 글과
 * 계산기가 서로 다른 답을 할 수 없다.
 */
const CALC_TOKEN = /\{\{(salary|compare):([\d-]+)\}\}/g;

function fillCalc(body: string, year: string): string {
  return body.replace(CALC_TOKEN, (whole, kind: string, arg: string) => {
    const won = (n: number) => Math.round(n).toLocaleString('ko-KR');

    if (kind === 'salary') {
      const man = Number(arg);
      if (!Number.isInteger(man)) throw new Error(`블로그 토큰 ${whole}: 연봉이 정수가 아니다`);
      return `${won(resultFor(man, year).monthlyNet)}원`;
    }

    // compare — 실제로 페이지가 있는 쌍만 받는다. 없는 쌍을 인용하면 링크도 못 건다.
    const pair = parseComparePair(arg);
    if (!pair) throw new Error(`블로그 토큰 ${whole}: 비교 페이지가 없는 조합이다`);
    const gap = resultFor(pair.to, year).monthlyNet - resultFor(pair.from, year).monthlyNet;
    return `월 +${won(gap)}원`;
  });
}

/** 점 표기 경로로 요율 데이터를 판다. 없으면 undefined. */
function dig(obj: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>(
    (acc, k) => (acc && typeof acc === 'object' ? (acc as Record<string, unknown>)[k] : undefined),
    obj,
  );
}

function formatValue(v: unknown, fmt: string | undefined, token: string): string {
  if (typeof v === 'number') {
    if (fmt === 'pct') return `${(v * 100).toFixed(3).replace(/\.?0+$/, '')}%`;
    // 9억을 "90,000만원"이라고 쓰면 읽히지 않는다 — 화면 곳곳에서 쓰는 표기를 그대로 쓴다
    if (fmt === 'man') return manLabel(v / 10_000);
    return `${v.toLocaleString('ko-KR')}원`;
  }
  if (typeof v === 'string') return v;
  throw new Error(`블로그 토큰 ${token}의 값이 숫자도 문자열도 아니다`);
}

/**
 * `{{rates:...}}`를 실제 값으로 바꾼다.
 *
 * 못 찾으면 던진다 — 조용히 비워 두면 문장이 "식대 비과세 한도는 입니다"가 된다.
 */
export function fillRates(body: string, year = latestYear()): string {
  const rates = getRates(year) as unknown;
  const withCalc = fillCalc(body, year);
  const filled = withCalc.replace(TOKEN, (whole, path: string, fmt: string | undefined) => {
    const v = dig(rates, path);
    if (v === undefined) {
      throw new Error(
        `블로그 토큰을 못 찾았다: ${whole} (${year}년 요율에 '${path}'가 없다)`,
      );
    }
    return formatValue(v, fmt, whole);
  });

  // 남아 있는 {{...}}는 전부 오타다.
  //
  // 위 정규식들은 `[\w.]`만 받는데 \w에 한글이 안 들어간다. 그래서 `{{rates:없는.경로}}`
  // 처럼 한글로 오타를 내면 **매치조차 안 돼서 조용히 통과**했다(2026-08-23, 테스트가 잡음).
  // 종류를 늘릴 때마다 정규식을 넓히는 대신, 마지막에 한 번 훑어 남은 걸 전부 잡는다.
  const leftover = filled.match(/\{\{[^}]*\}\}/g);
  if (leftover) {
    throw new Error(`블로그에 알 수 없는 토큰이 남았다: ${leftover.join(', ')}`);
  }
  return filled;
}

export function getAllPosts(): Post[] {
  if (!existsSync(DIR)) return [];
  return readdirSync(DIR)
    .filter(f => f.endsWith('.md'))
    .map(f => {
      const { meta, body } = parseFrontmatter(readFileSync(join(DIR, f), 'utf-8'));
      return {
        slug: f.replace(/\.md$/, ''),
        title: meta.title ?? '(제목 없음)',
        description: meta.description ?? '',
        date: meta.date ?? '',
        updated: meta.updated || undefined,
        tags: parseTags(meta.tags),
        calc: meta.calc || undefined,
        calcLabel: meta.calcLabel || undefined,
        body,
      };
    })
    // 최신 글이 위로
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
}

export function getPostBySlug(slug: string): Post | null {
  return getAllPosts().find(p => p.slug === slug) ?? null;
}

const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/**
 * 링크 주소를 검사한다.
 *
 * 우리가 쓴 글만 들어가지만, `javascript:`가 통과하는 변환기를 두는 것과 안 두는 것은
 * 다르다. 내부 경로와 http(s), mailto만 통과시킨다.
 */
function safeHref(href: string): string | null {
  const h = href.trim();
  if (/^\/(?!\/)/.test(h)) return h;                    // 내부 경로 (//는 프로토콜 상대라 제외)
  if (/^https?:\/\//i.test(h) || /^mailto:/i.test(h)) return h;
  return null;
}

/** 인라인 서식 — 굵게·링크·코드. 순서가 중요하다(코드 안의 것은 서식으로 보지 않는다). */
function inline(text: string): string {
  let out = escapeHtml(text);
  out = out.replace(/`([^`]+)`/g, '<code>$1</code>');
  out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  out = out.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (whole, label: string, href: string) => {
    const safe = safeHref(href);
    // 통과 못 한 주소는 링크를 없애고 글자만 남긴다 — 페이지가 깨지는 것보다 낫다
    if (!safe) return label;
    const external = /^https?:\/\//i.test(safe);
    const attrs = external ? ' target="_blank" rel="noopener noreferrer"' : '';
    return `<a href="${escapeHtml(safe)}"${attrs}>${label}</a>`;
  });
  return out;
}

/**
 * 마크다운 → HTML.
 *
 * 블록 단위로 자른 뒤 종류를 판별한다. 정규식을 문서 전체에 순서대로 먹이는 방식은
 * 표처럼 여러 줄이 한 덩어리인 문법에서 반드시 깨진다.
 *
 * **표를 지원하는 게 이 변환기의 존재 이유다.** 세금 글은 세율·기한·구간을 표로 보여줘야
 * 읽힌다. WhenStage 쪽 변환기에는 표가 없어 그대로 가져올 수 없었다.
 */
export function markdownToHtml(md: string): string {
  const blocks = md.trim().split(/\r?\n\s*\r?\n/);
  const out: string[] = [];

  for (const raw of blocks) {
    const block = raw.trim();
    if (!block) continue;
    const lines = block.split(/\r?\n/);

    // 헤딩
    const h = block.match(/^(#{2,3})\s+(.+)$/);
    if (h && lines.length === 1) {
      const level = h[1].length;
      out.push(`<h${level}>${inline(h[2])}</h${level}>`);
      continue;
    }

    // 표 — 두 번째 줄이 구분선이면 표로 본다
    if (lines.length >= 2 && /^\|?[\s:-]+\|[\s|:-]*$/.test(lines[1])) {
      const cells = (line: string) =>
        line.replace(/^\||\|$/g, '').split('|').map(c => c.trim());
      const head = cells(lines[0]);
      const body = lines.slice(2).map(cells);
      out.push(
        '<div class="tableWrap" tabindex="0" role="region" aria-label="표">'
        + '<table><thead><tr>'
        + head.map(c => `<th scope="col">${inline(c)}</th>`).join('')
        + '</tr></thead><tbody>'
        + body.map(r =>
          '<tr>' + r.map((c, i) =>
            i === 0 ? `<th scope="row">${inline(c)}</th>` : `<td>${inline(c)}</td>`).join('') + '</tr>').join('')
        + '</tbody></table></div>',
      );
      continue;
    }

    // 목록
    if (lines.every(l => /^[-*]\s+/.test(l))) {
      out.push('<ul>' + lines.map(l => `<li>${inline(l.replace(/^[-*]\s+/, ''))}</li>`).join('') + '</ul>');
      continue;
    }
    if (lines.every(l => /^\d+\.\s+/.test(l))) {
      out.push('<ol>' + lines.map(l => `<li>${inline(l.replace(/^\d+\.\s+/, ''))}</li>`).join('') + '</ol>');
      continue;
    }

    // 인용
    if (lines.every(l => /^>\s?/.test(l))) {
      out.push(`<blockquote><p>${inline(lines.map(l => l.replace(/^>\s?/, '')).join(' '))}</p></blockquote>`);
      continue;
    }

    // 그 밖에는 단락
    out.push(`<p>${inline(lines.join(' '))}</p>`);
  }

  return out.join('\n');
}

/** 글 하나를 화면에 낼 수 있는 HTML로. 토큰 치환 → 마크다운 변환 순서다. */
export function renderPost(post: Post): string {
  return markdownToHtml(fillRates(post.body));
}
