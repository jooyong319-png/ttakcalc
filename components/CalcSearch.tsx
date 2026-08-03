'use client';
import { useState, useMemo, useRef, useId, useEffect } from 'react';
import { SEARCH_ITEMS, NUMERIC_ROUTES, type SearchItem, type NumericRoute } from '@/lib/search';
import s from './CalcSearch.module.css';

const MAX = 8;
const fmt = (n: number) => n.toLocaleString('ko-KR');

/* ── 초성 검색 ────────────────────────────────────────────────────
   "ㅇㅂ"으로 연봉이 안 나오면 한국어 검색바로서 어색하다. 한글 음절은
   0xAC00부터 초성 19 × 중성 21 × 종성 28 순서로 배열돼 있어 나눗셈으로 초성을 뽑는다. */
const CHO = 'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ';

function toCho(text: string): string {
  let out = '';
  // 문자열 for..of는 tsconfig target에서 downlevelIteration을 요구한다
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i);
    if (c >= 0xac00 && c <= 0xd7a3) out += CHO[Math.floor((c - 0xac00) / 588)];
    else out += text[i];
  }
  return out;
}
/** 질의가 자음만으로 이뤄졌는가 — 그럴 때만 초성 매칭을 켠다(오탐 방지) */
const isChoQuery = (q: string) =>
  q.length > 0 && q.split('').every(ch => CHO.indexOf(ch) >= 0);

type Hit =
  | { kind: 'calc'; item: SearchItem; score: number }
  | { kind: 'num'; route: NumericRoute; value: number };

function searchCalcs(q: string): Hit[] {
  const query = q.trim().toLowerCase();
  if (!query) return [];
  const cho = isChoQuery(query);

  const out: Hit[] = [];
  for (const item of SEARCH_ITEMS) {
    let score = 0;
    const name = item.name.toLowerCase();
    if (cho) {
      // 초성 질의는 이름에만 건다 — 설명·동의어까지 열면 아무거나 걸린다
      if (toCho(name).replace(/\s/g, '').includes(query)) score = 40;
    } else if (name.startsWith(query)) score = 100;
    else if (name.includes(query)) score = 80;
    else if (item.haystack.includes(query)) score = 50;
    if (score) out.push({ kind: 'calc', item, score });
  }
  return out.sort((a, b) => (b as { score: number }).score - (a as { score: number }).score);
}

/** "5000", "연봉 5000" 처럼 숫자가 들어오면 만들 수 있는 페이지를 제안한다 */
function searchNumeric(q: string): Hit[] {
  const digits = q.replace(/[,\s]/g, '').match(/\d+/);
  if (!digits) return [];
  const n = Number(digits[0]);
  if (!Number.isFinite(n) || n <= 0) return [];

  const text = q.replace(/[\d,]/g, '').trim().toLowerCase();
  const out: Hit[] = [];
  for (const r of NUMERIC_ROUTES) {
    if (n < r.min || n > r.max) continue;
    // 구간에 딱 맞지 않으면 가장 가까운 유효값으로 붙인다(예: 5,050 → 5,000)
    const snapped = r.min + Math.round((n - r.min) / r.step) * r.step;
    if (snapped < r.min || snapped > r.max) continue;
    // 숫자와 함께 말이 들어왔으면 그 말이 맞는 라우트만 남긴다("연봉 5000" → 연봉만)
    if (text && !`${r.label}${r.unit}`.toLowerCase().includes(text)) continue;
    out.push({ kind: 'num', route: r, value: snapped });
  }
  return out;
}

export function CalcSearch() {
  const [q, setQ] = useState('');
  const [active, setActive] = useState(0);
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  const hits = useMemo(() => {
    if (!q.trim()) return [];
    return [...searchNumeric(q), ...searchCalcs(q)].slice(0, MAX);
  }, [q]);

  useEffect(() => setActive(0), [q]);

  // 바깥을 누르면 닫는다. 목록이 열린 채로 남으면 아래 내용이 계속 가려진다.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  const hrefOf = (h: Hit) => (h.kind === 'calc' ? h.item.href : `${h.route.base}/${h.value}`);
  const show = open && hits.length > 0;

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') { setOpen(false); return; }
    if (!show) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(i => (i + 1) % hits.length); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(i => (i - 1 + hits.length) % hits.length); }
    else if (e.key === 'Enter') {
      e.preventDefault();
      window.location.href = hrefOf(hits[active]);
    }
  }

  return (
    <div className={s.box} ref={boxRef}>
      <div className={s.field}>
        <span className={s.icon} aria-hidden="true">⌕</span>
        <input
          type="search"
          className={s.input}
          value={q}
          onChange={e => { setQ(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="뭘 계산해 드릴까요?"
          aria-label="계산기 검색"
          role="combobox"
          aria-expanded={show}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={show ? `${listId}-${active}` : undefined}
          autoComplete="off"
        />
      </div>

      {show && (
        <ul className={s.list} id={listId} role="listbox" aria-label="검색 결과">
          {hits.map((h, i) => {
            const href = hrefOf(h);
            const tone = h.kind === 'calc' ? h.item.tone : h.route.tone;
            return (
              <li key={href} role="none">
                <a
                  id={`${listId}-${i}`}
                  role="option"
                  aria-selected={i === active}
                  href={href}
                  className={`${s.hit} ${s[tone]} ${i === active ? s.hitOn : ''}`}
                  onMouseEnter={() => setActive(i)}
                >
                  {h.kind === 'calc' ? (
                    <>
                      <span className={s.hitIcon} aria-hidden="true">{h.item.icon}</span>
                      <span className={s.hitBody}>
                        <span className={s.hitName}>{h.item.name}</span>
                        <span className={s.hitDesc}>{h.item.desc}</span>
                      </span>
                      <span className={s.hitTag}>{h.item.category}</span>
                    </>
                  ) : (
                    <>
                      <span className={s.hitIcon} aria-hidden="true">#</span>
                      <span className={s.hitBody}>
                        <span className={s.hitName}>
                          {h.route.label} {fmt(h.value)}{h.route.unit}
                        </span>
                        <span className={s.hitDesc}>바로 계산된 페이지로</span>
                      </span>
                      <span className={s.hitTag}>숫자</span>
                    </>
                  )}
                </a>
              </li>
            );
          })}
        </ul>
      )}

      {open && q.trim() && hits.length === 0 && (
        <p className={s.empty} role="status">
          &ldquo;{q.trim()}&rdquo;에 맞는 계산기가 없습니다. 필요한 계산기가 있으면 알려주세요.
        </p>
      )}
    </div>
  );
}
